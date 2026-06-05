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
        .order('points', { ascending: false });
      if (error) throw error;

      // Join with users to get names
      const { data: usersData } = await supabase.from('users').select('id, nombre, apellido');
      const userMap = new Map(usersData?.map(u => [u.id, `${u.nombre} ${u.apellido}`]) || []);

      return (data || []).map((row, index) => ({
        ...mapRowToRanking(row, index),
        userName: userMap.get(row.cliente_id) || row.cliente_id,
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
