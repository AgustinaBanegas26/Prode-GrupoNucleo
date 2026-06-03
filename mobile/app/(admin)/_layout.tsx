import React from 'react';
import { Redirect, Stack, useSegments } from 'expo-router';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useAdminStore } from '../../src/features/admin/store/adminStore';

export default function AdminLayout() {
  const session = useAdminStore((s) => s.session);
  const isHydrated = useAdminStore((s) => s.isHydrated);
  const segments = useSegments();
  const currentRoute = segments.at(-1);
  const isLoginRoute = currentRoute === 'login';

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  if (!session && !isLoginRoute) {
    return <Redirect href="/(admin)/login" />;
  }

  if (session && isLoginRoute) {
    return <Redirect href="/(admin)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="statistics" />
      <Stack.Screen name="rewards" />
      <Stack.Screen name="rankings" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="participation" />
      <Stack.Screen name="voted-matches" />
      <Stack.Screen name="user-activity" />
      <Stack.Screen name="images" />
      <Stack.Screen name="slider" />
      <Stack.Screen name="news" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
