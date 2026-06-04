import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';
import type { PositionItem } from '../features/mockData';
import { BadgeIndicator, type BadgeType } from './BadgeIndicator';
import { radius, shadows, spacing } from '../theme/theme';

const CELESTE      = '#6EC6FF';
const CELESTE_DARK = '#3DA5F5';
const CELESTE_BG   = '#EBF5FF';

interface PremiumRankingCardProps {
  item: PositionItem & {
    variation?: number;
    variationDirection?: 'up' | 'down' | 'neutral';
    badge?: BadgeType;
  };
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function PremiumRankingCard({ item }: PremiumRankingCardProps) {
  const { theme } = useAppTheme();
  const isMe = item.isCurrent;

  const variationColor =
    item.variationDirection === 'up'
      ? '#4CAF50'
      : item.variationDirection === 'down'
      ? '#F44336'
      : theme.colors.muted;
  const variationArrow =
    item.variationDirection === 'up' ? '↑' : item.variationDirection === 'down' ? '↓' : '–';
  const variationText =
    item.variation != null
      ? `${variationArrow}${Math.abs(item.variation)}`
      : null;

  const medal = MEDAL[item.position];

  // Colores para el usuario actual — celeste Argentina
  const bgColor = isMe
    ? theme.isDark
      ? 'rgba(61,165,245,0.12)'
      : 'rgba(110,198,255,0.10)'
    : theme.colors.surface;
  const borderColor = isMe ? CELESTE_DARK : (theme.isDark ? 'rgba(110,198,255,0.12)' : 'rgba(110,198,255,0.18)');
  const shadowStyle = isMe
    ? { shadowColor: CELESTE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.30, shadowRadius: 10, elevation: 6 }
    : shadows.sm;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor, borderColor },
        shadowStyle,
      ]}
    >
      {/* Posición */}
      <View style={styles.positionBlock}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={[styles.position, { color: isMe ? theme.colors.primary : theme.colors.text }]}>
            {item.position}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: isMe ? CELESTE_DARK : theme.colors.surfaceAlt }]}>
        <Text style={[styles.avatarText, { color: isMe ? '#fff' : theme.colors.textSecondary }]}>
          {item.name.slice(0, 2).toUpperCase()}
        </Text>
      </View>

      {/* Nombre */}
      <View style={styles.nameBlock}>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {item.name}
          {isMe && <Text style={{ color: CELESTE_DARK }}> (Tú)</Text>}
        </Text>
        {item.badge && <BadgeIndicator type={item.badge} animated={false} />}
      </View>

      {/* Stats */}
      <View style={styles.statsBlock}>
        <Text style={[styles.points, { color: isMe ? CELESTE_DARK : theme.colors.text }]}>
          {item.points}
        </Text>
        {variationText && (
          <Text style={[styles.variation, { color: variationColor }]}>{variationText}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  positionBlock: {
    width: 28,
    alignItems: 'center',
  },
  position: {
    fontSize: 15,
    fontWeight: '800',
  },
  medal: {
    fontSize: 18,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nameBlock: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  points: {
    fontSize: 15,
    fontWeight: '800',
  },
  variation: {
    fontSize: 11,
    fontWeight: '700',
  },
});
