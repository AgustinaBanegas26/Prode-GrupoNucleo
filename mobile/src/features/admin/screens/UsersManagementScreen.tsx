import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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

const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE   = '#0F4C81';

type Cliente = {
  id: number;
  cliente_id: string;
  nombre: string;
  habilitado: boolean;
  ultimo_acceso: string | null;
  created_at: string;
};

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

function ClienteCard({ cliente, theme, isDark, onToggle }: {
  cliente: Cliente; theme: any; isDark: boolean; onToggle: () => void;
}) {
  const initials = cliente.nombre?.substring(0, 2).toUpperCase() ?? 'CL';
  const lastAccess = cliente.ultimo_acceso
    ? new Date(cliente.ultimo_acceso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Nunca';

  return (
    <View style={[us.card, {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
      borderColor: isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.25)',
    }]}>
      <View style={us.avatar}>
        <Text style={us.avatarText}>{initials}</Text>
      </View>
      <View style={us.body}>
        <Text style={[us.name, { color: theme.colors.text }]}>{cliente.nombre}</Text>
        <Text style={[us.clienteId, { color: theme.colors.muted }]}>ID: {cliente.cliente_id}</Text>
        <Text style={[us.meta, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
          Último acceso: {lastAccess}
        </Text>
      </View>
      <Pressable
        onPress={onToggle}
        style={[us.toggleBtn, {
          backgroundColor: cliente.habilitado ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        }]}
      >
        <MaterialCommunityIcons
          name={cliente.habilitado ? 'account-check' : 'account-cancel'}
          size={18}
          color={cliente.habilitado ? '#22C55E' : '#ef4444'}
        />
        <Text style={[us.toggleText, { color: cliente.habilitado ? '#22C55E' : '#ef4444' }]}>
          {cliente.habilitado ? 'Activo' : 'Bloqueado'}
        </Text>
      </Pressable>
    </View>
  );
}

const us = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: CELESTE_DARK, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '800' },
  clienteId: { fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 11, fontWeight: '500' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  toggleText: { fontSize: 12, fontWeight: '700' },
});

export function UsersManagementScreen() {
  const { theme } = useAppTheme();
  const isDark = theme.isDark;
  const router = useRouter();

  const [clientes, setClientes]       = useState<Cliente[]>([]);
  const [loading,  setLoading]        = useState(true);
  const [query,    setQuery]          = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('id, cliente_id, nombre, habilitado, ultimo_acceso, created_at')
      .order('nombre', { ascending: true });
    if (!error) setClientes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleToggle = async (cliente: Cliente) => {
    const { error } = await supabase
      .from('clientes')
      .update({ habilitado: !cliente.habilitado })
      .eq('id', cliente.id);
    if (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del usuario');
    } else {
      setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, habilitado: !c.habilitado } : c));
    }
  };

  const filtered = useMemo(() => {
    let arr = [...clientes];
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.cliente_id.includes(q)
      );
    }
    if (statusFilter === 'active')  arr = arr.filter(c => c.habilitado);
    if (statusFilter === 'blocked') arr = arr.filter(c => !c.habilitado);
    return arr;
  }, [clientes, query, statusFilter]);

  const bg = isDark ? '#0D0D0D' : '#F5F7FA';

  return (
    <ScrollView style={[s.root, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[CELESTE_DARK, DEEP_BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.circleL} />
        <FadeSlide delay={0}>
          <View style={s.headerRow}>
            <Pressable onPress={() => router.push('/(admin)')} style={s.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Clientes</Text>
              <Text style={s.sub}>{clientes.length} usuarios registrados</Text>
            </View>
            <Pressable onPress={fetch} style={s.refreshBtn}>
              <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
            </Pressable>
          </View>
        </FadeSlide>
      </LinearGradient>

      <View style={s.content}>
        <FadeSlide delay={40}>
          <View style={[s.searchBox, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
            borderColor: isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.25)',
          }]}>
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
              { value: 'all',     label: 'Todos',      color: CELESTE_DARK },
              { value: 'active',  label: 'Activos',    color: '#22C55E'   },
              { value: 'blocked', label: 'Bloqueados', color: '#ef4444'   },
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
        </FadeSlide>

        {loading ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: theme.colors.muted, fontWeight: '600' }}>Cargando...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderColor: isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.25)' }]}>
            <Text style={{ fontSize: 40 }}>👥</Text>
            <Text style={[s.emptyText, { color: theme.colors.muted }]}>
              {query ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </Text>
          </View>
        ) : (
          filtered.map((cliente, index) => (
            <FadeSlide key={cliente.id} delay={60 + index * 25}>
              <ClienteCard
                cliente={cliente}
                theme={theme}
                isDark={isDark}
                onToggle={() => handleToggle(cliente)}
              />
            </FadeSlide>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  header:  { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  circleL: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: 'rgba(110,198,255,0.20)', top: -60, right: -40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  refreshBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title:   { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub:     { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  content: { padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 50, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14 },
  filtersRow: { gap: 8, paddingVertical: 2, marginBottom: 16 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, marginRight: 4 },
  filterText: { fontSize: 12, fontWeight: '700' },
  emptyCard: { alignItems: 'center', paddingVertical: 48, borderRadius: 20, borderWidth: 1, gap: 8 },
  emptyText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
