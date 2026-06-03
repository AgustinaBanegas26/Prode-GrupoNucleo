import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useAuthStore } from '../../src/store/authStore';

export default function AdminLayout() {
  const session = useAuthStore((s) => s.session);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session.user.rol !== 'admin') {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
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
