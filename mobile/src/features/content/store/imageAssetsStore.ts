import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ImageAssetStatus = 'active' | 'inactive';
export type ImageAssetPlacement = 'slider' | 'ads' | 'banners';

export type ImageAsset = {
  id: string;
  title: string;
  imageUrl: string;
  link?: string;
  placement: ImageAssetPlacement;
  status: ImageAssetStatus;
  createdAt: number;
  updatedAt: number;
};

type ImageAssetInput = Omit<ImageAsset, 'createdAt' | 'updatedAt'>;

type ImageAssetsStore = {
  assets: ImageAsset[];
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
  upsert: (asset: ImageAssetInput) => void;
  remove: (id: string) => void;
  toggleStatus: (id: string) => void;
};

const now = () => Date.now();

export const useImageAssetsStore = create<ImageAssetsStore>()(
  persist(
    (set, get) => ({
      assets: [],
      isHydrated: false,
      setHydrated: (value) => set({ isHydrated: value }),
      upsert: (asset) => {
        const existing = get().assets;
        const idx = existing.findIndex((a) => a.id === asset.id);
        const next: ImageAsset = {
          ...asset,
          createdAt: idx >= 0 ? existing[idx].createdAt : now(),
          updatedAt: now(),
        };
        set({
          assets: idx >= 0 ? [...existing.slice(0, idx), next, ...existing.slice(idx + 1)] : [...existing, next],
        });
      },
      remove: (id) => set({ assets: get().assets.filter((a) => a.id !== id) }),
      toggleStatus: (id) =>
        set({
          assets: get().assets.map((a) =>
            a.id === id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active', updatedAt: now() } : a,
          ),
        }),
    }),
    {
      name: 'content_images_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ assets: s.assets }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

export const makeEmptyImageAsset = (): ImageAssetInput => ({
  id: `${Date.now()}`,
  title: '',
  imageUrl: '',
  link: '',
  placement: 'slider',
  status: 'active',
});

