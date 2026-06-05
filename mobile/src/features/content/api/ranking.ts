import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export type RankingItem = {
  id: string;
  position: number;
  clienteId: string;
  userName: string;
  points: number;
  played: number;
  diff: number;
  isCurrent?: boolean;
};

function mapRowToRanking(row: any, index: number): RankingItem {
  return {
    id: row.id,
    position: index + 1,
    clienteId: row.cliente_id,
    userName: row.user_name || 'Usuario',
    points: row.points || 0,
    played: row.played || 0,
    diff: row.diff || 0,
  };
}

export const rankingQueryKey = ['ranking'];

export function useRanking(scope: string = 'general') {
  return useQuery({
    queryKey: [...rankingQueryKey, scope],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ranking_cache')
        .select('*')
        .eq('scope', scope)
        .order('points', { ascending: false })
        .order('exact_hits', { ascending: false });
      if (error) throw error;

      // Join con clientes (producción)
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('id, cliente_id, nombre');

      const idMap = new Map<string, string>(
        (clientesData ?? []).map((c: any) => [String(c.id), String(c.nombre)]),
      );
      const clienteIdMap = new Map<string, string>(
        (clientesData ?? []).map((c: any) => [String(c.cliente_id), String(c.nombre)]),
      );

      return (data || []).map((row, index) => ({
        ...mapRowToRanking(row, index),
        userName:
          idMap.get(String(row.cliente_id)) ||
          clienteIdMap.get(String(row.cliente_id)) ||
          String(row.user_name || row.cliente_id || 'Usuario'),
      }));
    },
  });
}

export function useRankingRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('ranking-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ranking_cache' }, () => {
        queryClient.invalidateQueries({ queryKey: rankingQueryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
