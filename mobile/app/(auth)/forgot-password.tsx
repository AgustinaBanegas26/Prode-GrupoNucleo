import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';

import { Button } from '../../src/components/Button';
import { FormTextField } from '../../src/components/FormTextField';
import { Screen } from '../../src/components/Screen';
import { type ForgotPasswordFormValues, forgotPasswordSchema } from '../../src/features/auth/schemas';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuthStore } from '../../src/store/authStore';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setResetCode(null);
    setResetEmail(null);

    try {
      const code = await requestPasswordReset(values.email);
      setResetCode(code);
      setResetEmail(values.email.trim().toLowerCase());
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'No se pudo iniciar la recuperación.');
    }
  });

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 18 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800' }}>
            Recuperar contraseña
          </Text>
          <Text style={{ color: theme.colors.muted, fontSize: 14 }}>
            Ingresá tu email y generá un código de recuperación (mock local).
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <FormTextField
            control={control}
            name="email"
            label="Email"
            placeholder="tu@email.com"
            keyboardType="email-address"
          />

          {submitError ? (
            <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>
              {submitError}
            </Text>
          ) : null}

          <Button title="Generar código" onPress={onSubmit} loading={formState.isSubmitting} />

          {resetCode && resetEmail ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700' }}>
                Código generado: {resetCode}
              </Text>
              <Button
                title="Continuar"
                variant="secondary"
                onPress={() =>
                  router.push({ pathname: '/(auth)/reset-password', params: { email: resetEmail } })
                }
              />
            </View>
          ) : null}

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

