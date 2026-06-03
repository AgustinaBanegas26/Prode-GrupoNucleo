import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';

const screenWidth = Dimensions.get('window').width;

type ChartPoint = { label: string; value: number };

function SimpleBarChart({ data }: { data: ChartPoint[] }) {
  const { theme } = useAppTheme();

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.barChart}>
      {data.map((d) => (
        <View key={d.label} style={styles.barCol}>
          <View
            style={[
              styles.bar,
              {
                height: `${Math.round((d.value / max) * 100)}%`,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
          <Text style={[styles.barLabel, { color: theme.colors.textSecondary }]}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

function ProgressBar({ value }: { value: number }) {
  const { theme } = useAppTheme();
  const pct = Math.min(Math.max(value, 0), 100);

  return (
    <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceAlt }]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${pct}%`,
            backgroundColor: theme.colors.success,
          },
        ]}
      />
    </View>
  );
}

export function StatisticsScreen() {
  const { theme } = useAppTheme();

  const dailyParticipation: ChartPoint[] = [
    { label: 'Lun', value: 120 },
    { label: 'Mar', value: 180 },
    { label: 'Mié', value: 150 },
    { label: 'Jue', value: 200 },
    { label: 'Vie', value: 220 },
    { label: 'Sáb', value: 190 },
    { label: 'Dom', value: 240 },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="chart-line"
            size={32}
            color={theme.colors.primary}
          />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Estadísticas
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Métricas en tiempo real
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="account-multiple"
              size={32}
              color={theme.colors.primary}
            />
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              1,234
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Usuarios Totales
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="soccer"
              size={32}
              color={theme.colors.info}
            />
            <Text style={[styles.statValue, { color: theme.colors.info }]}>
              5,678
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Predicciones
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="percent"
              size={32}
              color={theme.colors.success}
            />
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              65%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Precisión Promedio
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="trending-up"
              size={32}
              color={theme.colors.warning}
            />
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>
              23%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Crecimiento
            </Text>
          </View>
        </View>

        {/* Charts */}
        <View
          style={[
            styles.chartContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Participación diaria
          </Text>
          <SimpleBarChart data={dailyParticipation} />
        </View>

        <View
          style={[
            styles.chartContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Tasa de Precisión
          </Text>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressValue, { color: theme.colors.success }]}>65%</Text>
            <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
              Predicciones acertadas
            </Text>
          </View>
          <ProgressBar value={65} />
          <View style={styles.progressLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
              <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Acertadas</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
              <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Fallidas</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing['2xl'],
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: typography.bold as any,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: typography.regular as any,
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  statCard: {
    width: '48%',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: typography.bold as any,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: typography.medium as any,
    textAlign: 'center',
  },
  chartContainer: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: typography.semibold as any,
    marginBottom: spacing.md,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 180,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  barCol: {
    width: (screenWidth - spacing.lg * 2 - spacing.lg * 2 - spacing.md * 2) / 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '100%',
    borderRadius: radius.md,
  },
  barLabel: {
    marginTop: spacing.sm,
    fontSize: 10,
    fontWeight: typography.medium as any,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressValue: {
    fontSize: 22,
    fontWeight: typography.bold as any,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: typography.medium as any,
  },
  progressTrack: {
    height: 12,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  legendText: {
    fontSize: 12,
    fontWeight: typography.medium as any,
  },
});
