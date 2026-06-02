import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuthStore } from '../../src/store/authStore';

export default function AppHomeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);

  if (!session) {
    return null;
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Inicio' }} />
      <View style={{ flex: 1, padding: 24, gap: 16 }}>
        <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800' }}>
          Bienvenido
        </Text>
        <View style={{ gap: 6 }}>
          <Text style={{ color: theme.colors.text, fontSize: 14 }}>
            Cliente: {session.user.customerNumber}
          </Text>
          <Text style={{ color: theme.colors.text, fontSize: 14 }}>Email: {session.user.email}</Text>
        </View>

        <Button
          title="Cerrar sesión"
          variant="secondary"
          onPress={() => {
            signOut();
            router.replace('/(auth)/login');
          }}
        />
      </View>
    </Screen>
  );
}

