import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';

import { Button } from '../../src/components/Button';
import { FormTextField } from '../../src/components/FormTextField';
import { Screen } from '../../src/components/Screen';
import {
  type ForceChangePasswordFormValues,
  forceChangePasswordSchema,
} from '../../src/features/auth/schemas';
import { useAuth } from '../../src/providers/AuthProvider';
import { useAppTheme } from '../../src/providers/ThemeProvider';

export default function ForceChangePasswordScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user, changePassword } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const logoSource = useMemo(
    () =>
      theme.isDark
        ? require('../../images/icononucleo-light.png')
        : require('../../images/icononucleo.png'),
    [theme.isDark],
  );

  const { control, handleSubmit, formState } = useForm<ForceChangePasswordFormValues>({
    resolver: zodResolver(forceChangePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!user) return;
    setSubmitError(null);

    try {
      await changePassword(user, values.password);

      if (user.role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(app)');
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'No se pudo actualizar la contraseña.');
    }
  });

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Image source={logoSource} style={{ width: 120, height: 120 }} resizeMode="contain" />
          <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800' }}>
            Cambiá tu contraseña
          </Text>
          <Text style={{ color: '#5C5C5C', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            {user
              ? `Hola ${user.nombre || user.usuario}. Por seguridad, definí una contraseña nueva antes de continuar.`
              : 'Definí una contraseña nueva antes de continuar.'}
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <FormTextField
            control={control}
            name="password"
            label="Contraseña nueva"
            placeholder="Mín. 8 caracteres, 1 mayúscula y 1 número"
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

          <Button
            title="Actualizar contraseña"
            onPress={onSubmit}
            loading={formState.isSubmitting}
          />
        </View>
      </View>
    </Screen>
  );
}
