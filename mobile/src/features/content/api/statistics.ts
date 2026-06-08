import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useEffect } from 'react';

export type StatisticsData = {
  totalUsers: number;
  activeUsers: number;
  totalPredictions: number;
  avgAccuracy: number;
  participationByDay: { label: string; value: number }[];
};

export const statisticsQueryKey = ['statistics'];

export function useStatistics() {
  return useQuery({
    queryKey: statisticsQueryKey,
    queryFn: async (): Promise<StatisticsData> => {
      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });
      if (usersError) throw usersError;

      // Get active users
      const { count: activeUsers, error: activeError } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('habilitado', true);
      if (activeError) throw activeError;

      // Get total predictions
      const { count: totalPredictions, error: predError } = await supabase
        .from('predictions')
        .select('*', { count: 'exact', head: true });
      if (predError) throw predError;

      // Real participation by day — count predictions per day of the week
      let participationByDay: { label: string; value: number }[] = [
        { label: 'Lun', value: 0 },
        { label: 'Mar', value: 0 },
        { label: 'Mié', value: 0 },
        { label: 'Jue', value: 0 },
        { label: 'Vie', value: 0 },
        { label: 'Sáb', value: 0 },
        { label: 'Dom', value: 0 },
      ];

      if (totalPredictions && totalPredictions > 0) {
        const { data: predRows } = await supabase
          .from('predictions')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(500);
        if (predRows) {
          for (const row of predRows) {
            const dow = new Date(row.created_at).getDay(); // 0=Sun
            const idx = dow === 0 ? 6 : dow - 1; // Mon=0…Sun=6
            participationByDay[idx].value += 1;
          }
        }
      }

      // avgAccuracy: real percentage from scores table
      let avgAccuracy = 0;
      const { count: totalScores } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true });
      const { count: correctScores } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true })
        .in('result_type', ['exact', 'winner', 'draw']);
      if (totalScores && totalScores > 0 && correctScores !== null) {
        avgAccuracy = Math.round((correctScores / totalScores) * 100);
      }

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalPredictions: totalPredictions || 0,
        avgAccuracy,
        participationByDay,
      };
    },
  });
}

export function useStatisticsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('statistics-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        queryClient.invalidateQueries({ queryKey: statisticsQueryKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, () => {
        queryClient.invalidateQueries({ queryKey: statisticsQueryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
