import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';
import { logActivity } from '../../admin/services/activityLogs';

// ── Tipos ─────────────────────────────────────────────────────

export type NewsRow = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type UpsertNewsInput = {
  id?: string;
  title: string;
  description: string;
  image_url: string | null;
  published: boolean;
  /** user_id del admin que realiza la acción (para logs) */
  admin_user_id?: string;
};

// ── Query key ─────────────────────────────────────────────────

export const newsQueryKey = ['news'] as const;

// ── Helpers ───────────────────────────────────────────────────

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// ── Hooks ─────────────────────────────────────────────────────

/** Todas las noticias (admin) */
export function useAllNews() {
  return useQuery({
    queryKey: newsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as NewsRow[];
    },
  });
}

/** Solo publicadas (usuarios) */
export function usePublishedNews() {
  return useQuery({
    queryKey: [...newsQueryKey, 'published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as NewsRow[];
    },
  });
}

/** Realtime — invalida news cuando hay cambios */
export function useNewsRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('news-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
        qc.invalidateQueries({ queryKey: newsQueryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useUpsertNews() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertNewsInput) => {
      const id = input.id ?? makeId();
      const isNew = !input.id;

      const { error } = await supabase.from('news').upsert(
        {
          id,
          title: input.title,
          description: input.description,
          image_url: input.image_url,
          published: input.published,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
      if (error) throw new Error(error.message);

      if (input.admin_user_id) {
        await logActivity({
          user_id: input.admin_user_id,
          action: isNew ? 'CREATE_NEWS' : 'UPDATE_NEWS',
          detail: input.title,
        });
      }

      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: newsQueryKey }),
  });
}

export function useDeleteNews() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, admin_user_id }: { id: string; title: string; admin_user_id?: string }) => {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) throw new Error(error.message);

      if (admin_user_id) {
        await logActivity({
          user_id: admin_user_id,
          action: 'DELETE_NEWS',
          detail: title,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: newsQueryKey }),
  });
}
