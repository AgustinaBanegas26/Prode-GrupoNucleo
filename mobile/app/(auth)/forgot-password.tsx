import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';

import { Button } from '../../src/components/Button';
import { FormTextField } from '../../src/components/FormTextField';
import { Screen } from '../../src/components/Screen';
import { type ForgotPasswordFormValues, forgotPasswordSchema } from '../../src/features/auth/schemas';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import {
  PasswordRecoveryError,
  sendPasswordResetEmail,
} from '../../src/services/auth/passwordRecoveryService';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const logoSource = useMemo(
    () =>
      theme.isDark
        ? require('../../images/icononucleo.png')
        : require('../../images/icononucleo-light.png'),
    [theme.isDark],
  );

  const { control, handleSubmit, formState } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSuccess(false);

    try {
      await sendPasswordResetEmail(values.email);
      setSuccess(true);
    } catch (e) {
      if (e instanceof PasswordRecoveryError) {
        setSubmitError(e.message);
        return;
      }
      setSubmitError(e instanceof Error ? e.message : 'No se pudo enviar el enlace de recuperación.');
    }
  });

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Image source={logoSource} style={{ width: 120, height: 120 }} resizeMode="contain" />
          <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800' }}>
            Recuperar contraseña
          </Text>
          <Text style={{ color: '#5C5C5C', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            Ingresá el email asociado a tu cuenta. Te enviaremos un enlace seguro para crear una
            nueva contraseña.
          </Text>
        </View>

        {success ? (
          <View
            style={{
              gap: 12,
              padding: 16,
              borderRadius: 12,
              backgroundColor: theme.isDark ? '#1A1A1A' : '#FFFFFF',
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '700' }}>
              Revisá tu correo
            </Text>
            <Text style={{ color: '#5C5C5C', fontSize: 14, lineHeight: 20 }}>
              Si el email está registrado, recibirás un enlace para restablecer tu contraseña. El
              enlace expira automáticamente y solo puede usarse una vez.
            </Text>
            <Button title="Volver a login" onPress={() => router.replace('/(auth)/login')} />
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <FormTextField
              control={control}
              name="email"
              label="Email"
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {submitError ? (
              <Text style={{ color: '#CC2627', fontSize: 13, fontWeight: '600' }}>
                {submitError}
              </Text>
            ) : null}

            <Button title="Enviar enlace" onPress={onSubmit} loading={formState.isSubmitting} />
          </View>
        )}

        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={{ color: '#CC2627', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
            Volver a login
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
