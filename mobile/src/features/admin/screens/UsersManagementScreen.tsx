import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { supabase } from '../../../lib/supabase';
import { useRanking } from '../../content/api/ranking';

const CELESTE      = '#6EC6FF';
const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE    = '#0F4C81';
const VERDE        = '#22C55E';
const ROJO         = '#ef4444';

type Cliente = {
  id: number;
  cliente_id: string;
  nombre: string;
  email: string | null;
  habilitado: boolean;
  primer_login: boolean;
  ultimo_acceso: string | null;
  created_at: string;
};

type FormState = {
  id?: number;
  cliente_id: string;
  nombre: string;
  email: string;
  habilitado: boolean;
};

function emptyForm(): FormState {
  return { cliente_id: '', nombre: '', email: '', habilitado: true };
}

function FadeSlide({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export function UsersManagementScreen() {
  const { theme } = useAppTheme();
  const isDark = theme.isDark;
  const router = useRouter();

  const [clientes, setClientes]       = useState<Cliente[]>([]);
  const [loading,  setLoading]        = useState(true);
  const [query,    setQuery]          = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState<FormState>(emptyForm());
  const [isEdit, setIsEdit]           = useState(false);

  const { data: ranking = [] } = useRanking('general');

  const rankingMap = useMemo(() => {
    const m: Record<string, { points: number; position: number }> = {};
    for (const r of ranking) {
      m[r.id] = { points: r.points, position: r.position };
    }
    return m;
  }, [ranking]);

  const fetchClientes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('id, cliente_id, nombre, email, habilitado, primer_login, ultimo_acceso, created_at')
      .order('nombre', { ascending: true });
    if (!error) setClientes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchClientes(); }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('clientes-admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, fetchClientes)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleToggle = async (cliente: Cliente) => {
    const { error } = await supabase
      .from('clientes')
      .update({ habilitado: !cliente.habilitado })
      .eq('id', cliente.id);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, habilitado: !c.habilitado } : c));
    }
  };

  const openCreate = () => {
    setForm(emptyForm());
    setIsEdit(false);
    setModalVisible(true);
  };

  const openEdit = (c: Cliente) => {
    setForm({
      id: c.id,
      cliente_id: c.cliente_id,
      nombre: c.nombre,
      email: c.email ?? '',
      habilitado: c.habilitado,
    });
    setIsEdit(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.cliente_id.trim()) { Alert.alert('Error', 'El ID de cliente es obligatorio'); return; }
    if (!form.nombre.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (isEdit && form.id) {
        const { error } = await supabase
          .from('clientes')
          .update({
            cliente_id: form.cliente_id.trim(),
            nombre: form.nombre.trim(),
            email: form.email.trim() || null,
            habilitado: form.habilitado,
          })
          .eq('id', form.id);
        if (error) throw new Error(error.message);
      } else {
        // Crear — password inicial clientesgn123 no se toca aquí, primer_login=true por defecto
        const { error } = await supabase
          .from('clientes')
          .insert({
            cliente_id: form.cliente_id.trim(),
            nombre: form.nombre.trim(),
            email: form.email.trim() || null,
            habilitado: true,
            primer_login: true,
            must_change_password: true,
          });
        if (error) throw new Error(error.message);
      }
      setModalVisible(false);
      await fetchClientes();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (c: Cliente) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Eliminar a ${c.nombre} (ID: ${c.cliente_id})? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('clientes').delete().eq('id', c.id);
            if (error) Alert.alert('Error', error.message);
            else await fetchClientes();
          },
        },
      ],
    );
  };

  const resetPassword = async (c: Cliente) => {
    Alert.alert(
      'Resetear contraseña',
      `Se reseteará la contraseña de ${c.nombre}. Al próximo inicio usará la contraseña inicial.`,
      [
        { text: 'Cancelar' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('clientes')
              .update({ password_hash: null, primer_login: true, must_change_password: true })
              .eq('id', c.id);
            if (error) Alert.alert('Error', error.message);
            else Alert.alert('✓', 'Contraseña reseteada. El usuario debe ingresar con la contraseña inicial.');
          },
        },
      ],
    );
  };

  const filtered = useMemo(() => {
    let arr = [...clientes];
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter(c => c.nombre.toLowerCase().includes(q) || c.cliente_id.includes(q));
    }
    if (statusFilter === 'active')  arr = arr.filter(c => c.habilitado);
    if (statusFilter === 'blocked') arr = arr.filter(c => !c.habilitado);
    return arr;
  }, [clientes, query, statusFilter]);

  const bg = isDark ? '#0D0D0D' : '#F5F7FA';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff';
  const cardBorder = isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.25)';

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      {/* Header */}
      <LinearGradient colors={[CELESTE_DARK, DEEP_BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.circleL} />
        <View style={s.headerRow}>
          <Pressable onPress={() => router.push('/(admin)')} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Clientes</Text>
            <Text style={s.sub}>{clientes.length} usuarios registrados</Text>
          </View>
          <Pressable onPress={openCreate} style={s.actionBtn}>
            <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={fetchClientes} style={[s.actionBtn, { marginLeft: 6 }]}>
            <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Search + filters */}
      <View style={s.controls}>
        <View style={[s.searchBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.muted} />
          <TextInput
            style={[s.searchInput, { color: theme.colors.text }]}
            placeholder="Buscar por nombre o ID..."
            placeholderTextColor={theme.colors.muted}
            value={query}
            onChangeText={setQuery}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <MaterialCommunityIcons name="close" size={16} color={theme.colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
          {[
            { value: 'all',     label: `Todos (${clientes.length})`,              color: CELESTE_DARK },
            { value: 'active',  label: `Activos (${clientes.filter(c => c.habilitado).length})`,   color: VERDE },
            { value: 'blocked', label: `Bloqueados (${clientes.filter(c => !c.habilitado).length})`, color: ROJO },
          ].map(f => (
            <Pressable
              key={f.value}
              onPress={() => setStatusFilter(f.value as any)}
              style={[s.filterBtn, {
                borderColor: statusFilter === f.value ? f.color : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
                backgroundColor: statusFilter === f.value ? `${f.color}18` : 'transparent',
              }]}
            >
              <Text style={[s.filterText, { color: statusFilter === f.value ? f.color : theme.colors.muted }]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 10, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[s.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={{ fontSize: 40 }}>👥</Text>
            <Text style={[s.emptyText, { color: theme.colors.muted }]}>
              {loading ? 'Cargando...' : query ? 'Sin resultados' : 'No hay clientes registrados'}
            </Text>
            {!loading && !query && (
              <Pressable onPress={openCreate} style={[s.emptyBtn, { backgroundColor: CELESTE_DARK }]}>
                <MaterialCommunityIcons name="account-plus" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Crear primer cliente</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item: cliente }) => {
          const rankInfo = rankingMap[String(cliente.cliente_id)];
          const initials = cliente.nombre?.substring(0, 2).toUpperCase() ?? 'CL';
          const lastAccess = cliente.ultimo_acceso
            ? new Date(cliente.ultimo_acceso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
            : 'Nunca';

          return (
            <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Top row */}
              <View style={s.cardTop}>
                <View style={s.avatarBox}>
                  <Text style={s.avatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[s.clienteName, { color: theme.colors.text }]}>{cliente.nombre}</Text>
                  <Text style={[s.clienteIdText, { color: CELESTE_DARK }]}>ID: {cliente.cliente_id}</Text>
                  {cliente.email ? (
                    <Text style={[s.metaText, { color: theme.colors.muted }]}>{cliente.email}</Text>
                  ) : null}
                  <Text style={[s.metaText, { color: theme.colors.muted }]}>Último acceso: {lastAccess}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View style={[s.statusBadge, { backgroundColor: cliente.habilitado ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                    <MaterialCommunityIcons
                      name={cliente.habilitado ? 'account-check' : 'account-cancel'}
                      size={14}
                      color={cliente.habilitado ? VERDE : ROJO}
                    />
                    <Text style={[s.statusText, { color: cliente.habilitado ? VERDE : ROJO }]}>
                      {cliente.habilitado ? 'Activo' : 'Bloqueado'}
                    </Text>
                  </View>
                  {rankInfo && (
                    <View style={s.rankBadge}>
                      <Text style={[s.rankText, { color: CELESTE_DARK }]}>
                        #{rankInfo.position} · {rankInfo.points}pts
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Actions */}
              <View style={s.cardActions}>
                <Pressable onPress={() => openEdit(cliente)} style={[s.actBtn, { backgroundColor: CELESTE_DARK + '18' }]}>
                  <MaterialCommunityIcons name="pencil" size={14} color={CELESTE_DARK} />
                  <Text style={[s.actBtnText, { color: CELESTE_DARK }]}>Editar</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleToggle(cliente)}
                  style={[s.actBtn, { backgroundColor: cliente.habilitado ? 'rgba(239,68,68,0.10)' : 'rgba(34,197,94,0.10)' }]}
                >
                  <MaterialCommunityIcons
                    name={cliente.habilitado ? 'account-off' : 'account-check'}
                    size={14}
                    color={cliente.habilitado ? ROJO : VERDE}
                  />
                  <Text style={[s.actBtnText, { color: cliente.habilitado ? ROJO : VERDE }]}>
                    {cliente.habilitado ? 'Bloquear' : 'Activar'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => resetPassword(cliente)} style={[s.actBtn, { backgroundColor: 'rgba(245,158,11,0.10)' }]}>
                  <MaterialCommunityIcons name="lock-reset" size={14} color="#F59E0B" />
                  <Text style={[s.actBtnText, { color: '#F59E0B' }]}>Reset pwd</Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(cliente)} style={[s.actBtn, { backgroundColor: 'rgba(239,68,68,0.10)' }]}>
                  <MaterialCommunityIcons name="delete" size={14} color={ROJO} />
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* Modal crear / editar */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={[m.backdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[m.sheet, { backgroundColor: isDark ? '#151515' : '#fff', borderColor: cardBorder }]}>
            <View style={m.sheetHeader}>
              <Text style={[m.sheetTitle, { color: theme.colors.text }]}>
                {isEdit ? 'Editar cliente' : 'Nuevo cliente'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={theme.colors.muted} />
              </Pressable>
            </View>

            <ScrollView style={m.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={[m.label, { color: theme.colors.muted }]}>ID de cliente *</Text>
              <TextInput
                value={form.cliente_id}
                onChangeText={(v) => setForm(f => ({ ...f, cliente_id: v }))}
                placeholder="Ej: 5456"
                placeholderTextColor={theme.colors.muted}
                keyboardType="default"
                editable={!isEdit}
                style={[m.input, {
                  color: isEdit ? theme.colors.muted : theme.colors.text,
                  borderColor: cardBorder,
                  backgroundColor: isEdit
                    ? (isDark ? 'rgba(255,255,255,0.03)' : '#F0F0F0')
                    : (isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA'),
                }]}
              />
              {isEdit && (
                <Text style={[m.hint, { color: theme.colors.muted }]}>El ID no puede modificarse luego de creado</Text>
              )}

              <Text style={[m.label, { color: theme.colors.muted }]}>Nombre completo *</Text>
              <TextInput
                value={form.nombre}
                onChangeText={(v) => setForm(f => ({ ...f, nombre: v }))}
                placeholder="Ej: Juan García"
                placeholderTextColor={theme.colors.muted}
                style={[m.input, { color: theme.colors.text, borderColor: cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA' }]}
              />

              <Text style={[m.label, { color: theme.colors.muted }]}>Email (opcional)</Text>
              <TextInput
                value={form.email}
                onChangeText={(v) => setForm(f => ({ ...f, email: v }))}
                placeholder="usuario@email.com"
                placeholderTextColor={theme.colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[m.input, { color: theme.colors.text, borderColor: cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA' }]}
              />

              {!isEdit && (
                <View style={m.infoBox}>
                  <MaterialCommunityIcons name="information-outline" size={16} color={CELESTE_DARK} />
                  <Text style={[m.infoText, { color: theme.colors.muted }]}>
                    El cliente se crea con contraseña inicial: <Text style={{ color: CELESTE_DARK, fontWeight: '700' }}>clientesgn123</Text>. Deberá cambiarla en el primer ingreso.
                  </Text>
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={[m.footer, { borderTopColor: cardBorder }]}>
              <Pressable onPress={() => setModalVisible(false)} style={[m.cancelBtn, { borderColor: cardBorder }]}>
                <Text style={{ color: theme.colors.muted, fontWeight: '700' }}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} style={[m.saveBtn, { opacity: saving ? 0.7 : 1 }]}>
                <LinearGradient colors={[CELESTE_DARK, DEEP_BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={m.saveBtnGrad}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                    {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  circleL:    { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: `${CELESTE}25`, top: -60, right: -40 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  actionBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title:      { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub:        { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  controls:   { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  searchBox:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 46, borderRadius: 14, borderWidth: 1 },
  searchInput:{ flex: 1, fontSize: 14 },
  filtersRow: { gap: 8, paddingVertical: 2, paddingBottom: 4 },
  filterBtn:  { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '700' },
  card:       { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  cardTop:    { flexDirection: 'row', gap: 12 },
  avatarBox:  { width: 44, height: 44, borderRadius: 22, backgroundColor: CELESTE_DARK, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  clienteName:{ fontSize: 14, fontWeight: '800' },
  clienteIdText: { fontSize: 12, fontWeight: '700' },
  metaText:   { fontSize: 11, fontWeight: '500' },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  rankBadge:  { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(61,165,245,0.10)' },
  rankText:   { fontSize: 11, fontWeight: '700' },
  cardActions:{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  actBtnText: { fontSize: 12, fontWeight: '700' },
  emptyCard:  { alignItems: 'center', paddingVertical: 48, borderRadius: 20, borderWidth: 1, gap: 12, marginTop: 8 },
  emptyText:  { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  emptyBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginTop: 4 },
});

const m = StyleSheet.create({
  backdrop:     { flex: 1, justifyContent: 'flex-end' },
  sheet:        { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, maxHeight: '85%', overflow: 'hidden' },
  sheetHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  sheetTitle:   { fontSize: 18, fontWeight: '800' },
  body:         { paddingHorizontal: 20 },
  label:        { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:        { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14, marginBottom: 2 },
  hint:         { fontSize: 11, marginBottom: 4, fontStyle: 'italic' },
  infoBox:      { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: 12, backgroundColor: 'rgba(61,165,245,0.08)', marginTop: 12 },
  infoText:     { flex: 1, fontSize: 12, lineHeight: 18 },
  footer:       { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1 },
  cancelBtn:    { flex: 1, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn:      { flex: 2, borderRadius: 16, overflow: 'hidden' },
  saveBtnGrad:  { height: 48, alignItems: 'center', justifyContent: 'center' },
});
