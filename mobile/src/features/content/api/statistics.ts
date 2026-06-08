import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useEffect } from 'react';

export type StatisticsData = {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalMatches: number;
  totalPredictions: number;
  totalNews: number;
  totalSlider: number;
  avgAccuracy: number;
  participationByDay: { label: string; value: number }[];
};

export const statisticsQueryKey = ['statistics'];

export function useStatistics() {
  return useQuery({
    queryKey: statisticsQueryKey,
    queryFn: async (): Promise<StatisticsData> => {
      // Get total users (Registered)
      const { count: totalUsers } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      // Get active users (who accessed at least once)
      const { count: activeUsers } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .not('ultimo_acceso', 'is', null);

      // Get blocked users
      const { count: blockedUsers } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('habilitado', false);

      // Get total matches (loaded)
      const { count: totalMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true });

      // Get total predictions (realizadas)
      const { count: totalPredictions } = await supabase
        .from('predictions')
        .select('*', { count: 'exact', head: true });

      // Get news count (published)
      const { count: totalNews } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Get slider images count (active)
      const { count: totalSlider } = await supabase
        .from('slider_slides')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

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

      const predictionsCount = totalPredictions ?? 0;
      if (predictionsCount > 0) {
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
        totalUsers: totalUsers ?? 0,
        activeUsers: activeUsers ?? 0,
        blockedUsers: blockedUsers ?? 0,
        totalMatches: totalMatches ?? 0,
        totalPredictions: predictionsCount,
        totalNews: totalNews ?? 0,
        totalSlider: totalSlider ?? 0,
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
