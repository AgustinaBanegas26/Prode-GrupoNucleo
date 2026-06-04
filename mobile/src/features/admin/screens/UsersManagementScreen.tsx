import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { supabase } from '../../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Tipos ─────────────────────────────────────────────────────

type ClienteRow = {
  id: string;
  cliente_id: string | number;
  nombre: string;
  habilitado: boolean;
  primer_login: boolean;
  ultimo_acceso: string | null;
};

// ── Query key ─────────────────────────────────────────────────

const clientesKey = ['clientes'] as const;

function useClientes() {
  return useQuery({
    queryKey: clientesKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, cliente_id, nombre, habilitado, primer_login, ultimo_acceso')
        .order('nombre', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as ClienteRow[];
    },
  });
}

function useToggleHabilitado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, habilitado }: { id: string; habilitado: boolean }) => {
      const { error } = await supabase
        .from('clientes')
        .update({ habilitado })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: clientesKey }),
  });
}

// ── Componente ────────────────────────────────────────────────

export function UsersManagementScreen() {
  const { theme } = useAppTheme();

  const { data: users, isLoading, isError } = useClientes();
  const toggleHabilitado = useToggleHabilitado();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const statusOk =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? u.habilitado
          : !u.habilitado;
      if (!statusOk) return false;
      if (!q) return true;
      return `${u.cliente_id} ${u.nombre}`.toLowerCase().includes(q);
    });
  }, [query, statusFilter, users]);

  const handleToggle = async (u: ClienteRow) => {
    try {
      await toggleHabilitado.mutateAsync({ id: u.id, habilitado: !u.habilitado });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  };

  const formatAcceso = (iso: string | null) => {
    if (!iso) return 'Nunca';
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: ClienteRow }) => {
    const badge = item.habilitado
      ? { label: 'Activo', color: theme.colors.success }
      : { label: 'Bloqueado', color: theme.colors.error };

    return (
      <View style={[styles.userCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, shadows.sm]}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{item.nombre}</Text>
            <Text style={[styles.userMeta, { color: theme.colors.textSecondary }]}>
              Cliente ID: {item.cliente_id}
            </Text>
            <Text style={[styles.userMeta, { color: theme.colors.textSecondary }]}>
              Último acceso: {formatAcceso(item.ultimo_acceso)}
            </Text>
            {item.primer_login && (
              <Text style={[styles.primerLoginBadge, { color: theme.colors.warning }]}>
                ⚠ Pendiente cambio de contraseña
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
            <Text style={styles.statusText}>{badge.label}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => handleToggle(item)}
          style={[
            styles.toggleBtn,
            {
              backgroundColor: item.habilitado
                ? 'rgba(255,152,0,0.12)'
                : 'rgba(76,175,80,0.12)',
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.habilitado ? 'lock' : 'lock-open-variant'}
            size={16}
            color={item.habilitado ? theme.colors.warning : theme.colors.success}
          />
          <Text
            style={[
              styles.toggleBtnText,
              { color: item.habilitado ? theme.colors.warning : theme.colors.success },
            ]}
          >
            {item.habilitado ? 'Bloquear acceso' : 'Habilitar acceso'}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="account-multiple" size={32} color={theme.colors.primary} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Usuarios</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {filtered.length} clientes
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nombre o ID de cliente"
            placeholderTextColor={theme.colors.placeholder}
            style={[styles.searchInput, { color: theme.colors.text }]}
            autoCapitalize="none"
          />
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {(['all', 'active', 'blocked'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setStatusFilter(f)}
              style={[
                styles.filterButton,
                { backgroundColor: statusFilter === f ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.filterText, { color: statusFilter === f ? '#fff' : theme.colors.text }]}>
                {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Bloqueados'}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
        ) : isError ? (
          <View style={styles.loadingBox}>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Error al cargar usuarios.</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  loadingBox: { alignItems: 'center', paddingTop: 40 },
  header: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing['2xl'], alignItems: 'flex-start' },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: typography.bold as any },
  subtitle: { fontSize: 12, marginTop: spacing.xs },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  searchInput: { flex: 1, height: 48, paddingHorizontal: spacing.md },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  filterButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, alignItems: 'center' },
  filterText: { fontSize: 12, fontWeight: typography.semibold as any },
  listContent: { gap: spacing.md },
  userCard: { borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, gap: spacing.md },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flex: 1, gap: spacing.xs },
  userName: { fontSize: 15, fontWeight: typography.semibold as any },
  userMeta: { fontSize: 12 },
  primerLoginBadge: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.md },
  statusText: { fontSize: 11, fontWeight: typography.semibold as any, color: '#fff' },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  toggleBtnText: { fontSize: 13, fontWeight: '700' },
});
