import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export type RankingRow = {
  id: string;
  cliente_id: string;
  nombre: string;
  total_points: number;
  total_played: number;
  correct_exact: number;
  correct_winner: number;
  position: number | null;
  updated_at: string;
};

export type RankingCacheRow = {
  id: string;
  scope: string;
  cliente_id: string;
  points: number;
  played: number;
  diff: number;
  exact_hits: number;
  updated_at: string;
};

export type RankingItem = {
  id: string;
  userName: string;
  points: number;
  played: number;
  position: number;
};

export type RankingPeriod = 'general' | 'semanal' | 'mensual';

export const rankingQueryKey = (period: RankingPeriod = 'general') =>
  ['ranking', period] as const;

export function useRanking(period: RankingPeriod = 'general') {
  return useQuery<RankingItem[]>({
    queryKey: rankingQueryKey(period),
    queryFn: async () => {
      if (period === 'general') {
        // Use ranking table which has nombres
        const { data, error } = await supabase
          .from('ranking')
          .select('*')
          .order('total_points', { ascending: false });
        if (error) throw new Error(error.message);
        return ((data ?? []) as RankingRow[]).map((r, i) => {
          const points = Number(r.total_points);
          const played = Number(r.total_played);
          const pos = Number(r.position);
          return {
            id: r.cliente_id,
            userName: r.nombre ?? `Cliente ${r.cliente_id}`,
            points: Number.isFinite(points) ? points : 0,
            played: Number.isFinite(played) ? played : 0,
            position: Number.isFinite(pos) && pos > 0 ? pos : i + 1,
          };
        });
      }
      // semanal / mensual — use ranking_cache scopes
      const scope = period === 'semanal' ? 'semanal' : 'mensual';
      const { data, error } = await supabase
        .from('ranking_cache')
        .select('*')
        .eq('scope', scope)
        .order('points', { ascending: false });
      if (error) throw new Error(error.message);
      return ((data ?? []) as RankingCacheRow[]).map((r, i) => ({
        id: r.cliente_id,
        userName: `Cliente ${r.cliente_id}`,
        points: r.points ?? 0,
        played: r.played ?? 0,
        position: i + 1,
      }));
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useRankingRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('ranking-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ranking' }, () => {
        qc.invalidateQueries({ queryKey: ['ranking'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ranking_cache' }, () => {
        qc.invalidateQueries({ queryKey: ['ranking'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);
}
