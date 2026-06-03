import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAppTheme } from '../providers/ThemeProvider';

type Route = {
  key: string;
  name: string;
  title?: string;
};

type Props = {
  state: { index: number; routes: Route[] };
  navigation: { navigate: (screen: string) => void };
};

const tabs = [
  { name: 'index', label: 'Inicio', icon: 'home' },
  { name: 'fixture', label: 'Fixture', icon: 'calendar' },
  { name: 'posiciones', label: 'Posiciones', icon: 'bar-chart-2' },
  { name: 'pronosticos', label: 'Pronósticos', icon: 'award' },
  { name: 'perfil', label: 'Perfil', icon: 'user' },
];

export function BottomTabBar({ state, navigation }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}> 
      {tabs.map((tab, index) => {
        const selected = state.index === index;
        return (
          <Pressable
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
            style={styles.tab}
          >
            <Feather name={tab.icon as any} size={20} color={selected ? theme.colors.primary : theme.colors.muted} />
            <Text style={[styles.label, { color: selected ? theme.colors.primary : theme.colors.muted }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
  },
});
