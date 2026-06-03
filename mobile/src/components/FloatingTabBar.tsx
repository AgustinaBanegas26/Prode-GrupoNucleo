import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../providers/ThemeProvider';
import { shadows } from '../theme/theme';

type Route = {
  key: string;
  name: string;
};

type Props = {
  state: { index: number; routes: Route[] };
  navigation: { navigate: (screen: string) => void };
};

const TABS = [
  { name: 'index', label: 'Inicio', icon: 'home' as const },
  { name: 'fixture', label: 'Fixture', icon: 'calendar' as const },
  { name: 'posiciones', label: 'Ranking', icon: 'bar-chart-2' as const },
  { name: 'pronosticos', label: 'Pronósticos', icon: 'award' as const },
  { name: 'perfil', label: 'Perfil', icon: 'user' as const },
];

function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: (typeof TABS)[number];
  isActive: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const indicatorAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();

    if (isActive) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.12, useNativeDriver: true, damping: 12, stiffness: 250 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 250 }),
      ]).start();
    }
  }, [isActive]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabItem}
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Feather
          name={tab.icon}
          size={22}
          color={isActive ? theme.colors.primary : theme.colors.muted}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color: isActive ? theme.colors.primary : theme.colors.muted },
          isActive && { fontWeight: '700' },
        ]}
      >
        {tab.label}
      </Text>
      {/* Indicador activo */}
      <Animated.View
        style={[
          styles.activeIndicator,
          { backgroundColor: theme.colors.primary, transform: [{ scaleX: indicatorAnim }] },
        ]}
      />
    </Pressable>
  );
}

export function FloatingTabBar({ state, navigation }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.isDark;

  const bgColor = isDark ? 'rgba(22,22,22,0.96)' : 'rgba(255,255,255,0.96)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={[styles.outerWrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View
        style={[
          styles.container,
          { backgroundColor: bgColor, borderColor },
          shadows.float,
        ]}
      >
        {TABS.map((tab, index) => (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={state.index === index}
            onPress={() => navigation.navigate(tab.name)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  container: {
    flexDirection: 'row',
    borderRadius: 28,
    borderWidth: 1,
    height: 64,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
});
