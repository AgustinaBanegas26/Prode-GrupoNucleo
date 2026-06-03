import { create } from 'zustand';

import type { AppUser, StoredUser, UserRole, UserStatus } from '../types';
import { deleteUser, readUsers, setUserPassword, setUserStatus, upsertUser } from '../services/usersDb';

type UserInput = Omit<AppUser, 'createdAt' | 'updatedAt'>;

type UsersStore = {
  users: AppUser[];
  isHydrated: boolean;
  isLoading: boolean;
  setHydrated: (value: boolean) => void;
  refresh: () => Promise<void>;
  upsert: (user: UserInput) => Promise<void>;
  remove: (userId: string) => Promise<void>;
  setStatus: (userId: string, status: UserStatus) => Promise<void>;
  resetPassword: (userId: string) => Promise<string>;
};

const stripPassword = ({ password: _password, ...rest }: StoredUser): AppUser => rest;

const generatePassword = () => `${Math.floor(1000 + Math.random() * 9000)}`;

export const useUsersStore = create<UsersStore>((set, get) => ({
  users: [],
  isHydrated: false,
  isLoading: false,
  setHydrated: (value) => set({ isHydrated: value }),
  refresh: async () => {
    set({ isLoading: true });
    try {
      const stored = await readUsers();
      set({ users: stored.map(stripPassword), isHydrated: true });
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
  setStatus: async (userId, status) => {
    await setUserStatus(userId, status);
    await get().refresh();
  },
  resetPassword: async (userId) => {
    const next = generatePassword();
    await setUserPassword(userId, next);
    await get().refresh();
    return next;
  },
}));

export const makeEmptyUser = (): UserInput => ({
  id: `${Date.now()}`,
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  customerNumber: '',
  status: 'active',
  role: 'user' as UserRole,
});
