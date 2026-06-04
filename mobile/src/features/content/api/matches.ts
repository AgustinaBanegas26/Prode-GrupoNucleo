import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';

// ── Tipos ─────────────────────────────────────────────────────

export type MatchRow = {
  fixture_id: number;
  home_team: string;
  away_team: string;
  home_logo: string | null;
  away_logo: string | null;
  home_goals: number | null;
  away_goals: number | null;
  status: string;
  match_date: string;
  round: string | null;
  venue: string | null;
  updated_at: string;
};

// ── Query keys ────────────────────────────────────────────────

export const matchesQueryKey = ['matches'] as const;

// ── Hooks ─────────────────────────────────────────────────────

export function useMatches() {
  return useQuery({
    queryKey: matchesQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as MatchRow[];
    },
  });
}

export function useMatchById(fixtureId: number | undefined) {
  return useQuery({
    queryKey: [...matchesQueryKey, fixtureId],
    enabled: fixtureId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('fixture_id', fixtureId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as MatchRow | null;
    },
  });
}

/** Suscripción realtime — invalida la query cuando hay cambios en matches */
export function useMatchesRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('matches-realtime-hook')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        qc.invalidateQueries({ queryKey: matchesQueryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

/** Upsert de un partido (admin) */
export function useUpsertMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<MatchRow> & { fixture_id: number }) => {
      const { error } = await supabase
        .from('matches')
        .upsert(row, { onConflict: 'fixture_id' });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: matchesQueryKey }),
  });
}
