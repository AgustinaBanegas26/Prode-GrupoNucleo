import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '../../src/components/Button';
import { FormTextField } from '../../src/components/FormTextField';
import { Screen } from '../../src/components/Screen';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuth, type SessionUser } from '../../src/providers/AuthProvider';

// Alphanumeric validation to allow admin usernames (e.g. AdminGN) and client numbers (e.g. 5456)
const loginSchema = z.object({
  customerNumber: z.string().trim().min(1, 'Ingresá tu número de cliente o usuario'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Password validation (8 characters min, must match)
const changePasswordSchema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { login, changePassword } = useAuth();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tempUser, setTempUser] = useState<SessionUser | null>(null);

  const logoSource = useMemo(
    () =>
      theme.isDark
        ? require('../../images/icononucleo-light.png')
        : require('../../images/icononucleo.png'),
    [theme.isDark],
  );

  // Form for login credentials
  const { control, handleSubmit, formState, setError, clearErrors } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { customerNumber: '', password: '' },
  });

  // Form for new password on first login
  const {
    control: cpControl,
    handleSubmit: cpHandleSubmit,
    formState: cpFormState,
    setError: cpSetError,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // On submit normal login
  const onSubmit = handleSubmit(async (values) => {
    console.log("LOGIN PRESSED");
    console.log("usuario", values.customerNumber);
    console.log("password", values.password);

    console.log("LOGIN SUBMIT");
    setSubmitError(null);
    clearErrors();

    try {
      const result = await login(values.customerNumber, values.password);
      console.log("Resultado login en submit:", result);

      if (result.mustChangePassword && result.tempUser) {
        console.log("Detección primer_login = true. Mostrando formulario de cambio de contraseña.");
        setTempUser(result.tempUser);
      } else {
        if (result.role === 'admin') {
          console.log("REDIRECT ADMIN");
          console.log("ruta de destino: /(admin)");
          router.replace('/(admin)');
        } else {
          console.log("REDIRECT CLIENT");
          console.log("ruta de destino: /(app)");
          router.replace('/(app)');
        }
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'No se pudo iniciar sesión.';
      console.log("Error en submit login:", errMsg);
      setSubmitError(errMsg);

      // Set input error message and trigger red borders
      if (errMsg.includes('encontrado') || errMsg.includes('inexistente') || errMsg.includes('Usuario')) {
        setError('customerNumber', { type: 'manual', message: errMsg });
      } else if (errMsg.includes('Contraseña') || errMsg.includes('incorrecta')) {
        setError('password', { type: 'manual', message: errMsg });
      } else {
        setError('customerNumber', { type: 'manual', message: errMsg });
        setError('password', { type: 'manual', message: '' });
      }
    }
  });

  // On submit password change (first login)
  const onCPSubmit = cpHandleSubmit(async (values) => {
    if (!tempUser) return;
    setSubmitError(null);
    console.log("Cambio contraseña submit para rol:", tempUser.role);

    try {
      await changePassword(tempUser, values.password);
      console.log("Cambio contraseña exitoso y sesión guardada");

      if (tempUser.role === 'admin') {
        console.log("REDIRECT ADMIN");
        console.log("ruta de destino: /(admin)");
        router.replace('/(admin)');
      } else {
        console.log("REDIRECT CLIENT");
        console.log("ruta de destino: /(app)");
        router.replace('/(app)');
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'No se pudo cambiar la contraseña.';
      console.log("Error en cambio de contraseña:", errMsg);
      setSubmitError(errMsg);
      cpSetError('password', { type: 'manual', message: errMsg });
    }
  });

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Image source={logoSource} style={{ width: 120, height: 120 }} resizeMode="contain" />
          <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800' }}>
            {tempUser ? 'Crear Contraseña' : 'Iniciar sesión'}
          </Text>
          <Text style={{ color: theme.colors.muted, fontSize: 14, textAlign: 'center' }}>
            {tempUser
              ? `Hola ${tempUser.nombre || tempUser.usuario}. Por ser tu primer ingreso, creá tu contraseña definitiva.`
              : 'Ingresá tu número de cliente o usuario.'}
          </Text>
        </View>

        {tempUser ? (
          // First login: Change password form
          <View style={{ gap: 14 }}>
            <FormTextField
              control={cpControl}
              name="password"
              label="Nueva contraseña"
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
            />
            <FormTextField
              control={cpControl}
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
              title="Guardar y entrar"
              onPress={onCPSubmit}
              loading={cpFormState.isSubmitting}
            />

            <Pressable onPress={() => setTempUser(null)}>
              <Text style={{ color: theme.colors.muted, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        ) : (
          // Standard login form
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

            <Text style={{ color: theme.colors.muted, fontSize: 13, textAlign: 'center', marginTop: 14, lineHeight: 18 }}>
              Si es tu primer ingreso, utilizá tu número de cliente como usuario y también como contraseña.
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
