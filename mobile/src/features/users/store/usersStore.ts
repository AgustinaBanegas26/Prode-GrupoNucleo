import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';

import type { AppUser } from '../types';
import { supabase } from '../../../lib/supabase';
import {
  deleteUser,
  mapRowToUser,
  readUsers,
  resetUserToInitialPassword,
  setUserActivo,
  upsertUser,
} from '../services/usersDb';

export type UserInput = Omit<AppUser, 'createdAt' | 'ultimoAcceso'>;

type UsersStore = {
  users: AppUser[];
  isHydrated: boolean;
  isLoading: boolean;
  isRealtimeConnected: boolean;
  /** Suscripción realtime a public.clientes (idempotente, retorna cleanup). */
  startRealtime: () => () => void;
  setHydrated: (value: boolean) => void;
  refresh: () => Promise<void>;
  /** Upsert solo en memoria (sin tocar DB). */
  upsertLocal: (user: AppUser) => void;
  /** Remove solo en memoria (sin tocar DB). */
  removeLocal: (userId: string) => void;
  upsert: (user: UserInput) => Promise<void>;
  remove: (userId: string) => Promise<void>;
  setActivo: (userId: string, activo: boolean) => Promise<void>;
  resetPassword: (userId: string) => Promise<string>;

  // Estado interno (no usar desde UI)
  _realtimeChannel: RealtimeChannel | null;
  _realtimeRefCount: number;
};

const INITIAL_CLIENT_PASSWORD = 'clientesgn123';

export const useUsersStore = create<UsersStore>((set, get) => ({
  users: [],
  isHydrated: false,
  isLoading: false,
  isRealtimeConnected: false,
  _realtimeChannel: null,
  _realtimeRefCount: 0,

  startRealtime: () => {
    // Ref-count: por si accidentalmente se monta en más de una pantalla.
    const existing = get()._realtimeChannel;
    if (existing) {
      set({ _realtimeRefCount: get()._realtimeRefCount + 1 });
      return () => {
        const nextCount = Math.max(0, get()._realtimeRefCount - 1);
        if (nextCount === 0 && get()._realtimeChannel) {
          supabase.removeChannel(get()._realtimeChannel);
          set({ _realtimeChannel: null, isRealtimeConnected: false });
        }
        set({ _realtimeRefCount: nextCount });
      };
    }

    try {
      const channel = supabase
        .channel('clientes-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, (payload: any) => {
          try {
            if (payload?.eventType === 'DELETE') {
              const deletedId = payload?.old?.id;
              if (deletedId != null) get().removeLocal(String(deletedId));
              return;
            }

            const row = payload?.new;
            if (!row) return;
            const mapped = mapRowToUser(row);
            get().upsertLocal(mapped);
          } catch {
            // Si algo falla en incremental, no rompemos: el refresh sigue existiendo como fallback.
          }
        })
        .subscribe((status) => {
          set({ isRealtimeConnected: status === 'SUBSCRIBED' });
        });

      set({ _realtimeChannel: channel, _realtimeRefCount: 1 });

      return () => {
        const nextCount = Math.max(0, get()._realtimeRefCount - 1);
        if (nextCount === 0 && get()._realtimeChannel) {
          supabase.removeChannel(get()._realtimeChannel);
          set({ _realtimeChannel: null, isRealtimeConnected: false });
        }
        set({ _realtimeRefCount: nextCount });
      };
    } catch {
      // Mantener el comportamiento actual si falla realtime (todo sigue funcionando con refresh).
      set({ isRealtimeConnected: false, _realtimeChannel: null, _realtimeRefCount: 0 });
      return () => {};
    }
  },

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

  upsertLocal: (user) => {
    set((state) => {
      const idx = state.users.findIndex((u) => u.id === user.id);
      const next = state.users.slice();
      if (idx >= 0) next[idx] = user;
      else next.unshift(user);
      next.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0) || a.nombre.localeCompare(b.nombre));
      return { users: next };
    });
  },
  removeLocal: (userId) => {
    set((state) => ({ users: state.users.filter((u) => u.id !== userId) }));
  },

  upsert: async (user) => {
    const saved = await upsertUser(user);
    let localOk = true;
    try {
      get().upsertLocal(saved);
    } catch {
      localOk = false;
    }
    // Fallback: si no hay realtime conectado (o falló el incremental), mantenemos el comportamiento anterior (refetch total).
    if (!get().isRealtimeConnected || !localOk) await get().refresh();
  },
  remove: async (userId) => {
    await deleteUser(userId);
    let localOk = true;
    try {
      get().removeLocal(userId);
    } catch {
      localOk = false;
    }
    if (!get().isRealtimeConnected || !localOk) await get().refresh();
  },
  setActivo: async (userId, activo) => {
    await setUserActivo(userId, activo);
    let localOk = true;
    try {
      const existing = get().users.find((u) => u.id === userId);
      if (existing) get().upsertLocal({ ...existing, activo });
    } catch {
      localOk = false;
    }
    if (!get().isRealtimeConnected || !localOk) await get().refresh();
  },
  resetPassword: async (userId) => {
    await resetUserToInitialPassword(userId);
    let localOk = true;
    try {
      const existing = get().users.find((u) => u.id === userId);
      if (existing) get().upsertLocal({ ...existing, primerLogin: true });
    } catch {
      localOk = false;
    }
    if (!get().isRealtimeConnected || !localOk) await get().refresh();
    return INITIAL_CLIENT_PASSWORD;
  },
}));

export const makeEmptyUser = (): UserInput => ({
  id: '',
  clienteId: '',
  nombre: '',
  email: null,
  activo: true,
  primerLogin: true,
  avatarUrl: null,
});
