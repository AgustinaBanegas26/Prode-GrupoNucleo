import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';
import { getFlagEmoji, getNationalColor, radius, shadows, spacing } from '../theme/theme';

// ── Logo con fallback a emoji ─────────────────────────────────
function TeamLogo({ logo, code, size = 44 }: { logo?: string; code: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (logo && !failed) {
    return (
      <Image
        source={{ uri: logo }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    );
  }
  return <Text style={{ fontSize: size * 0.7 }}>{getFlagEmoji(code)}</Text>;
}

interface SportMatchCardProps {
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
  homeLogo?: string;
  awayLogo?: string;
  date: string;
  time: string;
  group?: string;
  phase?: string;
  stadium?: string;
  userPrediction?: string;
  matchStatus?: 'upcoming' | 'live' | 'finished';
  onPress?: () => void;
}

export function SportMatchCard({
  homeTeam,
  awayTeam,
  homeCode,
  awayCode,
  homeLogo,
  awayLogo,
  date,
  time,
  group,
  phase,
  stadium,
  userPrediction,
  matchStatus = 'upcoming',
  onPress,
}: SportMatchCardProps) {
  const { theme } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const livePulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (matchStatus !== 'live') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [matchStatus]);

  const homeColor = getNationalColor(homeCode);
  const awayColor = getNationalColor(awayCode);

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 15, stiffness: 300 }).start();

  const cardBg     = theme.isDark ? theme.colors.surface : '#fff';
  const borderColor = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

  return (
    <Animated.View style={{ transform: [{ scale }], ...shadows.md }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.container, { backgroundColor: cardBg, borderColor }]}
        accessibilityRole="button"
        accessibilityLabel={`${homeTeam} vs ${awayTeam}, ${date} ${time}`}
      >
        {/* Badge EN VIVO */}
        {matchStatus === 'live' && (
          <View style={styles.liveBadgeContainer}>
            <Animated.View style={[styles.liveDot, { opacity: livePulse }]} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        )}

        {/* Equipos */}
        <View style={styles.teamsRow}>
          {/* Local */}
          <View style={[styles.teamSide, { backgroundColor: homeColor.bg }]}>
            <TeamLogo logo={homeLogo} code={homeCode} size={48} />
            <Text style={[styles.teamName, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {homeTeam}
            </Text>
          </View>

          {/* Centro */}
          <View style={styles.center}>
            <Text style={[styles.vsText,   { color: theme.colors.textTertiary }]}>VS</Text>
            <Text style={[styles.timeText, { color: theme.colors.text }]}>{time}</Text>
            <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>{date}</Text>
          </View>

          {/* Visitante */}
          <View style={[styles.teamSide, { backgroundColor: awayColor.bg }]}>
            <TeamLogo logo={awayLogo} code={awayCode} size={48} />
            <Text style={[styles.teamName, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {awayTeam}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.colors.divider }]}>
          {(group || phase) && (
            <Text style={[styles.footerLabel, { color: theme.colors.primary }]}>
              {group ?? phase}
            </Text>
          )}
          {userPrediction && (
            <Text style={[styles.predictionText, { color: theme.colors.textSecondary }]}>
              🎯 Mi pronóstico:{' '}
              <Text style={{ fontWeight: '700', color: theme.colors.text }}>{userPrediction}</Text>
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  liveBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#F44336',
  },
  liveText: {
    color: '#F44336', fontSize: 11, fontWeight: '800', letterSpacing: 0.8,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: 8,
  },
  teamName: {
    fontSize: 11, fontWeight: '500', textAlign: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    gap: 2,
  },
  vsText:   { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  timeText: { fontSize: 16, fontWeight: '800' },
  dateText: { fontSize: 11, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  footerLabel:     { fontSize: 12, fontWeight: '700' },
  predictionText:  { fontSize: 12, fontWeight: '500' },
});
