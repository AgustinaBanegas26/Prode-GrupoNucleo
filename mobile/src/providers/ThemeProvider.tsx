import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { useColorScheme, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { useThemeStore } from '../store/themeStore';
import { createTheme, type AppColorScheme, type AppTheme } from '../theme/theme';

/**
 * Context value type definition
 */
type ThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
  colorScheme: AppColorScheme;
  themeMode: 'system' | 'light' | 'dark';
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  fontsLoaded: boolean;
};

/**
 * Create theme context
 */
const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Theme Provider Component
 * Manages theme state, fonts loading, and provides theme context
 *
 * Rules of Hooks compliance:
 * - All hooks are called at the top level
 * - No hooks are called conditionally
 * - Hooks are called in the same order on every render
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Step 1: Load fonts (must be called before any conditional returns)
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Step 2: Get system color scheme preference
  const systemColorScheme = useColorScheme();

  // Step 3: Get theme preference from store
  const themeMode = useThemeStore((s) => s.themeMode);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const isHydrated = useThemeStore((s) => s.isHydrated);

  // Step 4: Resolve the actual color scheme based on theme mode
  const colorScheme: AppColorScheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  // Step 5: Create theme object
  const theme = useMemo(() => createTheme(colorScheme), [colorScheme]);

  // Step 6: Setup fonts globally
  useEffect(() => {
    if (!fontsLoaded || fontError) {
      return;
    }

    // Note: Text.defaultProps setup is handled through expo-app-loading and global styles
    // The Poppins font is loaded and will be used automatically
  }, [fontsLoaded, fontError]);

  // Step 7: Create context value with useCallback for setThemeMode
  const handleSetThemeMode = useCallback(
    (mode: 'system' | 'light' | 'dark') => {
      setThemeMode(mode);
    },
    [setThemeMode],
  );

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: colorScheme === 'dark',
      colorScheme,
      themeMode,
      setThemeMode: handleSetThemeMode,
      fontsLoaded,
    }),
    [theme, colorScheme, themeMode, handleSetThemeMode, fontsLoaded],
  );

  // Show loading screen while fonts are loading
  if (!fontsLoaded || !isHydrated) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar 
        style={theme.isDark ? 'light' : 'dark'} 
      />
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 * Must be called within ThemeProvider
 */
export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within <ThemeProvider>');
  }

  return context;
}

/**
 * Export context for advanced use cases
 */
export { ThemeContext };