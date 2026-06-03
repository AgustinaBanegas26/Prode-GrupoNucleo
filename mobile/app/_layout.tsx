import { QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LoadingScreen } from '../src/components/LoadingScreen';
import { queryClient } from '../src/lib/queryClient';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();

  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const root = segments[0];
    const inAuthGroup = root === '(auth)';
    const inAppGroup = root === '(app)';

    if (!user && inAppGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && (inAuthGroup || !root)) {
      router.replace('/(app)');
      return;
    }

    if (!user && !root) {
      router.replace('/(auth)/login');
    }
  }, [loading, router, user, segments.join('/')]);

  if (loading) {
    return <LoadingScreen />;
  }

  return children;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AuthGate>
              <Slot />
            </AuthGate>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

