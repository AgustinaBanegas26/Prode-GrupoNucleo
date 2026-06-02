import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  mockCreatePassword,
  mockLogin,
  mockRequestPasswordReset,
  mockResetPassword,
} from '../features/auth/services/mockAuthService';
import type { CreatePasswordInput, LoginInput, ResetPasswordInput } from '../features/auth/types';

type AuthState = {
  session:
    | {
        token: string;
        user: {
          customerNumber: string;
          email: string;
        };
      }
    | null;
  isHydrated: boolean;
  setHydrated: (v: boolean) => void;
  signIn: (input: LoginInput) => Promise<void>;
  createPassword: (input: CreatePasswordInput) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
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
      createPassword: async (input) => {
        const session = await mockCreatePassword(input);
        set({ session });
      },
      requestPasswordReset: async (email) => {
        const { code } = await mockRequestPasswordReset({ email });
        return code;
      },
      resetPassword: async (input) => {
        await mockResetPassword(input);
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

