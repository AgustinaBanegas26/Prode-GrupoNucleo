/**
 * Posiciones — ranking calculado desde tabla predictions de Supabase
 * La API solo sirve para partidos. Los puntos se calculan localmente.
 */
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
import { supabase } from '../../src/lib/supabase';
import { radius, spacing } from '../../src/theme/theme';

const CELESTE_DARK = '#3DA5F5';

type RankingEntry = {
  id: string;
  position: number;
  name: string;
  points: number;
  played: number;
  diff: number;        // correct_exact
  isCurrent: boolean;
};

function useRankingFromSupabase() {
  const { user } = useAuth();
  const [data,    setData]    = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      // Leer directamente de la tabla ranking (calculada por score_prediction)
      const { data: rows, error: err } = await supabase
        .from('ranking')
        .select('id, cliente_id, nombre, total_points, total_played, correct_exact, correct_winner, position')
        .order('total_points', { ascending: false });

      if (err) throw new Error(err.message);

      const entries: RankingEntry[] = (rows ?? []).map((r, i) => ({
        id:        r.id ?? r.cliente_id,
        position:  r.position ?? i + 1,
        name:      r.nombre ?? `Cliente ${r.cliente_id}`,
        points:    r.total_points   ?? 0,
        played:    r.total_played   ?? 0,
        diff:      r.correct_exact  ?? 0,
        isCurrent: String(r.cliente_id) === String(user?.cliente_id),
      }));

      setData(entries);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar ranking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [user?.cliente_id]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel('ranking-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ranking' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return { data, loading, error, refetch: fetch };
}

export default function RankingsScreen() {
  const { theme } = useAppTheme();
  const { data: rankingData, loading, error, refetch } = useRankingFromSupabase();

  const staggerAnims = useRef<Animated.Value[]>([]);

  useEffect(() => {
    staggerAnims.current = rankingData.map(() => new Animated.Value(0));
    Animated.stagger(
      45,
      staggerAnims.current.map((anim, i) =>
        Animated.timing(anim, { toValue: 1, duration: 320, delay: i * 45, useNativeDriver: true })
      )
    ).start();
  }, [rankingData.length]);

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <Text style={[styles.pageTitle, { color: theme.colors.text }]}>🏆 Posiciones</Text>

        {/* Cabecera de tabla */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, { color: theme.colors.muted }]}>#</Text>
          <Text style={[styles.thText, styles.userCol, { color: theme.colors.muted }]}>Usuario</Text>
          <Text style={[styles.thText, { color: theme.colors.muted }]}>Pts</Text>
          <Text style={[styles.thText, { color: theme.colors.muted }]}>PJ</Text>
          <Text style={[styles.thText, { color: theme.colors.muted }]}>Ac.</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={CELESTE_DARK} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 36 }}>⚠️</Text>
            <Text style={[styles.errorText, { color: theme.colors.muted }]}>{error}</Text>
            <Pressable onPress={refetch} style={[styles.retryBtn, { backgroundColor: CELESTE_DARK }]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar</Text>
            </Pressable>
          </View>
        ) : rankingData.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 36 }}>🏆</Text>
            <Text style={[styles.errorText, { color: theme.colors.muted }]}>
              El ranking se calculará cuando haya partidos con resultado cargado.
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
                    opacity:   anim,
                    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                  }}
                >
                  <PremiumRankingCard
                    item={{
                      ...item,
                      variation:          item.diff,
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
  screen:      { paddingBottom: 20 },
  container:   { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  pageTitle:   { fontSize: 26, fontWeight: '800', marginBottom: spacing.lg, marginTop: spacing.sm },
  tableHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, paddingHorizontal: spacing.sm },
  thText:      { flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  userCol:     { flex: 3, textAlign: 'left', paddingLeft: 48 },
  listContent: { paddingBottom: 110 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 16 },
  errorText:   { fontSize: 13, textAlign: 'center', paddingHorizontal: 30, lineHeight: 20 },
  retryBtn:    { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
});
