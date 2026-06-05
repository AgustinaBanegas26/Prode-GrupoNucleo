import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushToken(params: {
  userRole: 'client' | 'admin';
  clienteId?: string;
  adminId?: string;
}): Promise<void> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;
  if (existing.status !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    process.env.EAS_PROJECT_ID;

  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const expoPushToken = tokenData.data;

  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_role: params.userRole,
      cliente_id: params.clienteId ?? null,
      admin_id: params.adminId ?? null,
      expo_push_token: expoPushToken,
      device_platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' },
  );

  if (error) {
    console.warn('[push] register error:', error.message);
  }
}
