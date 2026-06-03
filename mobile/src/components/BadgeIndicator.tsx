import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export type BadgeType = 'SUBISTE' | 'BAJASTE' | 'NUEVO_LIDER' | 'TOP_10' | 'RACHA';

interface BadgeIndicatorProps {
  type: BadgeType;
  animated?: boolean;
}

const BADGE_CONFIG: Record<BadgeType, { label: string; color: string; bg: string }> = {
  SUBISTE:     { label: '↑ SUBISTE',      color: '#fff', bg: '#4CAF50' },
  BAJASTE:     { label: '↓ BAJASTE',      color: '#fff', bg: '#F44336' },
  NUEVO_LIDER: { label: '👑 NUEVO LÍDER', color: '#1a1a1a', bg: '#F4C430' },
  TOP_10:      { label: '🎯 TOP 10',      color: '#fff', bg: '#CC2627' },
  RACHA:       { label: '🔥 RACHA',       color: '#fff', bg: '#FF6B35' },
};

export function BadgeIndicator({ type, animated = true }: BadgeIndicatorProps) {
  const config = BADGE_CONFIG[type];
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const scaleAnim = useRef(new Animated.Value(animated ? 0.8 : 1)).current;

  useEffect(() => {
    if (!animated) return;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1.04, useNativeDriver: true, damping: 12, stiffness: 200 }),
      ]),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 200 }),
    ]).start();
  }, [type]);

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: config.bg, opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
      accessibilityRole="text"
      accessibilityLabel={config.label}
    >
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
