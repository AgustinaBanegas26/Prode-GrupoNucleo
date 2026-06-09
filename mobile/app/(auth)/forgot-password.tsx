import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';

import { AuthScreenShell } from '../../src/components/auth/AuthScreenShell';
import { FormTextField } from '../../src/components/FormTextField';
import { type ForgotPasswordFormValues, forgotPasswordSchema } from '../../src/features/auth/schemas';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import {
  PasswordRecoveryError,
  sendPasswordResetEmail,
} from '../../src/services/auth/passwordRecoveryService';

const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE = '#0F4C81';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      setSubmitError(
        e instanceof Error
          ? e.message
          : 'No fue posible enviar el correo. Intente nuevamente.',
      );
    }
  });

  return (
    <AuthScreenShell
      title="Recuperar contraseña"
      subtitle="Ingresá el email asociado a tu cuenta y te enviaremos un enlace seguro."
      footer={
        <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={8}>
          <Text style={styles.linkText}>Volver a login</Text>
        </Pressable>
      }
    >
      {success ? (
        <View style={styles.successBox}>
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            Correo enviado correctamente.
          </Text>
          <Text style={[styles.successBody, { color: theme.colors.textSecondary }]}>
            Revisá tu bandeja de entrada. Recibirás un enlace para restablecer tu contraseña. El
            enlace expira automáticamente y solo puede usarse una vez.
          </Text>
          <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.btnWrap}>
            <LinearGradient
              colors={[CELESTE_DARK, DEEP_BLUE]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGrad}
            >
              <Text style={styles.btnText}>Volver a login</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Recuperar Contraseña</Text>

          <FormTextField
            control={control}
            name="email"
            label="Email"
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
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
              <Text style={styles.btnText}>
                {formState.isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
              </Text>
            </LinearGradient>
          </Pressable>
        </>
      )}
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
  successBox: { gap: 14 },
  successTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  successBody: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  btnWrap: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  btnGrad: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkText: { color: '#fff', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});
