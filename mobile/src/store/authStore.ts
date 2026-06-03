import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mockLogin } from '../features/auth/services/mockAuthService';
import type { LoginInput } from '../features/auth/types';

type AuthState = {
  session:
    | {
        token: string;
        user: {
          id: string;
          numeroEmpleado: string;
          nombre: string;
          apellido: string;
          rol: 'admin' | 'usuario';
          activo: boolean;
        };
      }
    | null;
  isHydrated: boolean;
  setHydrated: (v: boolean) => void;
  signIn: (input: LoginInput) => Promise<void>;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      isHydrated: false,
      setHydrated: (v) => set({ isHydrated: v }),
      signIn: async (input) => {
        const session = await mockLogin(input);
        set({ session });
      },
      signOut: () => set({ session: null }),
    }),
    {
      name: 'auth_store_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ session: s.session }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

