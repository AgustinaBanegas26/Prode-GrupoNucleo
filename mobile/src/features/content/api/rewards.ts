import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';

// ── Tipos ─────────────────────────────────────────────────────

export type RewardRow = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  quantity: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type UpsertRewardInput = {
  id?: string;
  name: string;
  description: string;
  image_url: string | null;
  quantity: number;
  status: 'active' | 'inactive';
};

// ── Query key ─────────────────────────────────────────────────

export const rewardsQueryKey = ['rewards'] as const;

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// ── Hooks ─────────────────────────────────────────────────────

export function useRewards() {
  return useQuery({
    queryKey: rewardsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as RewardRow[];
    },
  });
}

/** Realtime */
export function useRewardsRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('rewards-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => {
        qc.invalidateQueries({ queryKey: rewardsQueryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useUpsertReward() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertRewardInput) => {
      const id = input.id ?? makeId();
      const { error } = await supabase.from('rewards').upsert(
        {
          id,
          name: input.name,
          description: input.description,
          image_url: input.image_url,
          quantity: input.quantity,
          status: input.status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rewardsQueryKey }),
  });
}

export function useDeleteReward() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rewards').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rewardsQueryKey }),
  });
}
