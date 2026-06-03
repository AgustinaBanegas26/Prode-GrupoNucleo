import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeState = {
  themeMode: ThemeMode;
  isHydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setHydrated: (value: boolean) => void;
};

const THEME_STORAGE_KEY = 'app_theme_mode_v1';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      isHydrated: false,
      setThemeMode: (mode: ThemeMode) => set({ themeMode: mode }),
      setHydrated: (value: boolean) => set({ isHydrated: value }),
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    },
  ),
);
