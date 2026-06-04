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
    const inAdminGroup = root === '(admin)';

    // Not logged in — redirect to login if trying to access protected routes
    if (!user && (inAppGroup || inAdminGroup)) {
      router.replace('/(auth)/login');
      return;
    }

    // Logged in — redirect away from auth screens
    if (user && (inAuthGroup || !root)) {
      if (user.role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(app)');
      }
      return;
    }

    // Admin trying to access user app — redirect to admin panel
    if (user && user.role === 'admin' && inAppGroup) {
      router.replace('/(admin)');
      return;
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

