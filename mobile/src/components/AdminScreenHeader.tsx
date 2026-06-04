import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../providers/ThemeProvider';
import { radius, shadows, spacing } from '../theme/theme';

interface AdminScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  showBack?: boolean;
}

export function AdminScreenHeader({
  title,
  subtitle,
  rightElement,
  showBack = true,
}: AdminScreenHeaderProps) {
  const { theme } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingTop: insets.top + 8,
        },
        shadows.sm,
      ]}
    >
      <View style={styles.row}>
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Feather name="arrow-left" size={18} color={theme.colors.text} />
          </Pressable>
        )}

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightElement ? (
          <View style={styles.right}>{rightElement}</View>
        ) : (
          <View style={styles.rightPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  right: {
    flexShrink: 0,
  },
  rightPlaceholder: {
    width: 36,
  },
});
