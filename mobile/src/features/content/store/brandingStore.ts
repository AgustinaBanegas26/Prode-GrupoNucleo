import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type BrandingConfig = {
  logoUrl: string;
  primaryColor: string;
  appTitle: string;
  homeHeadline: string;
  homeSubheadline: string;
};

type BrandingStore = {
  config: BrandingConfig;
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
  setConfig: (patch: Partial<BrandingConfig>) => void;
  reset: () => void;
};

const defaultConfig: BrandingConfig = {
  logoUrl: '',
  primaryColor: '#CC2627',
  appTitle: 'Prode Grupo Núcleo',
  homeHeadline: '¡Viví el Mundial!',
  homeSubheadline: 'Adiviná resultados y sumá puntos.',
};

export const useBrandingStore = create<BrandingStore>()(
  persist(
    (set) => ({
      config: defaultConfig,
      isHydrated: false,
      setHydrated: (value) => set({ isHydrated: value }),
      setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
      reset: () => set({ config: defaultConfig }),
    }),
    {
      name: 'content_branding_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ config: s.config }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

