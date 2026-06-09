import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';
import { logActivity } from '../../admin/services/activityLogs';
import { PREDICTION_LOCKED_MESSAGE } from '../../../utils/predictionLock';

function parsePredictionError(error: unknown, fallback: string): string {
  const msg = error instanceof Error ? error.message : String(error ?? fallback);
  if (msg.includes('PREDICTION_LOCKED')) return PREDICTION_LOCKED_MESSAGE;
  if (msg.includes('MATCH_NOT_FOUND')) return 'El partido no está disponible para pronósticos.';
  return msg || fallback;
}

// ── Tipos (schema real de Supabase) ──────────────────────────
// predictions: id, cliente_id, fixture_id, pick_winner,
//   score_home, score_away, points_earned, locked, submitted_at,
//   created_at, updated_at

export type PredictionRow = {
  id: string;
  cliente_id: string;
  fixture_id: number;
  pick_winner: 'home' | 'draw' | 'away';
  score_home: number | null;
  score_away: number | null;
  points_earned: number;
  locked: boolean;
  submitted_at: string;
  status?: 'pending' | 'correct' | 'incorrect' | 'partial';
  created_at: string;
  updated_at: string;
};

export type UpsertPredictionInput = {
  user_id: string;       // id interno del cliente (para logs)
  cliente_id: string;    // número de cliente visible
  fixture_id: number;
  pick_winner: 'home' | 'draw' | 'away';
  score_home: number | null;
  score_away: number | null;
};

// ── Query keys ────────────────────────────────────────────────
export const predictionsQueryKey = (clienteId: string) =>
  ['predictions', clienteId] as const;

export const allPredictionsQueryKey = ['predictions', 'all'] as const;

// ── Hooks ─────────────────────────────────────────────────────

/** Todas las predicciones — uso admin (dashboard, participación) */
export function useAllPredictions() {
  return useQuery({
    queryKey: allPredictionsQueryKey,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as PredictionRow[];
    },
  });
}

export function usePredictions(clienteId: string | undefined) {
  return useQuery({
    queryKey:  predictionsQueryKey(clienteId ?? ''),
    enabled:   !!clienteId,
    queryFn:   async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('cliente_id', clienteId!);
      if (error) throw new Error(error.message);
      return (data ?? []) as PredictionRow[];
    },
  });
}

let predictionsRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let predictionsRealtimeRefCount = 0;

export function usePredictionsRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const onChange = () => {
      void qc.invalidateQueries({ queryKey: ['predictions'] });
      void qc.refetchQueries({ queryKey: ['predictions'], type: 'active' });
    };

    if (predictionsRealtimeChannel) {
      predictionsRealtimeRefCount += 1;
      return () => {
        predictionsRealtimeRefCount -= 1;
        if (predictionsRealtimeRefCount <= 0 && predictionsRealtimeChannel) {
          void supabase.removeChannel(predictionsRealtimeChannel);
          predictionsRealtimeChannel = null;
          predictionsRealtimeRefCount = 0;
        }
      };
    }

    predictionsRealtimeChannel = supabase
      .channel('predictions-realtime-hook')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, onChange)
      .subscribe();

    predictionsRealtimeRefCount = 1;

    return () => {
      predictionsRealtimeRefCount -= 1;
      if (predictionsRealtimeRefCount <= 0 && predictionsRealtimeChannel) {
        void supabase.removeChannel(predictionsRealtimeChannel);
        predictionsRealtimeChannel = null;
        predictionsRealtimeRefCount = 0;
      }
    };
  }, [qc]);
}


export function useUpsertPrediction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertPredictionInput) => {
      const { data: existing } = await supabase
        .from('predictions')
        .select('id')
        .eq('cliente_id', input.cliente_id)
        .eq('fixture_id', input.fixture_id)
        .maybeSingle();

      const isUpdate = !!existing?.id;

      const { error } = await supabase.rpc('upsert_prediction_secure', {
        p_user_id: input.user_id,
        p_cliente_id: input.cliente_id,
        p_fixture_id: input.fixture_id,
        p_pick_winner: input.pick_winner,
        p_score_home: input.score_home,
        p_score_away: input.score_away,
      });

      if (error) throw new Error(parsePredictionError(error, 'No se pudo guardar el pronóstico'));

      logActivity({
        user_id: input.user_id,
        cliente_id: input.cliente_id,
        action: isUpdate ? 'UPDATE_PREDICTION' : 'CREATE_PREDICTION',
        detail: `fixture_id: ${input.fixture_id}, pick: ${input.pick_winner}`,
      });

      return { isUpdate };
    },
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({ queryKey: predictionsQueryKey(variables.cliente_id) });
      await qc.invalidateQueries({ queryKey: allPredictionsQueryKey });
      await qc.refetchQueries({ queryKey: predictionsQueryKey(variables.cliente_id), type: 'active' });
    },
  });
}

export type DeletePredictionInput = {
  user_id: string;
  cliente_id: string;
  prediction_id: string;
  fixture_id: number;
};

export function useDeletePrediction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeletePredictionInput) => {
      const { error } = await supabase.rpc('delete_prediction_secure', {
        p_cliente_id: input.cliente_id,
        p_prediction_id: input.prediction_id,
      });

      if (error) throw new Error(parsePredictionError(error, 'No se pudo eliminar el pronóstico'));

      logActivity({
        user_id:    input.user_id,
        cliente_id: input.cliente_id,
        action:     'DELETE_PREDICTION',
        detail:     `fixture_id: ${input.fixture_id}`,
      });
    },
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({ queryKey: predictionsQueryKey(variables.cliente_id) });
      await qc.invalidateQueries({ queryKey: allPredictionsQueryKey });
      await qc.refetchQueries({ queryKey: predictionsQueryKey(variables.cliente_id), type: 'active' });
    },
  });
}
