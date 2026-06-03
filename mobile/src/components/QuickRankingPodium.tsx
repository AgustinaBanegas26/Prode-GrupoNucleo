import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';
import type { PositionItem } from '../features/mockData';
import { radius, shadows, spacing } from '../theme/theme';

interface QuickRankingPodiumProps {
  top3: PositionItem[];
  onViewAllPress?: () => void;
}

const MEDAL_COLORS: Record<number, string> = {
  1: '#F4C430',
  2: '#B0B0B0',
  3: '#CD7F32',
};

const PODIUM_SIZE: Record<number, number> = {
  1: 52,
  2: 44,
  3: 44,
};

function PodiumItem({ item }: { item: PositionItem }) {
  const { theme } = useAppTheme();
  const medalColor = MEDAL_COLORS[item.position] ?? theme.colors.muted;
  const avatarSize = PODIUM_SIZE[item.position] ?? 44;
  const isFirst = item.position === 1;
  const emoji = item.position === 1 ? '🥇' : item.position === 2 ? '🥈' : '🥉';

  return (
    <View style={[styles.podiumItem, isFirst && styles.podiumItemFirst]}>
      {/* Medalla emoji encima */}
      <Text style={styles.medalEmoji}>{emoji}</Text>

      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderColor: medalColor,
            backgroundColor: item.isCurrent ? theme.colors.primary : theme.colors.surfaceAlt,
          },
        ]}
      >
        <Text
          style={[
            styles.avatarText,
            { fontSize: isFirst ? 16 : 13, color: item.isCurrent ? '#fff' : theme.colors.text },
          ]}
        >
          {item.name.slice(0, 2).toUpperCase()}
        </Text>
      </View>

      <Text style={[styles.podiumName, { color: theme.colors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={[styles.podiumPoints, { color: theme.colors.primary }]}>
        {item.points} pts
      </Text>
    </View>
  );
}

export function QuickRankingPodium({ top3, onViewAllPress }: QuickRankingPodiumProps) {
  const { theme } = useAppTheme();

  // Reordenar: 2 - 1 - 3 para el podio visual clásico
  const ordered = [
    top3.find((p) => p.position === 2),
    top3.find((p) => p.position === 1),
    top3.find((p) => p.position === 3),
  ].filter(Boolean) as PositionItem[];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, shadows.md]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>🏆 Top 3 del Torneo</Text>
        {onViewAllPress && (
          <Pressable onPress={onViewAllPress} accessibilityRole="button" accessibilityLabel="Ver ranking completo">
            <Text style={[styles.seeAll, { color: theme.colors.primary }]}>Ver todo →</Text>
          </Pressable>
        )}
      </View>

      {/* Podio */}
      <View style={styles.podium}>
        {ordered.map((item) => (
          <PodiumItem key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
    paddingBottom: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  podiumItemFirst: {
    marginBottom: -16, // eleva al primero visualmente
  },
  medalEmoji: {
    fontSize: 22,
  },
  avatar: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: 11,
    fontWeight: '700',
  },
});
