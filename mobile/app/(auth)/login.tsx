import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '../../src/components/Button';
import { FormTextField } from '../../src/components/FormTextField';
import { useAuth } from '../../src/providers/AuthProvider';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

const loginSchema = z.object({
  customerNumber: z.string().trim().min(1, 'Ingresá tu número de cliente o usuario'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { theme, setThemeMode, themeMode } = useAppTheme();
  const { login } = useAuth();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const logoSource = useMemo(
    () =>
      theme.isDark
        ? require('../../images/icononucleo.png')
        : require('../../images/icononucleo-light.png'),
    [theme.isDark],
  );

  const { control, handleSubmit, formState, setError, clearErrors } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { customerNumber: '', password: '' },
  });

  const toggleTheme = () => {
    setThemeMode(theme.isDark ? 'light' : 'dark');
  };

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

      if (errMsg.includes('encontrado') || errMsg.includes('inexistente') || errMsg.includes('Usuario')) {
        setError('customerNumber', { type: 'manual', message: errMsg });
      } else if (errMsg.includes('Contraseña') || errMsg.includes('incorrecta')) {
        setError('password', { type: 'manual', message: errMsg });
      } else {
        setError('customerNumber', { type: 'manual', message: errMsg });
      }
    }
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Botón toggle tema arriba a la derecha */}
      <View style={{ alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8 }}>
        <Pressable
          onPress={toggleTheme}
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={theme.isDark ? 'sunny-outline' : 'moon-outline'}
            size={20}
            color={theme.colors.text}
          />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + título */}
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: theme.isDark ? 0.4 : 0.1,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Image source={logoSource} style={{ width: 64, height: 64 }} resizeMode="contain" />
            </View>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.5,
                marginBottom: 6,
              }}
            >
              Bienvenido
            </Text>
            <Text style={{ color: theme.colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              Iniciá sesión con tu número de cliente
            </Text>
          </View>

          {/* Card del formulario */}
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: theme.colors.border,
              gap: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: theme.isDark ? 0.3 : 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
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
              <View
                style={{
                  backgroundColor: theme.isDark ? 'rgba(244,67,54,0.12)' : 'rgba(244,67,54,0.08)',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(244,67,54,0.25)',
                  padding: 12,
                }}
              >
                <Text style={{ color: theme.colors.error, fontSize: 13, fontWeight: '600' }}>
                  {submitError}
                </Text>
              </View>
            ) : null}

            <Button
              title="Entrar"
              onPress={onSubmit}
              loading={formState.isSubmitting}
              style={{ marginTop: 4 }}
            />
          </View>

          {/* Links secundarios */}
          <View style={{ alignItems: 'center', marginTop: 24, gap: 12 }}>
            <Pressable onPress={() => router.push('/(auth)/forgot-password')} hitSlop={8}>
              <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '600' }}>
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
            <Text
              style={{
                color: theme.colors.muted,
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 18,
                paddingHorizontal: 16,
              }}
            >
              Primer ingreso: usá la contraseña inicial provista por el sistema.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
