import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';
import { adminApiFetch } from '../../../lib/backendApi';

export type NotificationAudience = 'global' | 'group' | 'individual';

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  audience: NotificationAudience;
  target_group: string | null;
  target_user_id: string | null;
  sent_at: string;
  created_at: string;
};

export type SendNotificationInput = {
  title: string;
  body: string;
  audience: NotificationAudience;
  target_group?: string;
  target_user_id?: string;
  adminToken?: string;
};

export const notificationsQueryKey = ['notifications'] as const;

export function useNotifications() {
  return useQuery({
    queryKey: notificationsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('sent_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as NotificationRow[];
    },
  });
}

export function useNotificationsRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        qc.invalidateQueries({ queryKey: notificationsQueryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useSendNotification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendNotificationInput) => {
      const now = new Date().toISOString();

      if (input.adminToken) {
        await adminApiFetch('/admin/notifications/send', input.adminToken, {
          method: 'POST',
          body: JSON.stringify({
            title: input.title,
            body: input.body,
            audience: input.audience,
            target_user_id: input.target_user_id,
          }),
        });
        return;
      }

      await supabase.from('notifications').insert({
        title: input.title,
        body: input.body,
        audience: input.audience,
        target_group: input.target_group ?? null,
        target_user_id: input.target_user_id ?? null,
        sent_at: now,
      });

      const { error } = await supabase.from('notifications_outbox').insert({
        event_type: 'manual',
        title: input.title,
        body: input.body,
        audience: input.audience,
        target_group: input.target_group ?? null,
        target_user_id: input.target_user_id ?? null,
        status: 'pending',
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsQueryKey }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsQueryKey }),
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('daily_reminder_enabled')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return { dailyReminderEnabled: data?.daily_reminder_enabled ?? true };
    },
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dailyReminderEnabled: boolean) => {
      const { error } = await supabase
        .from('notification_settings')
        .update({
          daily_reminder_enabled: dailyReminderEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification_settings'] }),
  });
}
