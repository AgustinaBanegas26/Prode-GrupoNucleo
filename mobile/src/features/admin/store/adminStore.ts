import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

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

const generateToken = () =>
  `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      session: null,
      isHydrated: false,
      setHydrated: (value) => set({ isHydrated: value }),
      signIn: async (username, password) => {
        if (username === 'admin' && password === '1234') {
          set({
            session: {
              token: generateToken(),
              username,
              role: 'admin',
            },
          });
          return true;
        }
        return false;
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
