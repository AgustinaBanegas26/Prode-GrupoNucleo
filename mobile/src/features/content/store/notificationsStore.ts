import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type NotifAudience = 'global' | 'group' | 'individual';

export type PushNotification = {
  id: string;
  title: string;
  body: string;
  audience: NotifAudience;
  targetGroup?: string;
  targetUserId?: string;
  sentAt: number;
  status: 'sent' | 'scheduled' | 'failed';
};

type NotifInput = Omit<PushNotification, 'sentAt' | 'status'>;

type NotificationsStore = {
  notifications: PushNotification[];
  isHydrated: boolean;
  setHydrated: (v: boolean) => void;
  send: (notif: NotifInput) => void;
  remove: (id: string) => void;
};

const now = () => Date.now();

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      isHydrated: false,
      setHydrated: (v) => set({ isHydrated: v }),
      send: (notif) => {
        const next: PushNotification = {
          ...notif,
          sentAt: now(),
          status: 'sent',
        };
        set({ notifications: [next, ...get().notifications] });
      },
      remove: (id) =>
        set({ notifications: get().notifications.filter((n) => n.id !== id) }),
    }),
    {
      name: 'admin_notifications_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ notifications: s.notifications }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
