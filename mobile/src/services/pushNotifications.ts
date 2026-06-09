import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '../lib/supabase';
import type { SessionUser } from '../providers/AuthProvider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getExpoProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.easConfig?.projectId
    ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID
  );
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Prode Grupo Núcleo',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3DA5F5',
  });
}

export async function registerPushTokenForUser(user: SessionUser): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!Device.isDevice) {
    console.warn('[push] Las notificaciones push requieren un dispositivo físico.');
    return;
  }

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[push] Permiso de notificaciones denegado.');
    return;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    console.warn('[push] Falta EAS projectId en app.json (extra.eas.projectId).');
    return;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const expoPushToken = tokenResponse.data;
  if (!expoPushToken) return;

  const deviceId =
    Constants.sessionId
    ?? Constants.installationId
    ?? `${Platform.OS}-${user.id}`;

  const row = {
    user_role: user.role,
    cliente_id: user.role === 'client' ? user.cliente_id ?? null : null,
    admin_id: user.role === 'admin' ? (user.usuario ?? user.admin_id ?? null) : null,
    expo_push_token: expoPushToken,
    device_id: deviceId,
    device_platform: Platform.OS,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('push_tokens')
    .upsert(row, { onConflict: 'expo_push_token' });

  if (error) {
    console.warn('[push] No se pudo guardar el token:', error.message);
  }
}

export function subscribeToPushTokenRefresh(user: SessionUser | null) {
  if (Platform.OS === 'web' || !user) return () => {};

  const sub = Notifications.addPushTokenListener(() => {
    void registerPushTokenForUser(user);
  });

  return () => sub.remove();
}
