import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';

export type ScoringConfig = {
  points_exact: number;
  points_winner: number;
  points_draw: number;
};

export const scoringConfigKey = ['scoring_config'] as const;

export function useScoringConfig() {
  return useQuery({
    queryKey: scoringConfigKey,
    queryFn: async (): Promise<ScoringConfig> => {
      const { data, error } = await supabase
        .from('scoring_config')
        .select('points_exact, points_winner, points_draw')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return {
        points_exact: data?.points_exact ?? 3,
        points_winner: data?.points_winner ?? 1,
        points_draw: data?.points_draw ?? 1,
      };
    },
  });
}

export function useUpdateScoringConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cfg: ScoringConfig) => {
      const { error } = await supabase
        .from('scoring_config')
        .update({
          points_exact: cfg.points_exact,
          points_winner: cfg.points_winner,
          points_draw: cfg.points_draw,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: scoringConfigKey }),
  });
}
