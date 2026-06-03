import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../theme/theme';

type DashboardSectionProps = {
  title: string;
  icon?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  children: React.ReactNode;
};

export function DashboardSection({ title, icon, action, children }: DashboardSectionProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          {icon && (
            <MaterialCommunityIcons name={icon as any} size={20} color={theme.colors.text} />
          )}
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        </View>
        {action && (
          <Pressable onPress={action.onPress}>
            <Text style={[styles.action, { color: theme.colors.primary }]}>{action.label}</Text>
          </Pressable>
        )}
      </View>
      <View
        style={[
          styles.content,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing['2xl'],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: typography.semibold as any,
  },
  action: {
    fontSize: 13,
    fontWeight: typography.bold as any,
  },
  content: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    ...shadows.md,
  },
});
