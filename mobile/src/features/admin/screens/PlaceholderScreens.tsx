import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';

const PlaceholderScreen = ({
  icon,
  title,
  description,
  color,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
}) => {
  const { theme } = useAppTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name={icon as any} size={32} color={color} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Funcionalidad disponible
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.placeholder,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconLarge,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <MaterialCommunityIcons name={icon as any} size={64} color={color} />
          </View>
          <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text
            style={[
              styles.placeholderDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            {description}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export function RankingsScreen() {
  const { theme } = useAppTheme();
  return (
    <PlaceholderScreen
      icon="trophy"
      title="Rankings"
      description="Consulta las clasificaciones actuales de usuarios por puntos y participación."
      color={theme.colors.primary}
    />
  );
}

export function ReportsScreen() {
  const { theme } = useAppTheme();
  return (
    <PlaceholderScreen
      icon="file-export"
      title="Exportar Reportes"
      description="Genera reportes detallados en formato PDF o Excel con estadísticas y datos del sistema."
      color={theme.colors.success}
    />
  );
}

export function ParticipationTrackingScreen() {
  const { theme } = useAppTheme();
  return (
    <PlaceholderScreen
      icon="chart-box"
      title="Seguimiento de Participación"
      description="Monitorea el nivel de participación de usuarios en predicciones y eventos."
      color={theme.colors.warning}
    />
  );
}

export function VotedMatchesScreen() {
  const { theme } = useAppTheme();
  return (
    <PlaceholderScreen
      icon="soccer"
      title="Partidos Más Votados"
      description="Visualiza los partidos que han recibido más predicciones y análisis de votación."
      color={theme.colors.error}
    />
  );
}

export function UserActivityScreen() {
  const { theme } = useAppTheme();
  return (
    <PlaceholderScreen
      icon="history"
      title="Actividad de Usuarios"
      description="Controla y monitorea la actividad de usuarios en la plataforma en tiempo real."
      color={theme.colors.info}
    />
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
    marginBottom: spacing['3xl'],
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
  placeholder: {
    borderRadius: radius.lg,
    padding: spacing['2xl'],
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.lg,
    ...shadows.sm,
  },
  iconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: typography.semibold as any,
  },
  placeholderDescription: {
    fontSize: 14,
    fontWeight: typography.regular as any,
    textAlign: 'center',
    lineHeight: 22,
  },
});
