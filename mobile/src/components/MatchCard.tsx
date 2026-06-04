import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';
import { getFlagEmoji, getNationalColor } from '../theme/theme';

const CELESTE_DARK = '#3DA5F5';

type Props = {
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
  date: string;
  time: string;
  group?: string;
  onPress?: () => void;
};

export function MatchCard({
  homeTeam,
  awayTeam,
  homeCode,
  awayCode,
  date,
  time,
  group,
  onPress,
}: Props) {
  const { theme } = useAppTheme();
  const homeColor = getNationalColor(homeCode);
  const awayColor = getNationalColor(awayCode);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.isDark ? 'rgba(110,198,255,0.12)' : 'rgba(110,198,255,0.2)',
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {/* Header: Grupo + Hora */}
      {group ? (
        <View style={styles.header}>
          <View style={[styles.groupBadge, { backgroundColor: theme.isDark ? 'rgba(110,198,255,0.15)' : '#EBF5FF' }]}>
            <Text style={[styles.groupText, { color: CELESTE_DARK }]}>{group}</Text>
          </View>
          <Text style={[styles.timeHeader, { color: theme.colors.textSecondary }]}>{time}</Text>
        </View>
      ) : null}

      {/* Equipos */}
      <View style={styles.teamsRow}>
        {/* Local */}
        <View style={styles.teamCol}>
          <View style={[styles.flagCircle, { backgroundColor: homeColor.bg }]}>
            <Text style={styles.flagEmoji}>{getFlagEmoji(homeCode)}</Text>
          </View>
          <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={2}>
            {homeTeam}
          </Text>
        </View>

        {/* Centro */}
        <View style={styles.centerCol}>
          <Text style={[styles.vsText, { color: theme.colors.muted }]}>VS</Text>
          {!group && (
            <Text style={[styles.timeCenter, { color: theme.colors.text }]}>{time}</Text>
          )}
          <Text style={[styles.dateText, { color: theme.colors.muted }]}>{date}</Text>
        </View>

        {/* Visitante */}
        <View style={styles.teamCol}>
          <View style={[styles.flagCircle, { backgroundColor: awayColor.bg }]}>
            <Text style={styles.flagEmoji}>{getFlagEmoji(awayCode)}</Text>
          </View>
          <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={2}>
            {awayTeam}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#6EC6FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  groupBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  groupText:  { fontSize: 11, fontWeight: '700' },
  timeHeader: { fontSize: 12, fontWeight: '600' },

  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  flagCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagEmoji: { fontSize: 30 },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 90,
    lineHeight: 16,
  },
  centerCol: {
    width: 60,
    alignItems: 'center',
    gap: 2,
  },
  vsText:     { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  timeCenter: { fontSize: 15, fontWeight: '800' },
  dateText:   { fontSize: 11, fontWeight: '500' },
});
