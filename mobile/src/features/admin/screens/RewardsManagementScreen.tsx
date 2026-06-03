import React from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';

export function RewardsManagementScreen() {
  const { theme } = useAppTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="gift-outline"
            size={32}
            color={theme.colors.warning}
          />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Gestión de Premios
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Control de premios y recompensas
            </Text>
          </View>
        </View>

        {/* Stats */}
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
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>
              89
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Premios Totales
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
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              45
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Entregados
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
            <Text style={[styles.statValue, { color: theme.colors.info }]}>
              44
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Disponibles
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <Pressable
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Agregar Nuevo Premio</Text>
        </Pressable>

        {/* Content Coming Soon */}
        <View
          style={[
            styles.placeholder,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="information"
            size={48}
            color={theme.colors.info}
          />
          <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
            Gestión de Premios
          </Text>
          <Text
            style={[
              styles.placeholderDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            Aquí puedes crear, editar y administrar los premios disponibles para los usuarios.
          </Text>
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
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing['2xl'],
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
  placeholder: {
    borderRadius: radius.lg,
    padding: spacing['2xl'],
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.lg,
    ...shadows.sm,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: typography.semibold as any,
  },
  placeholderDescription: {
    fontSize: 13,
    fontWeight: typography.regular as any,
    textAlign: 'center',
    lineHeight: 20,
  },
});
