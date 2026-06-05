import React from 'react';
import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useAuth } from '../../src/providers/AuthProvider';

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role !== 'admin') {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="matches" />
      <Stack.Screen name="news" />
      <Stack.Screen name="statistics" />
      <Stack.Screen name="rankings" />
      <Stack.Screen name="participation" />
      <Stack.Screen name="voted-matches" />
      <Stack.Screen name="user-activity" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="slider" />
      <Stack.Screen name="rewards" />
      <Stack.Screen name="images" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="app-versions" />
    </Stack>
  );
}
