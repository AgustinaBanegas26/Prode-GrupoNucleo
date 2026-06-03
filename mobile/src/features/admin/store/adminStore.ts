import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

type AdminStore = {
  isLoggedIn: boolean;
  adminEmail: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      adminEmail: null,
      login: (email: string, password: string) => {
        // Admin credentials: admin / 1234
        if (email === 'admin' && password === '1234') {
          set({ isLoggedIn: true, adminEmail: email });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ isLoggedIn: false, adminEmail: null });
      },
    }),
    {
      name: 'admin_auth_v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
