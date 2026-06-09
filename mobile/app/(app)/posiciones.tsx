/**
 * Posiciones — ranking en tiempo real desde tabla ranking de Supabase.
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
import { fetchAvatarMap, resolveAvatarUrl } from '../../src/utils/avatarUrl';

const CELESTE_DARK = '#3DA5F5';

type RankingEntry = {
  id: string;
  clienteId: string;
  position: number;
  name: string;
  avatarUrl: string | null;
  points: number;
  played: number;
  diff: number;
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
      const { data: rows, error: err } = await supabase
        .from('ranking')
        .select('id, cliente_id, nombre, total_points, total_played, correct_exact, correct_winner, position')
        .order('total_points', { ascending: false });

      if (err) throw new Error(err.message);

      const clienteIds = (rows ?? []).map((r) => String(r.cliente_id));
      const avatars = await fetchAvatarMap(clienteIds);

      const entries: RankingEntry[] = (rows ?? []).map((r, i) => {
        const clienteId = String(r.cliente_id);
        const points = Number(r.total_points);
        const played = Number(r.total_played);
        const exact  = Number(r.correct_exact);
        const pos    = Number(r.position);
        return {
          id:        String(r.id ?? r.cliente_id),
          clienteId,
          position:  Number.isFinite(pos) && pos > 0 ? pos : i + 1,
          name:      r.nombre ?? `Cliente ${r.cliente_id}`,
          avatarUrl: avatars[clienteId] ?? null,
          points:    Number.isFinite(points) ? points : 0,
          played:    Number.isFinite(played) ? played : 0,
          diff:      Number.isFinite(exact) ? exact : 0,
          isCurrent: clienteId === String(user?.cliente_id),
        };
      });

      setData(entries);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar ranking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [user?.cliente_id]);

  useEffect(() => {
    const ch = supabase
      .channel('ranking-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ranking' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel('ranking-clientes-avatars')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'clientes' },
        (payload) => {
          const row = payload.new as { cliente_id?: string; avatar_url?: string | null };
          if (!row?.cliente_id) return;
          const clienteId = String(row.cliente_id);
          setData((prev) =>
            prev.map((entry) =>
              entry.clienteId === clienteId
                ? { ...entry, avatarUrl: resolveAvatarUrl(row.avatar_url ?? null) }
                : entry,
            ),
          );
        },
      )
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
                      avatarUrl:          item.avatarUrl,
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
