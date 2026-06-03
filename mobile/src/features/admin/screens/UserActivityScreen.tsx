import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { useAdminActivityStore, type AdminActivityAction, type AdminActivityModule } from '../store/adminActivityStore';

const formatDateTime = (ts: number) => new Date(ts).toLocaleString();

function iconFor(action: AdminActivityAction) {
  if (action === 'create') return 'plus';
  if (action === 'update') return 'pencil';
  if (action === 'delete') return 'delete';
  if (action === 'toggle') return 'eye';
  if (action === 'export') return 'file-export';
  if (action === 'login') return 'login';
  return 'logout';
}

function labelForModule(m: AdminActivityModule) {
  if (m === 'auth') return 'Auth';
  if (m === 'users') return 'Usuarios';
  if (m === 'images') return 'Imágenes';
  if (m === 'slider') return 'Slider';
  if (m === 'news') return 'Noticias';
  if (m === 'rewards') return 'Premios';
  if (m === 'rankings') return 'Rankings';
  if (m === 'reports') return 'Reportes';
  if (m === 'participation') return 'Participación';
  return 'Branding';
}

export function UserActivityScreen() {
  const { theme } = useAppTheme();
  const items = useAdminActivityStore((s) => s.items);
  const clear = useAdminActivityStore((s) => s.clear);

  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<AdminActivityModule | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const moduleOk = moduleFilter === 'all' ? true : it.module === moduleFilter;
      if (!moduleOk) return false;
      if (!q) return true;
      const haystack = `${it.title} ${it.detail ?? ''} ${it.action} ${it.module}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, moduleFilter, query]);

  const confirmClear = () => {
    Alert.alert('Limpiar historial', '¿Eliminar todos los eventos registrados?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: clear },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="history" size={32} color={theme.colors.info} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Actividad</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{filtered.length} eventos</Text>
          </View>
          <Pressable onPress={confirmClear} style={[styles.clearBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
            <MaterialCommunityIcons name="delete-sweep" size={18} color={theme.colors.error} />
            <Text style={[styles.clearText, { color: theme.colors.error }]}>Limpiar</Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar en actividad"
              placeholderTextColor={theme.colors.placeholder}
              style={[styles.searchInput, { color: theme.colors.text }]}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.filters}>
          {(['all', 'auth', 'users', 'news', 'images', 'slider', 'rewards', 'reports', 'branding'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setModuleFilter(m)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: moduleFilter === m ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: moduleFilter === m ? '#fff' : theme.colors.text }]} numberOfLines={1}>
                {m === 'all' ? 'Todos' : labelForModule(m)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.list}>
          {filtered.map((it) => (
            <View key={it.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryLight }]}>
                  <MaterialCommunityIcons name={iconFor(it.action) as any} size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
                    {it.title}
                  </Text>
                  <Text style={[styles.cardMeta, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {labelForModule(it.module)} · {it.action} · {formatDateTime(it.createdAt)}
                  </Text>
                  {it.detail ? (
                    <Text style={[styles.cardDetail, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                      {it.detail}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ))}

          {filtered.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
              <MaterialCommunityIcons name="information" size={28} color={theme.colors.info} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Sin eventos para mostrar.</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg, alignItems: 'flex-start' },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: typography.bold as any },
  subtitle: { fontSize: 12, fontWeight: typography.regular as any, marginTop: spacing.xs },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  clearText: { fontSize: 12, fontWeight: typography.semibold as any },
  searchRow: { marginBottom: spacing.md },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, height: 48, paddingHorizontal: spacing.md, fontSize: 14, fontWeight: typography.regular as any },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  filterButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1, maxWidth: '100%' },
  filterText: { fontSize: 12, fontWeight: typography.semibold as any },
  list: { gap: spacing.md, paddingBottom: spacing.lg },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, ...shadows.sm },
  cardHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  iconCircle: { width: 34, height: 34, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  cardText: { flex: 1, gap: spacing.xs },
  cardTitle: { fontSize: 13, fontWeight: typography.semibold as any },
  cardMeta: { fontSize: 12, fontWeight: typography.regular as any, lineHeight: 18 },
  cardDetail: { fontSize: 12, fontWeight: typography.regular as any, lineHeight: 18 },
  empty: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm, alignItems: 'center', ...shadows.sm },
  emptyText: { fontSize: 12, fontWeight: typography.regular as any },
});

