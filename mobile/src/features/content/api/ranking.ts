import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';

// ── Tipos ─────────────────────────────────────────────────────

export type RankingRow = {
  id: string;
  user_id: string;
  cliente_id: string;
  nombre: string;
  total_points: number;
  total_played: number;
  correct_exact: number;
  correct_winner: number;
  position: number | null;
  updated_at: string;
};

// ── Query key ─────────────────────────────────────────────────

export const rankingQueryKey = ['ranking'] as const;

// ── Hooks ─────────────────────────────────────────────────────

export function useRanking() {
  return useQuery({
    queryKey: rankingQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ranking')
        .select('*')
        .order('total_points', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as RankingRow[];
    },
  });
}

/** Suscripción realtime — invalida ranking cuando hay cambios */
export function useRankingRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('ranking-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ranking' }, () => {
        qc.invalidateQueries({ queryKey: rankingQueryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
