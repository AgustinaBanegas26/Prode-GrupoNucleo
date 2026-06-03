import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { rankingData } from '../../mockData';

type RankingPeriod = 'General' | 'Semanal' | 'Mensual';

type RankingRow = {
  id: string;
  position: number;
  name: string;
  points: number;
  played: number;
  diff: number;
  isCurrent?: boolean;
};

function derivePoints(points: number, period: RankingPeriod) {
  if (period === 'Semanal') return Math.round(points * 0.35);
  if (period === 'Mensual') return Math.round(points * 0.6);
  return points;
}

export function RankingsScreen() {
  const { theme } = useAppTheme();
  const [period, setPeriod] = useState<RankingPeriod>('General');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mapped: RankingRow[] = rankingData
      .map((r) => ({
        ...r,
        points: derivePoints(r.points, period),
      }))
      .sort((a, b) => b.points - a.points)
      .map((r, idx) => ({ ...r, position: idx + 1 }));

    return mapped.filter((r) => (!q ? true : r.name.toLowerCase().includes(q)));
  }, [period, query]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="trophy" size={32} color={theme.colors.primary} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Rankings</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{rows.length} usuarios</Text>
          </View>
        </View>

        <View style={styles.filters}>
          {(['General', 'Semanal', 'Mensual'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: period === p ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: period === p ? '#fff' : theme.colors.text }]}>{p}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar usuario"
              placeholderTextColor={theme.colors.placeholder}
              style={[styles.searchInput, { color: theme.colors.text }]}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
          <Text style={[styles.th, { color: theme.colors.textSecondary }]}>#</Text>
          <Text style={[styles.th, styles.thUser, { color: theme.colors.textSecondary }]}>Usuario</Text>
          <Text style={[styles.th, { color: theme.colors.textSecondary }]}>Pts</Text>
          <Text style={[styles.th, { color: theme.colors.textSecondary }]}>PJ</Text>
        </View>

        <View style={styles.list}>
          {rows.map((r) => (
            <View
              key={r.id}
              style={[
                styles.row,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: r.isCurrent ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.cell, { color: theme.colors.text }]}>{r.position}</Text>
              <Text style={[styles.cell, styles.cellUser, { color: theme.colors.text }]} numberOfLines={1}>
                {r.name}
              </Text>
              <Text style={[styles.cell, { color: theme.colors.primary }]}>{r.points}</Text>
              <Text style={[styles.cell, { color: theme.colors.textSecondary }]}>{r.played}</Text>
            </View>
          ))}
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
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  filterButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, alignItems: 'center' },
  filterText: { fontSize: 12, fontWeight: typography.semibold as any },
  searchRow: { marginBottom: spacing.lg },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, height: 48, paddingHorizontal: spacing.md, fontSize: 14, fontWeight: typography.regular as any },
  tableHeader: { flexDirection: 'row', borderRadius: radius.md, borderWidth: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  th: { flex: 1, fontSize: 12, fontWeight: typography.semibold as any },
  thUser: { flex: 3 },
  list: { marginTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.md, ...shadows.sm },
  cell: { flex: 1, fontSize: 12, fontWeight: typography.medium as any },
  cellUser: { flex: 3 },
});

