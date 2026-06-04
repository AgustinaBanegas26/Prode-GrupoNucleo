import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '../providers/ThemeProvider';
import { gradients, radius, spacing } from '../theme/theme';

interface HeroStatsBannerProps {
  backgroundImageUrl?: string;
  position: number;
  points: number;
  variation: number;
  variationDirection?: 'up' | 'down' | 'neutral';
  remainingMatches?: number;
  tournamentName?: string;
  onViewRankingPress?: () => void;
}

export function HeroStatsBanner({
  backgroundImageUrl,
  position,
  points,
  variation,
  variationDirection = 'up',
  remainingMatches = 0,
  tournamentName = 'Mundial 2026',
  onViewRankingPress,
}: HeroStatsBannerProps) {
  const { theme } = useAppTheme();

  // Animación de entrada para el indicador de variación
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const variationColor = variationDirection === 'up' ? '#4CAF50' : variationDirection === 'down' ? '#F44336' : '#9E9E9E';
  const variationArrow = variationDirection === 'up' ? '↑' : variationDirection === 'down' ? '↓' : '–';
  const variationText = variation > 0 ? `+${variation}` : `${variation}`;

  return (
    <View style={styles.wrapper}>
      {backgroundImageUrl ? (
        <Image source={{ uri: backgroundImageUrl }} style={styles.bgImage} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={['#1a0000', '#3a0000', '#CC2627']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Overlay oscuro */}
      <LinearGradient
        colors={gradients.heroOverlay}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Contenido superpuesto */}
      <View style={styles.content}>
        {/* Fila superior: puntos + posición */}
        <View style={styles.topRow}>
          <View style={styles.pointsBlock}>
            <Text style={styles.pointsLabel}>🏆 {tournamentName.toUpperCase()}</Text>
            <Text style={styles.pointsValue}>{points.toLocaleString()} PTS</Text>
          </View>
          <View style={[styles.positionBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.positionBadgeText}>#{position}</Text>
            <Text style={styles.positionBadgeLabel}>DEL RANKING</Text>
          </View>
        </View>

        {/* Fila inferior: variación + partidos restantes */}
        <Animated.View
          style={[
            styles.bottomRow,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.variationChip}>
            <Text style={[styles.variationText, { color: variationColor }]}>
              {variationArrow} {variationText} esta fecha
            </Text>
          </View>
          {remainingMatches > 0 && (
            <Text style={styles.remainingText}>
              Quedan {remainingMatches} partidos
            </Text>
          )}
        </Animated.View>

        {/* CTA */}
        {onViewRankingPress && (
          <Pressable
            onPress={onViewRankingPress}
            style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.8 }]}
            accessibilityLabel="Ver ranking completo"
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>Ver ranking →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 220,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  bgImage: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pointsBlock: {
    gap: 4,
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  pointsValue: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  positionBadge: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  positionBadgeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  positionBadgeLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  variationChip: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  variationText: {
    fontSize: 13,
    fontWeight: '700',
  },
  remainingText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ctaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
