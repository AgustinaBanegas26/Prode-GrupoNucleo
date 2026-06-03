import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useAuth } from '../../src/providers/AuthProvider';

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const hasAdminSession = user && user.role === 'admin';

  if (!hasAdminSession) {
    return <Redirect href="/(auth)/login" />;
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
