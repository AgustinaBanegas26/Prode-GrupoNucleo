import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';

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

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.flagBlock}>
          <Text style={[styles.flag, { color: theme.colors.text }]}>{homeCode}</Text>
        </View>
        <View style={styles.teamColumn}>
          <Text style={[styles.teamName, { color: theme.colors.text }]}>{homeTeam}</Text>
          <Text style={[styles.teamCaption, { color: theme.colors.muted }]}>Local</Text>
        </View>
      </View>
      <View style={styles.middleColumn}>
        <Text style={[styles.dateText, { color: theme.colors.muted }]}>{date}</Text>
        <Text style={[styles.timeText, { color: theme.colors.text }]}>{time}</Text>
      </View>
      <View style={[styles.row, styles.rightColumn]}>
        <View style={styles.teamColumnRight}>
          <Text style={[styles.teamName, { color: theme.colors.text }]}>{awayTeam}</Text>
          <Text style={[styles.teamCaption, { color: theme.colors.muted }]}>Visitante</Text>
        </View>
        <View style={styles.flagBlock}> 
          <Text style={[styles.flag, { color: theme.colors.text }]}>{awayCode}</Text>
        </View>
      </View>
      {group ? <Text style={[styles.groupLabel, { color: theme.colors.primary }]}>{group}</Text> : null}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagBlock: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(204, 38, 39, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    fontSize: 13,
    fontWeight: '700',
  },
  teamColumn: {
    marginLeft: 10,
  },
  teamColumnRight: {
    marginRight: 10,
    alignItems: 'flex-end',
  },
  middleColumn: {
    marginTop: 12,
    marginBottom: 12,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
  },
  teamCaption: {
    fontSize: 12,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    textAlign: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  rightColumn: {
    marginTop: -62,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  groupLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
  },
});
