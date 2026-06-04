import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '../../src/components/Button';
import { FormTextField } from '../../src/components/FormTextField';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/providers/AuthProvider';
import { useAppTheme } from '../../src/providers/ThemeProvider';

const loginSchema = z.object({
  customerNumber: z.string().trim().min(1, 'Ingresá tu número de cliente o usuario'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { login } = useAuth();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const logoSource = useMemo(
    () =>
      theme.isDark
        ? require('../../images/icononucleo-light.png')
        : require('../../images/icononucleo.png'),
    [theme.isDark],
  );

  const { control, handleSubmit, formState, setError, clearErrors } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { customerNumber: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    clearErrors();

    try {
      const result = await login(values.customerNumber, values.password);

      if (result.mustChangePassword) {
        router.replace('/(auth)/force-change-password');
        return;
      }

      if (result.role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(app)');
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'No se pudo iniciar sesión.';
      setSubmitError(errMsg);

      if (
        errMsg.includes('encontrado') ||
        errMsg.includes('inexistente') ||
        errMsg.includes('Usuario')
      ) {
        setError('customerNumber', { type: 'manual', message: errMsg });
      } else if (errMsg.includes('Contraseña') || errMsg.includes('incorrecta')) {
        setError('password', { type: 'manual', message: errMsg });
      } else {
        setError('customerNumber', { type: 'manual', message: errMsg });
        setError('password', { type: 'manual', message: '' });
      }
    }
  });

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Image source={logoSource} style={{ width: 120, height: 120 }} resizeMode="contain" />
          <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800' }}>
            Iniciar sesión
          </Text>
          <Text style={{ color: theme.colors.muted, fontSize: 14, textAlign: 'center' }}>
            Ingresá tu número de cliente o usuario.
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <FormTextField
            control={control}
            name="customerNumber"
            label="Número de cliente o Usuario"
            placeholder="Ej: 5456 o AdminGN"
            keyboardType="default"
            autoCapitalize="none"
          />
          <FormTextField
            control={control}
            name="password"
            label="Contraseña"
            placeholder="Tu contraseña"
            secureTextEntry
          />

          {submitError ? (
            <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>
              {submitError}
            </Text>
          ) : null}

          <Button title="Entrar" onPress={onSubmit} loading={formState.isSubmitting} />

          <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
            <Text
              style={{
                color: theme.colors.primary,
                fontSize: 14,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>

          <Text
            style={{
              color: theme.colors.muted,
              fontSize: 13,
              textAlign: 'center',
              marginTop: 4,
              lineHeight: 18,
            }}
          >
            Si es tu primer ingreso, utilizá tu número de cliente como usuario y también como
            contraseña.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
