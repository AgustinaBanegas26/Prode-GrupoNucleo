import React, { useEffect, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { predictions } from '../../mockData';
import { useUsersStore } from '../../users/store/usersStore';
import { useAdminActivityStore } from '../store/adminActivityStore';

const formatDateTime = (ts: number) => new Date(ts).toLocaleString();

function ProgressBar({ value }: { value: number }) {
  const { theme } = useAppTheme();
  const pct = Math.min(Math.max(value, 0), 100);

  return (
    <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceAlt }]}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: theme.colors.success }]} />
    </View>
  );
}

export function ParticipationTrackingScreen() {
  const { theme } = useAppTheme();
  const users = useUsersStore((s) => s.users);
  const refreshUsers = useUsersStore((s) => s.refresh);
  const activity = useAdminActivityStore((s) => s.items);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.activo).length;
    const blockedUsers = users.filter((u) => !u.activo).length;
    const inactiveUsers = 0;

    const predictionsCount = predictions.length;
    const participationPct = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    return { totalUsers, activeUsers, inactiveUsers, blockedUsers, predictionsCount, participationPct };
  }, [users]);

  const recent = useMemo(() => activity.slice(0, 12), [activity]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="chart-box" size={32} color={theme.colors.warning} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Participación</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Resumen operativo</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.totalUsers}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Usuarios</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.activeUsers}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Activos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>{stats.inactiveUsers}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Inactivos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statValue, { color: theme.colors.error }]}>{stats.blockedUsers}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Bloqueados</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="percent" size={20} color={theme.colors.success} />
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Participación general</Text>
          </View>
          <Text style={[styles.bigValue, { color: theme.colors.success }]}>{stats.participationPct}%</Text>
          <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>
            {stats.activeUsers}/{stats.totalUsers} usuarios activos
          </Text>
          <ProgressBar value={stats.participationPct} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="soccer" size={20} color={theme.colors.info} />
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Pronósticos</Text>
          </View>
          <Text style={[styles.bigValue, { color: theme.colors.info }]}>{stats.predictionsCount}</Text>
          <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>Conteo actual (modo demo)</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="history" size={20} color={theme.colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Actividad reciente</Text>
          </View>
          {recent.length === 0 ? (
            <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>Sin actividad registrada todavía.</Text>
          ) : (
            <View style={styles.recentList}>
              {recent.map((it) => (
                <View key={it.id} style={styles.recentItem}>
                  <Text style={[styles.recentTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    {it.title}
                  </Text>
                  <Text style={[styles.recentMeta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {it.module} · {it.action} · {formatDateTime(it.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: typography.bold as any },
  subtitle: { fontSize: 12, fontWeight: typography.regular as any, marginTop: spacing.xs },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { width: '48%', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, alignItems: 'center', gap: spacing.sm, ...shadows.sm },
  statValue: { fontSize: 18, fontWeight: typography.bold as any },
  statLabel: { fontSize: 11, fontWeight: typography.medium as any, textAlign: 'center' },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { fontSize: 14, fontWeight: typography.semibold as any },
  bigValue: { fontSize: 26, fontWeight: typography.bold as any },
  caption: { fontSize: 12, fontWeight: typography.regular as any, lineHeight: 18 },
  progressTrack: { height: 12, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full },
  recentList: { gap: spacing.md },
  recentItem: { gap: spacing.xs },
  recentTitle: { fontSize: 13, fontWeight: typography.semibold as any },
  recentMeta: { fontSize: 12, fontWeight: typography.regular as any },
});
