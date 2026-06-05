import { QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LoadingScreen } from '../src/components/LoadingScreen';
import { UpdateGate } from '../src/components/UpdateGate';
import { queryClient } from '../src/lib/queryClient';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { subscribeToPasswordRecoveryLinks } from '../src/services/auth/passwordRecoveryService';

const PUBLIC_AUTH_ROUTES = new Set([
  'login',
  'forgot-password',
  'reset-password',
  'first-access',
]);

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // expo-router tipa useSegments() como tuplas en algunos contextos.
  // En nuestro caso necesitamos acceder a índices variables sin errores TS.
  const segments = useSegments() as string[];

  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const root = segments[0];
    const authRoute = segments[1];

    if (root === '(auth)' && authRoute === 'reset-password') {
      return;
    }
    const inAuthGroup = root === '(auth)';
    const inAppGroup = root === '(app)';
    const inAdminGroup = root === '(admin)';

    if (!user && (inAppGroup || inAdminGroup)) {
      const isResetRoute = inAuthGroup && authRoute === 'reset-password';
      if (!isResetRoute) {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (user?.mustChangePassword) {
      if (authRoute !== 'force-change-password') {
        router.replace('/(auth)/force-change-password');
      }
      return;
    }

    if (user && (inAuthGroup || !root)) {
      const isPublicAuthRoute = authRoute ? PUBLIC_AUTH_ROUTES.has(authRoute) : false;
      if (!isPublicAuthRoute) {
        if (user.role === 'admin') {
          router.replace('/(admin)');
        } else {
          router.replace('/(app)');
        }
        return;
      }
      if (isPublicAuthRoute) {
        if (user.role === 'admin') {
          router.replace('/(admin)');
        } else {
          router.replace('/(app)');
        }
      }
      return;
    }

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

function RecoveryLinkListener() {
  const router = useRouter();

  useEffect(() => {
    return subscribeToPasswordRecoveryLinks(() => {
      router.replace('/(auth)/reset-password');
    });
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RecoveryLinkListener />
            <AuthGate>
              <UpdateGate>
                <Slot />
              </UpdateGate>
            </AuthGate>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

