import { create } from 'zustand';

import type { AppUser } from '../types';
import { deleteUser, readUsers, resetUserToInitialPassword, setUserActivo, upsertUser } from '../services/usersDb';

export type UserInput = Omit<AppUser, 'createdAt' | 'ultimoAcceso'>;

type UsersStore = {
  users: AppUser[];
  isHydrated: boolean;
  isLoading: boolean;
  setHydrated: (value: boolean) => void;
  refresh: () => Promise<void>;
  upsert: (user: UserInput) => Promise<void>;
  remove: (userId: string) => Promise<void>;
  setActivo: (userId: string, activo: boolean) => Promise<void>;
  resetPassword: (userId: string) => Promise<string>;
};

const INITIAL_CLIENT_PASSWORD = 'clientesgn123';

export const useUsersStore = create<UsersStore>((set, get) => ({
  users: [],
  isHydrated: false,
  isLoading: false,
  setHydrated: (value) => set({ isHydrated: value }),
  refresh: async () => {
    set({ isLoading: true });
    try {
      const stored = await readUsers();
      set({ users: stored, isHydrated: true });
    } finally {
      set({ isLoading: false });
    }
  },
  upsert: async (user) => {
    await upsertUser(user);
    await get().refresh();
  },
  remove: async (userId) => {
    await deleteUser(userId);
    await get().refresh();
  },
  setActivo: async (userId, activo) => {
    await setUserActivo(userId, activo);
    await get().refresh();
  },
  resetPassword: async (userId) => {
    await resetUserToInitialPassword(userId);
    await get().refresh();
    return INITIAL_CLIENT_PASSWORD;
  },
}));

export const makeEmptyUser = (): UserInput => ({
  id: `${Date.now()}`, // bigint-safe
  clienteId: '',
  nombre: '',
  email: '',
  activo: true,
  primerLogin: true,
});
