import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PremiumRankingCard } from '../../src/components';
import { Screen } from '../../src/components/Screen';
import { rankingData } from '../../src/features/mockData';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { radius, shadows, spacing } from '../../src/theme/theme';

const CELESTE_DARK = '#3DA5F5';
const DEEP         = '#0F4C81';

export default function RankingsScreen() {
  const { theme } = useAppTheme();
  const [selectedTab, setSelectedTab] = useState<'General' | 'Semanal'>('General');
  const { user } = useAuth();

  const userName = user?.nombre ?? 'Usuario';
  const userInitials = userName.slice(0, 2).toUpperCase();
  const currentItem = rankingData.find((r) => r.isCurrent);

  // Stagger animation para las tarjetas
  const staggerAnims = useRef(rankingData.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = staggerAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 320,
        delay: i * 45,
        useNativeDriver: true,
      })
    );
    Animated.stagger(45, animations).start();
  }, [selectedTab]);

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        {/* Título simple — igual al resto de la app */}
        <Text style={[styles.pageTitle, { color: theme.colors.text }]}>🏆 Posiciones</Text>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(110,198,255,0.10)' }]}>
          {(['General', 'Semanal'] as const).map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setSelectedTab(tab)}
                style={[
                  styles.tabItem,
                  isActive && { backgroundColor: CELESTE_DARK },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? '#fff' : theme.colors.textSecondary },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Cabecera de tabla */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>#</Text>
          <Text style={[styles.tableHeaderText, styles.userCol, { color: theme.colors.muted }]}>Usuario</Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>Pts</Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>PJ</Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>DG</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {rankingData.map((item, index) => {
            const anim = staggerAnims[index];
            return (
              <Animated.View
                key={item.id}
                style={{
                  opacity: anim,
                  transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                }}
              >
                <PremiumRankingCard
                  item={{
                    ...item,
                    variation: item.diff,
                    variationDirection: item.diff > 0 ? 'up' : item.diff < 0 ? 'down' : 'neutral',
                  }}
                />
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: radius.xl,
    padding: 4,
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
  },
  tabItem: {
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: 18,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  userCol: {
    flex: 3,
    textAlign: 'left',
    paddingLeft: 48,
  },
  listContent: {
    paddingBottom: 110,
  },
});
