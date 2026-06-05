import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PremiumRankingCard } from '../../src/components';
import { Screen } from '../../src/components/Screen';
import { useRanking, useRankingRealtime } from '../../src/features/content/api/ranking';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { radius, spacing } from '../../src/theme/theme';

const CELESTE_DARK = '#3DA5F5';

export default function RankingsScreen() {
  const { theme } = useAppTheme();
  const [selectedTab, setSelectedTab] = useState<'General' | 'Semanal'>('General');
  const { user } = useAuth();
  const scope = selectedTab === 'General' ? 'general' : 'semanal';

  const { data: ranking = [], isLoading } = useRanking(scope);
  useRankingRealtime();

  const clienteId = user?.cliente_id ?? '';

  const rankedWithPositions = useMemo(() => {
    return ranking.map((item, index) => ({
      ...item,
      position: index + 1,
      isCurrent: String(item.clienteId) === String(clienteId),
      name: item.userName,
      variation: item.diff,
      variationDirection:
        item.diff > 0 ? ('up' as const) : item.diff < 0 ? ('down' as const) : ('neutral' as const),
    }));
  }, [ranking, clienteId]);

  const currentItem = rankedWithPositions.find((r) => r.isCurrent);

  const staggerAnims = useRef(rankedWithPositions.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    while (staggerAnims.length < rankedWithPositions.length) {
      staggerAnims.push(new Animated.Value(0));
    }
    const animations = rankedWithPositions.map((_, i) =>
      Animated.timing(staggerAnims[i] ?? new Animated.Value(0), {
        toValue: 1,
        duration: 320,
        delay: i * 45,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(45, animations).start();
  }, [selectedTab, rankedWithPositions.length]);

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <Text style={[styles.pageTitle, { color: theme.colors.text }]}>🏆 Posiciones</Text>

        <View style={[styles.tabBar, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(110,198,255,0.10)' }]}>
          {(['General', 'Semanal'] as const).map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setSelectedTab(tab)}
                style={[styles.tabItem, isActive && { backgroundColor: CELESTE_DARK }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.tabText, { color: isActive ? '#fff' : theme.colors.textSecondary }]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {currentItem ? (
          <View style={[styles.meBanner, { backgroundColor: theme.isDark ? 'rgba(110,198,255,0.12)' : 'rgba(110,198,255,0.2)' }]}>
            <Text style={[styles.meText, { color: theme.colors.text }]}>
              Tu posición: #{currentItem.position} — {currentItem.points} pts
            </Text>
          </View>
        ) : null}

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>#</Text>
          <Text style={[styles.tableHeaderText, styles.userCol, { color: theme.colors.muted }]}>Usuario</Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>Pts</Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>PJ</Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>DG</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {rankedWithPositions.map((item, index) => {
              const anim = staggerAnims[index] ?? new Animated.Value(1);
              return (
                <Animated.View
                  key={item.id}
                  style={{
                    opacity: anim,
                    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                  }}
                >
                  <PremiumRankingCard item={item} />
                </Animated.View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 20 },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  pageTitle: { fontSize: 26, fontWeight: '800', marginBottom: spacing.lg, marginTop: spacing.sm },
  tabBar: { flexDirection: 'row', borderRadius: radius.xl, padding: 4, marginBottom: spacing.md, alignSelf: 'flex-start' },
  tabItem: { paddingVertical: 9, paddingHorizontal: 22, borderRadius: 18 },
  tabText: { fontSize: 14, fontWeight: '700' },
  meBanner: { borderRadius: 12, padding: 12, marginBottom: spacing.md },
  meText: { fontSize: 14, fontWeight: '700' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, paddingHorizontal: spacing.sm },
  tableHeaderText: { flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  userCol: { flex: 3, textAlign: 'left', paddingLeft: 48 },
  listContent: { paddingBottom: 110 },
});
