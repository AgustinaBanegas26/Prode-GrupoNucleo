import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { fixtures, fixturePhases, makeMatchLabel, type MatchPhase } from '../../mockData';

type VoteRow = {
  id: string;
  label: string;
  phase: MatchPhase;
  votes: number;
};

function hashVotes(input: string) {
  let n = 0;
  for (let i = 0; i < input.length; i += 1) n = (n * 31 + input.charCodeAt(i)) % 1000;
  return 50 + (n % 450);
}

export function VotedMatchesScreen() {
  const { theme } = useAppTheme();
  const [phase, setPhase] = useState<MatchPhase | 'all'>('all');

  const rows = useMemo(() => {
    return fixtures
      .filter((m) => (phase === 'all' ? true : m.phase === phase))
      .map<VoteRow>((m) => ({
        id: m.id,
        label: makeMatchLabel(m),
        phase: m.phase,
        votes: hashVotes(`${m.id}_${m.homeTeam}_${m.awayTeam}`),
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 20);
  }, [phase]);

  const maxVotes = Math.max(...rows.map((r) => r.votes), 1);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="soccer" size={32} color={theme.colors.error} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Partidos más votados</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Top {rows.length} (modo demo)</Text>
          </View>
        </View>

        <View style={styles.filters}>
          {(['all', ...fixturePhases] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPhase(p)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: phase === p ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: phase === p ? '#fff' : theme.colors.text }]} numberOfLines={1}>
                {p === 'all' ? 'Todos' : p}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.list}>
          {rows.map((r, idx) => {
            const pct = Math.round((r.votes / maxVotes) * 100);
            return (
              <View key={r.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.rowTop}>
                  <Text style={[styles.rank, { color: theme.colors.textSecondary }]}>{idx + 1}</Text>
                  <View style={styles.rowTitle}>
                    <Text style={[styles.matchTitle, { color: theme.colors.text }]} numberOfLines={1}>
                      {r.label}
                    </Text>
                    <Text style={[styles.meta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {r.phase}
                    </Text>
                  </View>
                  <Text style={[styles.votes, { color: theme.colors.error }]}>{r.votes}</Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: theme.colors.surfaceAlt }]}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: theme.colors.error }]} />
                </View>
              </View>
            );
          })}
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
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  filterButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1, maxWidth: '100%' },
  filterText: { fontSize: 12, fontWeight: typography.semibold as any },
  list: { gap: spacing.md, paddingBottom: spacing.lg },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rank: { width: 24, textAlign: 'center', fontSize: 12, fontWeight: typography.semibold as any },
  rowTitle: { flex: 1, gap: spacing.xs },
  matchTitle: { fontSize: 13, fontWeight: typography.semibold as any },
  meta: { fontSize: 12, fontWeight: typography.regular as any },
  votes: { width: 56, textAlign: 'right', fontSize: 14, fontWeight: typography.bold as any },
  barTrack: { height: 10, borderRadius: radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.full },
});

