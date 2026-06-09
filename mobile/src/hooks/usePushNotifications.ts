import { useEffect } from 'react';

import { useAuth } from '../providers/AuthProvider';
import { registerPushTokenForUser, subscribeToPushTokenRefresh } from '../services/pushNotifications';

export function usePushNotifications(enabled = true) {
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !user) return;

    void registerPushTokenForUser(user);
    return subscribeToPushTokenRefresh(user);
  }, [enabled, user?.id, user?.cliente_id, user?.role, user?.usuario]);
}
