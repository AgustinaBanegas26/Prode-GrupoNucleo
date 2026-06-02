import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';

import { Button } from '../../src/components/Button';
import { FormTextField } from '../../src/components/FormTextField';
import { Screen } from '../../src/components/Screen';
import { type ResetPasswordFormValues, resetPasswordSchema } from '../../src/features/auth/schemas';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuthStore } from '../../src/store/authStore';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { theme } = useAppTheme();
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { control, handleSubmit, formState, setValue } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
      code: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (email) setValue('email', String(email));
  }, [email, setValue]);

  const onSubmit = handleSubmit(async ({ password, confirmPassword, ...values }) => {
    setSubmitError(null);
    setSuccess(false);

    try {
      await resetPassword({
        email: values.email,
        code: values.code,
        newPassword: password,
      });
      setSuccess(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'No se pudo resetear la contraseña.');
    }
  });

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 18 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800' }}>
            Resetear contraseña
          </Text>
          <Text style={{ color: theme.colors.muted, fontSize: 14 }}>
            Ingresá el email, el código recibido y tu nueva contraseña.
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
          <FormTextField control={control} name="code" label="Código" placeholder="Ej: 123456" />
          <FormTextField
            control={control}
            name="password"
            label="Nueva contraseña"
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

          {success ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700' }}>
                Contraseña actualizada.
              </Text>
              <Button title="Ir a login" onPress={() => router.replace('/(auth)/login')} />
            </View>
          ) : (
            <Button title="Actualizar contraseña" onPress={onSubmit} loading={formState.isSubmitting} />
          )}

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

