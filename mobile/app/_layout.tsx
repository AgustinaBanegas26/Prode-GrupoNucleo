import { QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LoadingScreen } from '../src/components/LoadingScreen';
import { queryClient } from '../src/lib/queryClient';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { useAuthStore } from '../src/store/authStore';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();

  const session = useAuthStore((s) => s.session);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    const root = segments[0];
    const inAuthGroup = root === '(auth)';
    const inAppGroup = root === '(app)';

    if (!session && inAppGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (session && (inAuthGroup || !root)) {
      router.replace('/(app)');
      return;
    }

    if (!session && !root) {
      router.replace('/(auth)/login');
    }
  }, [isHydrated, router, session, segments.join('/')]);

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  return children;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthGate>
            <Slot />
          </AuthGate>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
