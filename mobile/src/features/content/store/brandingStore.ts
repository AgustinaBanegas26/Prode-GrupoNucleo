import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type BrandingConfig = {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  appTitle: string;
  homeHeadline: string;
  homeSubheadline: string;
  bannersTitle: string;
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
  secondaryColor: '#5C5C5C',
  appTitle: 'Prode Grupo Núcleo',
  homeHeadline: '¡Viví el Mundial!',
  homeSubheadline: 'Adiviná resultados y sumá puntos.',
  bannersTitle: 'Novedades',
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
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        const cfg = (state?.config ?? {}) as Partial<BrandingConfig>;
        const patch: Partial<BrandingConfig> = {};
        if (typeof cfg.secondaryColor !== 'string') patch.secondaryColor = defaultConfig.secondaryColor;
        if (typeof cfg.bannersTitle !== 'string') patch.bannersTitle = defaultConfig.bannersTitle;
        if (Object.keys(patch).length > 0) state?.setConfig(patch);
      },
    },
  ),
);
