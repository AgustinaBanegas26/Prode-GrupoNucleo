import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';

import { Button } from '../../src/components/Button';
import { FormTextField } from '../../src/components/FormTextField';
import { Screen } from '../../src/components/Screen';
import { type FirstAccessFormValues, firstAccessSchema } from '../../src/features/auth/schemas';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuthStore } from '../../src/store/authStore';

export default function FirstAccessScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const createPassword = useAuthStore((s) => s.createPassword);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<FirstAccessFormValues>({
    resolver: zodResolver(firstAccessSchema),
    defaultValues: {
      customerNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async ({ confirmPassword, ...values }) => {
    setSubmitError(null);
    try {
      await createPassword(values);
      router.replace('/(app)');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'No se pudo crear la contraseña.');
    }
  });

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 18 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800' }}>
            Primer acceso
          </Text>
          <Text style={{ color: theme.colors.muted, fontSize: 14 }}>
            Registrá tu email y creá una contraseña para tu número de cliente.
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <FormTextField
            control={control}
            name="customerNumber"
            label="Número de cliente"
            placeholder="Ej: 123456"
            keyboardType="number-pad"
          />
          <FormTextField
            control={control}
            name="email"
            label="Email"
            placeholder="tu@email.com"
            keyboardType="email-address"
          />
          <FormTextField
            control={control}
            name="password"
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
          />
          <FormTextField
            control={control}
            name="confirmPassword"
            label="Confirmar contraseña"
            placeholder="Repetí la contraseña"
            secureTextEntry
          />

          {submitError ? (
            <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>
              {submitError}
            </Text>
          ) : null}

          <Button title="Crear y entrar" onPress={onSubmit} loading={formState.isSubmitting} />

          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '700' }}>
              Volver a login
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

