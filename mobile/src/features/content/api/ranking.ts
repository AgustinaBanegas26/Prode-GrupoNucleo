import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

// Schema real: id, cliente_id, nombre, total_points, total_played,
//   correct_exact, correct_winner, position, updated_at

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

export const rankingQueryKey = ['ranking'] as const;

export function useRanking() {
  return useQuery<RankingRow[]>({
    queryKey: rankingQueryKey,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('ranking')
        .select('*')
        .order('total_points', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as RankingRow[];
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
        qc.invalidateQueries({ queryKey: rankingQueryKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);
}
