import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

import { devAdminAuthService } from '../services/adminAuthService';

export type AdminSession = {
  token: string;
  username: string;
  role: 'admin';
};

type AdminStore = {
  session: AdminSession | null;
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => void;
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      session: null,
      isHydrated: false,
      setHydrated: (value) => set({ isHydrated: value }),
      signIn: async (username, password) => {
        const res = await devAdminAuthService.signIn(username, password);
        if (!res.ok) return false;
        set({
          session: {
            token: res.token,
            username: res.username,
            role: 'admin',
          },
        });
        return true;
      },
      signOut: () => set({ session: null }),
    }),
    {
      name: 'admin_auth_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ session: s.session }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
