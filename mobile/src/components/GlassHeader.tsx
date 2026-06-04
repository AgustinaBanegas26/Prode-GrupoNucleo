import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../providers/ThemeProvider';
import { getGreeting, spacing, radius, shadows } from '../theme/theme';

interface GlassHeaderProps {
  userName: string;
  userInitials: string;
  position: number;
  onNotificationsPress?: () => void;
  onMenuPress?: () => void;
  hasUnreadNotifications?: boolean;
}

export function GlassHeader({
  userName,
  userInitials,
  position,
  onNotificationsPress,
  onMenuPress,
  hasUnreadNotifications = false,
}: GlassHeaderProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const greeting = getGreeting();

  const isDark = theme.isDark;
  const bgColor = isDark ? 'rgba(18,18,18,0.94)' : 'rgba(255,255,255,0.94)';
  const borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderBottomColor: borderColor,
          paddingTop: insets.top + 10,
        },
        shadows.sm,
      ]}
    >
      {/* Left: avatar + texto */}
      <View style={styles.leftSection}>
        <View style={[styles.avatar, { borderColor: theme.colors.primary }]}>
          <Text style={styles.avatarText}>{userInitials}</Text>
        </View>
        <View style={styles.textColumn}>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
            {greeting} 👋
          </Text>
          <Text style={[styles.userName, { color: theme.colors.text }]} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={[styles.positionLabel, { color: theme.colors.primary }]}>
            Puesto #{position} del torneo
          </Text>
        </View>
      </View>

      {/* Right: acciones */}
      <View style={styles.rightSection}>
        <Pressable
          onPress={onNotificationsPress}
          style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
          accessibilityLabel="Notificaciones"
          accessibilityRole="button"
        >
          <Feather name="bell" size={20} color={theme.colors.text} />
          {hasUnreadNotifications && (
            <View
              style={[styles.notifBadge, { backgroundColor: theme.colors.primary }]}
              accessibilityRole="alert"
              accessibilityLabel="Notificaciones sin leer"
            />
          )}
        </Pressable>
        <Pressable
          onPress={onMenuPress}
          style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
          accessibilityLabel="Menú"
          accessibilityRole="button"
        >
          <Feather name="menu" size={20} color={theme.colors.text} />
        </Pressable>
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
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    backgroundColor: '#3DA5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  textColumn: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 1,
  },
  positionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
