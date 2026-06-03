import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';

type Props = {
  match: string;
  date: string;
  time: string;
  status: string;
  pick: string;
  score: string;
  onPress?: () => void;
};

export function PredictionCard({ match, date, time, status, pick, score, onPress }: Props) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.matchTitle, { color: theme.colors.text }]}>{match}</Text>
        <Text style={[styles.status, { color: theme.colors.primary }]}>{status}</Text>
      </View>
      <View style={styles.infoRow}>
        <View>
          <Text style={[styles.label, { color: theme.colors.muted }]}>Pronóstico</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{pick}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={[styles.scoreText, { color: theme.colors.primary }]}>{score}</Text>
        </View>
      </View>
      <Text style={[styles.dateText, { color: theme.colors.muted }]}>{`${date} · ${time}`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  scoreBox: {
    backgroundColor: 'rgba(204, 38, 39, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
  },
});
