import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../providers/ThemeProvider';
import { shadows } from '../theme/theme';

type Route = { key: string; name: string };
type Props = {
  state: { index: number; routes: Route[] };
  navigation: { navigate: (name: string) => void; emit: (event: { type: string; target?: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean } };
};

const TABS = [
  { name: 'index',       label: 'Inicio',      icon: 'home'        as const },
  { name: 'fixture',     label: 'Fixture',     icon: 'calendar'    as const },
  { name: 'posiciones',  label: 'Ranking',     icon: 'bar-chart-2' as const },
  { name: 'pronosticos', label: 'Pronósticos', icon: 'award'       as const },
  { name: 'perfil',      label: 'Perfil',      icon: 'user'        as const },
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
  const scaleAnim     = useRef(new Animated.Value(1)).current;
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
        Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, damping: 12, stiffness: 250 }),
      ]).start();
    }
  }, [isActive]);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabItem, { cursor: 'pointer' } as any]}
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
          isActive && styles.tabLabelActive,
        ]}
      >
        {tab.label}
      </Text>
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
  const { theme }  = useAppTheme();
  const insets     = useSafeAreaInsets();
  const bgColor    = theme.isDark ? 'rgba(22,22,22,0.97)' : 'rgba(255,255,255,0.97)';
  const borderColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={[styles.outerWrapper, { paddingBottom: Math.max(insets.bottom, 8) + 4 }]}>
      <View style={[styles.container, { backgroundColor: bgColor, borderColor }, shadows.float]}>
        {TABS.map((tab, index) => {
          // Encontrar el route correspondiente por nombre
          const routeIndex = state.routes.findIndex(
            (r) => r.name === tab.name || r.name.endsWith(`/${tab.name}`) || r.name.endsWith(tab.name)
          );
          const targetIndex = routeIndex >= 0 ? routeIndex : index;
          const isActive    = state.index === targetIndex;

          return (
            <TabItem
              key={tab.name}
              tab={tab}
              isActive={isActive}
              onPress={() => {
                const targetRoute = state.routes[targetIndex];
                if (!targetRoute) return;

                // Emitir evento tabPress — patrón oficial de expo-router
                const event = navigation.emit({
                  type: 'tabPress',
                  target: targetRoute.key,
                  canPreventDefault: true,
                });

                if (!isActive && !event.defaultPrevented) {
                  navigation.navigate(targetRoute.name);
                }
              }}
            />
          );
        })}
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
  tabLabelActive: {
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
});
