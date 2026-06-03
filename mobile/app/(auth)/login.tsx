import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';

import { Button } from '../../src/components/Button';
import { FormTextField } from '../../src/components/FormTextField';
import { Screen } from '../../src/components/Screen';
import { type LoginFormValues, loginSchema } from '../../src/features/auth/schemas';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const signIn = useAuthStore((s) => s.signIn);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const logoSource = useMemo(
    () =>
      theme.isDark
        ? require('../../images/icononucleo-light.png')
        : require('../../images/icononucleo.png'),
    [theme.isDark],
  );

  const { control, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { numeroEmpleado: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await signIn(values);
      const role = useAuthStore.getState().session?.user.rol;
      router.replace(role === 'admin' ? '/(admin)' : '/(app)');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
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
            Ingresá tu número de empleado y contraseña.
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <FormTextField
            control={control}
            name="numeroEmpleado"
            label="Número de empleado"
            placeholder="Ej: 0001"
            keyboardType="number-pad"
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
        </View>
      </View>
    </Screen>
  );
}

