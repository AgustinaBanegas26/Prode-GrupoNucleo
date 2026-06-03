import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AdminActivityAction = 'create' | 'update' | 'delete' | 'toggle' | 'login' | 'logout' | 'export';
export type AdminActivityModule =
  | 'auth'
  | 'users'
  | 'images'
  | 'slider'
  | 'news'
  | 'rewards'
  | 'rankings'
  | 'reports'
  | 'participation'
  | 'branding';

export type AdminActivity = {
  id: string;
  action: AdminActivityAction;
  module: AdminActivityModule;
  title: string;
  detail?: string;
  createdAt: number;
};

type AdminActivityInput = Omit<AdminActivity, 'id' | 'createdAt'> & { id?: string; createdAt?: number };

type AdminActivityStore = {
  items: AdminActivity[];
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
  log: (input: AdminActivityInput) => void;
  clear: () => void;
};

const now = () => Date.now();

export const useAdminActivityStore = create<AdminActivityStore>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,
      setHydrated: (value) => set({ isHydrated: value }),
      log: (input) => {
        const entry: AdminActivity = {
          id: input.id ?? `${now()}`,
          action: input.action,
          module: input.module,
          title: input.title,
          detail: input.detail,
          createdAt: input.createdAt ?? now(),
        };
        set({ items: [entry, ...get().items].slice(0, 500) });
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: 'admin_activity_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
