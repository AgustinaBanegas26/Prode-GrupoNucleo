import { StatusBar } from 'expo-status-bar';
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useThemeStore } from '../store/themeStore';
import { type AppColorScheme, createTheme, type AppTheme } from '../theme/theme';

type ThemeContextValue = {
  theme: AppTheme;
  resolvedScheme: AppColorScheme;
  themeMode: 'system' | 'light' | 'dark';
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const themeMode = useThemeStore((s) => s.themeMode);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);

  const resolvedScheme: AppColorScheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [systemScheme, themeMode]);

  const theme = useMemo(() => createTheme(resolvedScheme), [resolvedScheme]);

  const value = useMemo(
    () => ({ theme, resolvedScheme, themeMode, setThemeMode }),
    [resolvedScheme, setThemeMode, theme, themeMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return ctx;
}
