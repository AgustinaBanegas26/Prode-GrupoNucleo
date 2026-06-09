import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AuthScreenShell } from '../../src/components/auth/AuthScreenShell';
import { FormTextField } from '../../src/components/FormTextField';
import { PasswordStrengthBar } from '../../src/components/PasswordStrengthBar';
import {
  type ForceChangePasswordFormValues,
  forceChangePasswordSchema,
} from '../../src/features/auth/schemas';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { verifyLegacyPassword } from '../../src/services/auth/legacyPasswordService';
import { useAppTheme } from '../../src/providers/ThemeProvider';

const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE = '#0F4C81';

async function validateCurrentPassword(
  userId: string,
  role: 'client' | 'admin',
  currentPassword: string,
): Promise<boolean> {
  const table = role === 'admin' ? 'admins' : 'clientes';
  const { data } = await supabase
    .from(table)
    .select('primer_login')
    .eq('id', userId)
    .maybeSingle();

  if (data?.primer_login) {
    return role === 'admin'
      ? currentPassword === 'admingn123!'
      : currentPassword === 'clientesgn123';
  }

  return verifyLegacyPassword(role, userId, currentPassword);
}

export default function ForceChangePasswordScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user, changePassword } = useAuth();

  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const { control, handleSubmit, formState, watch } = useForm<ForceChangePasswordFormValues>({
    resolver: zodResolver(forceChangePasswordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  });

  const newPassword = watch('password');

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
      setSubmitError('Sesión no encontrada. Volvé a iniciar sesión.');
      return;
    }

    setSubmitError(null);

    const currentOk = await validateCurrentPassword(user.id, user.role, values.currentPassword);
    if (!currentOk) {
      setSubmitError('La contraseña actual no es correcta.');
      return;
    }

    try {
      await changePassword(user, values.password);
      router.replace(user.role === 'admin' ? '/(admin)' : '/(app)');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Error al actualizar la contraseña.');
    }
  });

  return (
    <AuthScreenShell
      title="Cambiar Contraseña"
      subtitle={
        user
          ? `Hola ${user.nombre}. Definí tu contraseña definitiva para continuar.`
          : 'Definí tu contraseña definitiva para continuar.'
      }
    >
      <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Nueva contraseña</Text>

      <FormTextField
        control={control}
        name="currentPassword"
        label="Contraseña actual"
        placeholder="Tu contraseña actual o temporal"
        secureTextEntry
      />

      <FormTextField
        control={control}
        name="password"
        label="Nueva contraseña"
        placeholder="Mín. 8, mayús, minús, número, símbolo"
        secureTextEntry
      />

      <PasswordStrengthBar password={newPassword} />

      <FormTextField
        control={control}
        name="confirmPassword"
        label="Confirmar contraseña"
        placeholder="Repetí la nueva contraseña"
        secureTextEntry
      />

      {submitError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{submitError}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onSubmit}
        disabled={formState.isSubmitting}
        style={({ pressed }) => [styles.btnWrap, { opacity: pressed || formState.isSubmitting ? 0.8 : 1 }]}
      >
        <LinearGradient
          colors={[CELESTE_DARK, DEEP_BLUE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btnGrad}
        >
          {formState.isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Actualizar contraseña</Text>
          )}
        </LinearGradient>
      </Pressable>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: 12,
  },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  btnWrap: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  btnGrad: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
