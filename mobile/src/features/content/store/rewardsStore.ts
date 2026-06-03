import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type RewardStatus = 'active' | 'inactive';

export type Reward = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  quantity: number;
  status: RewardStatus;
  createdAt: number;
  updatedAt: number;
};

type RewardInput = Omit<Reward, 'createdAt' | 'updatedAt'>;

type RewardsStore = {
  rewards: Reward[];
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
  upsert: (reward: RewardInput) => void;
  remove: (id: string) => void;
  toggleStatus: (id: string) => void;
};

const now = () => Date.now();

export const useRewardsStore = create<RewardsStore>()(
  persist(
    (set, get) => ({
      rewards: [],
      isHydrated: false,
      setHydrated: (value) => set({ isHydrated: value }),
      upsert: (reward) => {
        const existing = get().rewards;
        const idx = existing.findIndex((r) => r.id === reward.id);
        const next: Reward = {
          ...reward,
          createdAt: idx >= 0 ? existing[idx].createdAt : now(),
          updatedAt: now(),
        };
        set({
          rewards: idx >= 0 ? [...existing.slice(0, idx), next, ...existing.slice(idx + 1)] : [...existing, next],
        });
      },
      remove: (id) => set({ rewards: get().rewards.filter((r) => r.id !== id) }),
      toggleStatus: (id) =>
        set({
          rewards: get().rewards.map((r) =>
            r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active', updatedAt: now() } : r,
          ),
        }),
    }),
    {
      name: 'content_rewards_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ rewards: s.rewards }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

export const makeEmptyReward = (): RewardInput => ({
  id: `${Date.now()}`,
  name: '',
  description: '',
  imageUrl: '',
  quantity: 0,
  status: 'active',
});

