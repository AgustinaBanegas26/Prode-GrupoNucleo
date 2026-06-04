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

    const root = segments[0] as string | undefined;
    const screen = segments[1] as string | undefined;
    const inAuth = root === '(auth)';
    const inApp = root === '(app)';
    const inAdmin = root === '(admin)';

    // No autenticado → siempre al login
    if (!user) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    // Autenticado pero debe cambiar contraseña → bloquear en force-change-password
    if (user.mustChangePassword) {
      if (screen !== 'force-change-password') {
        router.replace('/(auth)/force-change-password');
      }
      // No redirigir nada más — la pantalla maneja su propia navegación post-cambio
      return;
    }

    // Autenticado sin pendientes → sacar del grupo auth y redirigir a la app
    // Pero NO si estamos en force-change-password (puede estar procesando)
    if (inAuth && screen !== 'force-change-password') {
      router.replace(user.role === 'admin' ? '/(admin)' : '/(app)');
      return;
    }

    // Admin intentando entrar a (app) → mandarlo a (admin)
    if (user.role === 'admin' && inApp) {
      router.replace('/(admin)');
      return;
    }

    // Cliente intentando entrar a (admin) → mandarlo a (app)
    if (user.role === 'client' && inAdmin) {
      router.replace('/(app)');
      return;
    }
  }, [loading, user, segments.join('/')]);

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

