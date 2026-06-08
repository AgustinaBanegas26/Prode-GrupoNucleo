import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { theme, setThemeMode } = useAppTheme();
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

  const CELESTE = '#6EC6FF';
  const CELESTE_DARK = '#3DA5F5';
  const DEEP_BLUE = '#0F4C81';
  const DORADO = '#F59E0B';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.isDark ? '#0D0D0D' : '#F5F7FA' }}>
      <LinearGradient
        colors={[CELESTE_DARK, DEEP_BLUE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Círculos decorativos */}
      <View style={styles.circleL} />
      <View style={styles.circleS} />

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
            <Image
              source={logoSource}
              style={{ width: 140, height: 140, marginBottom: 20 }}
              resizeMode="contain"
            />
            <Text style={styles.title}>
              Bienvenido al Prode
            </Text>
            <Text style={styles.subtitle}>
              Mundial FIFA 2026 🏆
            </Text>
          </View>

          {/* Card del formulario */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.isDark ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.95)',
                borderColor: theme.isDark ? 'rgba(110,198,255,0.2)' : 'rgba(110,198,255,0.4)',
              }
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Iniciar Sesión</Text>
            
            <FormTextField
              control={control}
              name="customerNumber"
              label="Usuario o Cliente ID"
              placeholder="Ej: AdminGN o 5456"
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
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {submitError}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={onSubmit}
              disabled={formState.isSubmitting}
              style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <LinearGradient
                colors={[CELESTE_DARK, DEEP_BLUE]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGrad}
              >
                <Text style={styles.btnText}>
                  {formState.isSubmitting ? 'Cargando...' : 'Entrar'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Links secundarios */}
          <View style={{ alignItems: 'center', marginTop: 24, gap: 12 }}>
            <Pressable onPress={() => router.push('/(auth)/forgot-password')} hitSlop={8}>
              <Text style={styles.forgotText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
            <Text style={styles.helpText}>
              Primer ingreso: usá la contraseña inicial provista por el sistema.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  circleL: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', top: -100, right: -100,
  },
  circleS: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', bottom: -50, left: -50,
  },
  title: {
    color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  subtitle: {
    color: '#F59E0B', fontSize: 16, fontWeight: '700', letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  card: {
    borderRadius: 24, padding: 24, borderWidth: 1, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', padding: 12,
  },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  btn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  btnGrad: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  forgotText: { color: '#fff', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  helpText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
});
