import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PremiumRankingCard } from '../../src/components';
import { Screen } from '../../src/components/Screen';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { radius, spacing } from '../../src/theme/theme';
import { supabase } from '../../src/lib/supabase';

const CELESTE_DARK = '#3DA5F5';

type RankingEntry = {
  id: string;
  position: number;
  name: string;
  points: number;
  played: number;
  diff: number;
  isCurrent: boolean;
};

function useRankingData() {
  const [data, setData]       = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const { user } = useAuth();

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('ranking')
        .select('user_id, cliente_id, nombre, total_points, total_played, correct_exact, position')
        .order('total_points', { ascending: false });

      if (err) throw err;

      const entries: RankingEntry[] = (rows ?? []).map((r, i) => ({
        id:        r.user_id ?? String(r.cliente_id),
        position:  r.position ?? i + 1,
        name:      r.nombre ?? `Cliente ${r.cliente_id}`,
        points:    r.total_points ?? 0,
        played:    r.total_played ?? 0,
        diff:      r.correct_exact ?? 0,
        isCurrent: String(r.cliente_id) === String(user?.cliente_id),
      }));

      setData(entries);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar ranking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel('ranking-realtime-posiciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ranking' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { data, loading, error, refetch: fetch };
}

export default function RankingsScreen() {
  const { theme } = useAppTheme();
  const [selectedTab, setSelectedTab] = useState<'General' | 'Semanal'>('General');

  const { data: rankingData, loading, error, refetch } = useRankingData();

  const staggerAnims = useRef<Animated.Value[]>([]);
  useEffect(() => {
    staggerAnims.current = rankingData.map(() => new Animated.Value(0));
    const animations = staggerAnims.current.map((anim, i) =>
      Animated.timing(anim, { toValue: 1, duration: 320, delay: i * 45, useNativeDriver: true }),
    );
    Animated.stagger(45, animations).start();
  }, [rankingData.length]);

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

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>#</Text>
          <Text style={[styles.tableHeaderText, styles.userCol, { color: theme.colors.muted }]}>Usuario</Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>Pts</Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>PJ</Text>
          <Text style={[styles.tableHeaderText, { color: theme.colors.muted }]}>Ac.</Text>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={CELESTE_DARK} />
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={[styles.stateText, { color: theme.colors.muted }]}>{error}</Text>
            <Pressable onPress={refetch} style={[styles.retryBtn, { backgroundColor: CELESTE_DARK }]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar</Text>
            </Pressable>
          </View>
        ) : rankingData.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={{ fontSize: 36 }}>🏆</Text>
            <Text style={[styles.stateText, { color: theme.colors.muted }]}>
              El ranking se calculará cuando los jugadores realicen pronósticos.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {rankingData.map((item, index) => {
              const anim = staggerAnims.current[index] ?? new Animated.Value(1);
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
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen:          { paddingBottom: 20 },
  container:       { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  pageTitle:       { fontSize: 26, fontWeight: '800', marginBottom: spacing.lg, marginTop: spacing.sm },
  tabBar:          { flexDirection: 'row', borderRadius: radius.xl, padding: 4, marginBottom: spacing.lg, alignSelf: 'flex-start' },
  tabItem:         { paddingVertical: 9, paddingHorizontal: 22, borderRadius: 18 },
  tabText:         { fontSize: 14, fontWeight: '700' },
  tableHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, paddingHorizontal: spacing.sm },
  tableHeaderText: { flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  userCol:         { flex: 3, textAlign: 'left', paddingLeft: 48 },
  listContent:     { paddingBottom: 110 },
  centerState:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 16 },
  stateText:       { fontSize: 13, textAlign: 'center', paddingHorizontal: 30, lineHeight: 20 },
  retryBtn:        { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
});
