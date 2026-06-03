import React from 'react';
import { Stack } from 'expo-router';
import { useAdminStore } from '../../features/admin/store/adminStore';
import { AdminLoginScreen } from '../../features/admin/screens/AdminLoginScreen';

export default function AdminLayout() {
  const { isLoggedIn } = useAdminStore();

  if (!isLoggedIn) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" component={AdminLoginScreen} />
      </Stack>
    );
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
    </Stack>
  );
}
