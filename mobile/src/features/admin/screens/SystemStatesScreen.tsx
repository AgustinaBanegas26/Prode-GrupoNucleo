import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Alert,
  Animated,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { supabase } from '../../../lib/supabase';
import { useAdminActivityStore } from '../store/adminActivityStore';

const CELESTE = '#6EC6FF';
const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE = '#0F4C81';
const DORADO = '#F59E0B';
const PLATA = '#94A3B8';

export interface SystemState {
  id: string;
  name: string;
  key: string;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export function SystemStatesScreen() {
  const { theme } = useAppTheme();
  const isDark = theme.isDark;
  const router = useRouter();
  const qc = useQueryClient();
  const log = useAdminActivityStore((s) => s.log);

  // States query
  const { data: states = [], isLoading, error } = useQuery<SystemState[]>({
    queryKey: ['system-states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_states')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    }
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('system-states-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_states' }, () => {
        qc.invalidateQueries({ queryKey: ['system-states'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('system_states')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['system-states'] });
      const stateObj = states.find(s => s.id === variables.id);
      log({
        action: 'update',
        module: 'system_states',
        title: `Estado '${stateObj?.name ?? 'desconocido'}' toggled to ${variables.is_active ? 'activo' : 'inactivo'}`
      });
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: { id?: string; name: string; key: string; is_active: boolean; description?: string }) => {
      const { error } = await supabase
        .from('system_states')
        .upsert({
          ...input,
          updated_at: new Date().toISOString()
        });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['system-states'] });
      log({
        action: variables.id ? 'update' : 'create',
        module: 'system_states',
        title: `Estado '${variables.name}' guardado correctamente`
      });
      setFormVisible(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('system_states')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['system-states'] });
      log({
        action: 'delete',
        module: 'system_states',
        title: `Estado con ID ${id} eliminado`
      });
    }
  });

  // UI state variables
  const [formVisible, setFormVisible] = useState(false);
  const [editingState, setEditingState] = useState<SystemState | null>(null);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [search, setSearch] = useState('');

  const resetForm = () => {
    setEditingState(null);
    setName('');
    setKey('');
    setDescription('');
    setIsActive(false);
  };

  const handleEdit = (state: SystemState) => {
    setEditingState(state);
    setName(state.name);
    setKey(state.key);
    setDescription(state.description ?? '');
    setIsActive(state.is_active);
    setFormVisible(true);
  };

  const handleDelete = (state: SystemState) => {
    Alert.alert(
      '⚠️ Eliminar Estado',
      `¿Estás seguro de que querés eliminar el estado "${state.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(state.id);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo eliminar el estado');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !key.trim()) {
      Alert.alert('Campos incompletos', 'Por favor ingresá nombre y clave.');
      return;
    }
    try {
      await upsertMutation.mutateAsync({
        id: editingState?.id,
        name: name.trim(),
        key: key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        description: description.trim(),
        is_active: isActive
      });
    } catch (e: any) {
      Alert.alert('Error al guardar', e.message || 'No se pudo guardar el estado.');
    }
  };

  const filteredStates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return states.filter(s => s.name.toLowerCase().includes(q) || s.key.toLowerCase().includes(q));
  }, [states, search]);

  const bg = isDark ? '#0D0D0D' : '#F5F7FA';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff';
  const cardBorder = isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.25)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#fff';

  return (
    <ScrollView style={[s.root, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={[CELESTE_DARK, DEEP_BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.circleL} />
        <View style={s.circleS} />
        <View style={s.headerRow}>
          <Pressable onPress={() => router.push('/(admin)')} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View style={[s.iconBox, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <MaterialCommunityIcons name="tune" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Estado del Sistema</Text>
            <Text style={s.sub}>Gestión de variables de estado global</Text>
          </View>
          <Pressable
            onPress={() => {
              resetForm();
              setFormVisible(true);
            }}
            style={s.addBtn}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={s.content}>
        {/* Search Bar */}
        <View style={[s.searchBox, { backgroundColor: inputBg, borderColor: cardBorder }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar estado..."
            placeholderTextColor={theme.colors.placeholder}
            style={[s.searchInput, { color: theme.colors.text }]}
            autoCapitalize="none"
          />
        </View>

        {/* Loading Indicator */}
        {isLoading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={CELESTE_DARK} />
            <Text style={{ color: theme.colors.muted, marginTop: 12 }}>Cargando estados...</Text>
          </View>
        ) : filteredStates.length === 0 ? (
          <View style={s.center}>
            <MaterialCommunityIcons name="cloud-off-outline" size={48} color={theme.colors.muted} />
            <Text style={[s.emptyText, { color: theme.colors.muted }]}>No se encontraron variables de estado</Text>
          </View>
        ) : (
          <View style={s.list}>
            {filteredStates.map((state) => {
              const toggling = toggleMutation.isPending && toggleMutation.variables?.id === state.id;
              return (
                <View key={state.id} style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={s.cardBody}>
                    <View style={s.row}>
                      <Text style={[s.cardTitle, { color: theme.colors.text }]}>{state.name}</Text>
                      <View style={[s.badge, { backgroundColor: state.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                        <Text style={[s.badgeText, { color: state.is_active ? '#22C55E' : '#EF4444' }]}>
                          {state.is_active ? 'Activo' : 'Inactivo'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[s.cardKey, { color: CELESTE }]}>Clave: {state.key}</Text>
                    {state.description ? (
                      <Text style={[s.cardDesc, { color: theme.colors.textSecondary }]}>{state.description}</Text>
                    ) : null}
                  </View>

                  <View style={s.cardActions}>
                    {toggling ? (
                      <ActivityIndicator size="small" color={CELESTE_DARK} style={s.switchLoader} />
                    ) : (
                      <Switch
                        value={state.is_active}
                        onValueChange={(val) => toggleMutation.mutate({ id: state.id, is_active: val })}
                        trackColor={{ false: 'rgba(128,128,128,0.2)', true: CELESTE_DARK }}
                        thumbColor={state.is_active ? DORADO : PLATA}
                      />
                    )}
                    <View style={s.rowActions}>
                      <Pressable onPress={() => handleEdit(state)} style={[s.actionBtn, { backgroundColor: 'rgba(58,165,245,0.12)' }]}>
                        <MaterialCommunityIcons name="pencil" size={16} color={CELESTE_DARK} />
                      </Pressable>
                      <Pressable onPress={() => handleDelete(state)} style={[s.actionBtn, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                        <MaterialCommunityIcons name="delete" size={16} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Modal Form */}
      <Modal visible={formVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: isDark ? '#141414' : '#fff', borderColor: cardBorder }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: theme.colors.text }]}>
                {editingState ? 'Editar Estado del Sistema' : 'Nuevo Estado del Sistema'}
              </Text>
              <Pressable
                onPress={() => {
                  setFormVisible(false);
                  resetForm();
                }}
                style={s.closeModalBtn}
              >
                <MaterialCommunityIcons name="close" size={20} color={theme.colors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={s.modalBody}>
              <Text style={[s.label, { color: theme.colors.textSecondary }]}>Nombre comercial / de visualización</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ej. Predicciones Habilitadas"
                placeholderTextColor={theme.colors.placeholder}
                style={[s.input, { backgroundColor: inputBg, borderColor: cardBorder, color: theme.colors.text }]}
              />

              <Text style={[s.label, { color: theme.colors.textSecondary }]}>Clave de sistema (Minúsculas, sin espacios)</Text>
              <TextInput
                value={key}
                onChangeText={(v) => setKey(v.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="Ej. predicciones_habilitadas"
                placeholderTextColor={theme.colors.placeholder}
                style={[s.input, { backgroundColor: inputBg, borderColor: cardBorder, color: theme.colors.text }]}
                editable={!editingState} // Clave inmutable al editar para consistencia
              />

              <Text style={[s.label, { color: theme.colors.textSecondary }]}>Descripción (Qué controla esta clave)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Permite guardar o editar pronósticos..."
                placeholderTextColor={theme.colors.placeholder}
                multiline
                numberOfLines={3}
                style={[s.input, s.textArea, { backgroundColor: inputBg, borderColor: cardBorder, color: theme.colors.text }]}
              />

              <View style={s.switchRow}>
                <Text style={[s.label, { color: theme.colors.text, marginVertical: 0 }]}>Estado inicial activo</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: 'rgba(128,128,128,0.2)', true: CELESTE_DARK }}
                  thumbColor={isActive ? DORADO : PLATA}
                />
              </View>

              <Pressable
                onPress={handleSave}
                disabled={upsertMutation.isPending}
                style={[s.submitBtn, { backgroundColor: CELESTE_DARK }]}
              >
                {upsertMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.submitText}>Guardar variable de estado</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  circleL: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1.5, borderColor: `${CELESTE}30`, top: -50, right: -40 },
  circleS: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: `${CELESTE}20`, top: 30, right: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: DORADO, alignItems: 'center', justifyContent: 'center', shadowColor: DORADO, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  content: { padding: 16, gap: 14 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, height: 46, fontSize: 14 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, fontWeight: '600', marginTop: 12 },
  list: { gap: 12, paddingBottom: 40 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  cardBody: { flex: 1, gap: 4, paddingRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardKey: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardDesc: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  cardActions: { alignItems: 'flex-end', gap: 12 },
  switchLoader: { height: 31, justifyContent: 'center' },
  rowActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, maxHeight: '85%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.12)' },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  closeModalBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(128,128,128,0.1)', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 20, gap: 14 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: -4 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, fontWeight: '600' },
  textArea: { height: 80, paddingVertical: 12, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  submitBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '800' }
});
