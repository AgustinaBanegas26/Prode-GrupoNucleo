import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';

type Props = {
  points: number;
  aciertos: number;
  efectividad: string;
};

export function ProfileStatsCard({ points, aciertos, efectividad }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
      <View style={styles.statBlock}>
        <Text style={[styles.value, { color: theme.colors.text }]}>{points}</Text>
        <Text style={[styles.label, { color: theme.colors.muted }]}>Puntos</Text>
      </View>
      <View style={styles.statBlock}>
        <Text style={[styles.value, { color: theme.colors.text }]}>{aciertos}</Text>
        <Text style={[styles.label, { color: theme.colors.muted }]}>Aciertos</Text>
      </View>
      <View style={styles.statBlock}>
        <Text style={[styles.value, { color: theme.colors.text }]}>{efectividad}</Text>
        <Text style={[styles.label, { color: theme.colors.muted }]}>Efectividad</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginVertical: 20,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    marginTop: 6,
  },
});
