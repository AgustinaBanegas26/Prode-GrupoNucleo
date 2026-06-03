import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { AppLogo } from './AppLogo';
import { ThemeToggle } from './ThemeToggle';
import { useAppTheme } from '../providers/ThemeProvider';
import { spacing, radius, shadows } from '../theme/theme';

export function AppHeader() {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <Pressable style={styles.iconButton}>
        <Feather name="menu" size={22} color={theme.colors.text} />
      </Pressable>
      <View style={styles.logoContainer}>
        <AppLogo />
      </View>
      <View style={styles.rightActions}>
        <Pressable style={styles.iconButton}>
          <Feather name="bell" size={22} color={theme.colors.text} />
        </Pressable>
        <ThemeToggle />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    ...shadows.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
