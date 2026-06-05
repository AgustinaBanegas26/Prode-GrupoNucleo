import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';
import { logActivity } from '../../admin/services/activityLogs';

export type PredictionRow = {
  id: string;
  fixture_id: number;
  cliente_id: string;
  home_goals: number | null;
  away_goals: number | null;
  pick: string | null;
  locked: boolean;
  points_earned: number;
  result_type: string | null;
  created_at: string;
  updated_at: string;
};

export type UpsertPredictionInput = {
  cliente_id: string;
  fixture_id: number;
  home_goals: number;
  away_goals: number;
};

export const predictionsQueryKey = (clienteId: string) =>
  ['predictions', clienteId] as const;

export function usePredictions(clienteId: string | undefined) {
  return useQuery({
    queryKey: predictionsQueryKey(clienteId ?? ''),
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('cliente_id', clienteId!);
      if (error) throw new Error(error.message);
      return (data ?? []) as PredictionRow[];
    },
  });
}

export function useAllPredictions() {
  return useQuery({
    queryKey: ['predictions', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('predictions').select('*');
      if (error) throw new Error(error.message);
      return (data ?? []) as PredictionRow[];
    },
  });
}

function inferPick(home: number, away: number): string {
  if (home > away) return '1';
  if (home < away) return '2';
  return 'X';
}

export function useUpsertPrediction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertPredictionInput) => {
      const { data: match, error: matchErr } = await supabase
        .from('matches')
        .select('match_date, home_team, away_team')
        .eq('fixture_id', input.fixture_id)
        .maybeSingle();
      if (matchErr) throw new Error(matchErr.message);

      if (match?.match_date) {
        const kickoff = new Date(match.match_date).getTime();
        const lockAt = kickoff - 10 * 60 * 1000;
        if (Date.now() >= lockAt) {
          throw new Error('Las predicciones están bloqueadas (10 min antes del partido).');
        }
      }

      const { data: existing } = await supabase
        .from('predictions')
        .select('id, locked')
        .eq('cliente_id', input.cliente_id)
        .eq('fixture_id', input.fixture_id)
        .maybeSingle();

      if (existing?.locked) {
        throw new Error('Esta predicción ya está bloqueada.');
      }

      const payload = {
        cliente_id: input.cliente_id,
        fixture_id: input.fixture_id,
        home_goals: input.home_goals,
        away_goals: input.away_goals,
        pick: inferPick(input.home_goals, input.away_goals),
        updated_at: new Date().toISOString(),
      };

      const isUpdate = !!existing?.id;

      if (isUpdate) {
        const { error } = await supabase
          .from('predictions')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('predictions').insert(payload);
        if (error) throw new Error(error.message);
      }

      await logActivity({
        user_id: input.cliente_id,
        cliente_id: input.cliente_id,
        action: isUpdate ? 'UPDATE_PREDICTION' : 'CREATE_PREDICTION',
        detail: `fixture_id: ${input.fixture_id}`,
      });

      return { isUpdate };
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: predictionsQueryKey(variables.cliente_id) });
      qc.invalidateQueries({ queryKey: ['predictions', 'all'] });
    },
  });
}
