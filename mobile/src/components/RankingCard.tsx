import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';
import type { PositionItem } from '../features/mockData';

type Props = {
  item: PositionItem;
};

export function RankingCard({ item }: Props) {
  const { theme } = useAppTheme();
  const highlight = item.isCurrent;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: highlight ? theme.colors.primary : theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.position, { color: highlight ? '#fff' : theme.colors.text }]}>{item.position}</Text>
      <View style={styles.userColumn}>
        <Text style={[styles.userName, { color: highlight ? '#fff' : theme.colors.text }]}>{item.name}</Text>
      </View>
      <Text style={[styles.basicText, { color: highlight ? '#fff' : theme.colors.text }]}>{item.points}</Text>
      <Text style={[styles.basicText, { color: highlight ? '#fff' : theme.colors.text }]}>{item.played}</Text>
      <Text style={[styles.basicText, { color: highlight ? '#fff' : theme.colors.text }]}>{item.diff > 0 ? `+${item.diff}` : item.diff}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  position: {
    width: 28,
    fontSize: 14,
    fontWeight: '700',
  },
  userColumn: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
  },
  basicText: {
    width: 38,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
});
