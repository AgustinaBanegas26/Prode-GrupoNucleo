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

      // Mock participation by day for now (we can improve this later)
      const participationByDay = [
        { label: 'Lun', value: totalPredictions ? Math.floor(Math.random() * totalPredictions) : 0 },
        { label: 'Mar', value: totalPredictions ? Math.floor(Math.random() * totalPredictions) : 0 },
        { label: 'Mié', value: totalPredictions ? Math.floor(Math.random() * totalPredictions) : 0 },
        { label: 'Jue', value: totalPredictions ? Math.floor(Math.random() * totalPredictions) : 0 },
        { label: 'Vie', value: totalPredictions ? Math.floor(Math.random() * totalPredictions) : 0 },
        { label: 'Sáb', value: totalPredictions ? Math.floor(Math.random() * totalPredictions) : 0 },
        { label: 'Dom', value: totalPredictions ? Math.floor(Math.random() * totalPredictions) : 0 },
      ];

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalPredictions: totalPredictions || 0,
        avgAccuracy: 65,
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
