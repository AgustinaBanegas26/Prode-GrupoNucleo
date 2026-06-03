import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type NewsStatus = 'published' | 'draft';

export type NewsItem = {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  date: number;
  status: NewsStatus;
  createdAt: number;
  updatedAt: number;
};

type NewsInput = Omit<NewsItem, 'createdAt' | 'updatedAt'>;

type NewsStore = {
  items: NewsItem[];
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
  upsert: (item: NewsInput) => void;
  remove: (id: string) => void;
  toggleStatus: (id: string) => void;
};

const now = () => Date.now();

export const useNewsStore = create<NewsStore>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,
      setHydrated: (value) => set({ isHydrated: value }),
      upsert: (item) => {
        const existing = get().items;
        const idx = existing.findIndex((n) => n.id === item.id);
        const next: NewsItem = {
          ...item,
          createdAt: idx >= 0 ? existing[idx].createdAt : now(),
          updatedAt: now(),
        };
        set({
          items: idx >= 0 ? [...existing.slice(0, idx), next, ...existing.slice(idx + 1)] : [...existing, next],
        });
      },
      remove: (id) => set({ items: get().items.filter((n) => n.id !== id) }),
      toggleStatus: (id) =>
        set({
          items: get().items.map((n) =>
            n.id === id ? { ...n, status: n.status === 'published' ? 'draft' : 'published', updatedAt: now() } : n,
          ),
        }),
    }),
    {
      name: 'content_news_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

export const makeEmptyNews = (): NewsInput => ({
  id: `${Date.now()}`,
  title: '',
  imageUrl: '',
  description: '',
  date: now(),
  status: 'draft',
});

