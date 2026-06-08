import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';
import { logActivity } from '../../admin/services/activityLogs';

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
      // Verificar si ya existe un pronóstico para este cliente + partido
      const { data: existing } = await supabase
        .from('predictions')
        .select('id')
        .eq('cliente_id', input.cliente_id)
        .eq('fixture_id', input.fixture_id)
        .maybeSingle();

      const isUpdate = !!existing?.id;
      const now = new Date().toISOString();

      const payload = {
        cliente_id:    input.cliente_id,
        fixture_id:    input.fixture_id,
        pick_winner:   input.pick_winner,
        score_home:    input.score_home,
        score_away:    input.score_away,
        submitted_at:  now,
        updated_at:    now,
      };

      if (isUpdate) {
        const { error } = await supabase
          .from('predictions')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('predictions')
          .insert({ ...payload, points_earned: 0, locked: false });
        if (error) throw new Error(error.message);
      }

      // Log de actividad (fire-and-forget)
      logActivity({
        user_id:    input.user_id,
        cliente_id: input.cliente_id,
        action:     isUpdate ? 'UPDATE_PREDICTION' : 'CREATE_PREDICTION',
        detail:     `fixture_id: ${input.fixture_id}, pick: ${input.pick_winner}`,
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
