import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type MatchStatus = 'upcoming' | 'live' | 'finished';

export type AdminMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
  date: string;
  time: string;
  stadium: string;
  group: string;
  phase: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  createdAt: number;
  updatedAt: number;
};

type MatchInput = Omit<AdminMatch, 'createdAt' | 'updatedAt'>;

type MatchesStore = {
  matches: AdminMatch[];
  isHydrated: boolean;
  setHydrated: (v: boolean) => void;
  upsert: (match: MatchInput) => void;
  remove: (id: string) => void;
  setResult: (id: string, homeScore: number, awayScore: number) => void;
  setStatus: (id: string, status: MatchStatus) => void;
};

const now = () => Date.now();

export const useMatchesStore = create<MatchesStore>()(
  persist(
    (set, get) => ({
      matches: [],
      isHydrated: false,
      setHydrated: (v) => set({ isHydrated: v }),
      upsert: (match) => {
        const existing = get().matches;
        const idx = existing.findIndex((m) => m.id === match.id);
        const next: AdminMatch = {
          ...match,
          createdAt: idx >= 0 ? existing[idx].createdAt : now(),
          updatedAt: now(),
        };
        set({
          matches:
            idx >= 0
              ? [...existing.slice(0, idx), next, ...existing.slice(idx + 1)]
              : [...existing, next],
        });
      },
      remove: (id) => set({ matches: get().matches.filter((m) => m.id !== id) }),
      setResult: (id, homeScore, awayScore) =>
        set({
          matches: get().matches.map((m) =>
            m.id === id
              ? { ...m, homeScore, awayScore, status: 'finished', updatedAt: now() }
              : m,
          ),
        }),
      setStatus: (id, status) =>
        set({
          matches: get().matches.map((m) =>
            m.id === id ? { ...m, status, updatedAt: now() } : m,
          ),
        }),
    }),
    {
      name: 'admin_matches_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ matches: s.matches }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

export const makeEmptyMatch = (): MatchInput => ({
  id: `${Date.now()}`,
  homeTeam: '',
  awayTeam: '',
  homeCode: '',
  awayCode: '',
  date: '',
  time: '',
  stadium: '',
  group: '',
  phase: 'Fase de Grupos',
  status: 'upcoming',
});
