import { useQuery } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';

export type ScoreRow = {
  id: string;
  cliente_id: string;
  match_id: number;
  prediction_id: string | null;
  points_earned: number;
  result_type: 'exact' | 'winner' | 'draw' | 'wrong';
  calculated_at: string;
};

export const scoresQueryKey = (clienteId: string) => ['scores', clienteId] as const;

export function useUserScores(clienteId: string | undefined) {
  return useQuery({
    queryKey: scoresQueryKey(clienteId ?? ''),
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('cliente_id', clienteId!)
        .order('calculated_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as ScoreRow[];
    },
  });
}

export function resultTypeLabel(type: ScoreRow['result_type']): string {
  switch (type) {
    case 'exact':
      return 'Resultado exacto';
    case 'winner':
      return 'Ganador correcto';
    case 'draw':
      return 'Empate correcto';
    default:
      return 'Sin puntos';
  }
}
