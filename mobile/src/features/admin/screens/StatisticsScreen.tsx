import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';

const screenWidth = Dimensions.get('window').width;

export function StatisticsScreen() {
  const { theme } = useAppTheme();

  const lineChartData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        data: [120, 180, 150, 200, 220, 190, 240],
      },
    ],
  };

  const pieChartData = [
    {
      name: 'Predicciones Acertadas',
      population: 65,
      color: theme.colors.success,
      legendFontColor: theme.colors.text,
    },
    {
      name: 'Predicciones Fallidas',
      population: 35,
      color: theme.colors.error,
      legendFontColor: theme.colors.text,
    },
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
            Predicciones por Día
          </Text>
          <LineChart
            data={lineChartData}
            width={screenWidth - spacing.lg * 2 - spacing.lg * 2}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 0,
              color: () => theme.colors.primary,
              labelColor: () => theme.colors.textSecondary,
              style: {
                borderRadius: radius.lg,
              },
            }}
            bezier
          />
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
          <PieChart
            data={pieChartData}
            width={screenWidth - spacing.lg * 2 - spacing.lg * 2}
            height={220}
            chartConfig={{
              color: () => theme.colors.primary,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft={spacing.lg as any}
          />
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
});
