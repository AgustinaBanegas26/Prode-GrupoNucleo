import React, { useCallback } from 'react';
import { Pressable, View, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../providers/ThemeProvider';
import { spacing, radius, shadows } from '../theme/theme';

type ThemeToggleProps = {
  onPress?: () => void;
};

export function ThemeToggle({ onPress }: ThemeToggleProps) {
  const { theme, themeMode, setThemeMode, isDark } = useAppTheme();

  const handlePress = useCallback(() => {
    const modes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);
    onPress?.();
  }, [themeMode, setThemeMode, onPress]);

  const getIcon = () => {
    switch (themeMode) {
      case 'light':
        return 'white-balance-sunny';
      case 'dark':
        return 'moon-waning-crescent';
      case 'system':
        return 'cellphone';
      default:
        return 'white-balance-sunny';
    }
  };

  const getLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Oscuro';
      case 'system':
        return 'Sistema';
      default:
        return 'Tema';
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.colors.primaryLight,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={getIcon() as any}
          size={16}
          color={theme.colors.primary}
          style={styles.icon}
        />
        <Pressable style={styles.label} onPress={handlePress}>
          {/* Label will be visible in future versions */}
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 16,
    height: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
