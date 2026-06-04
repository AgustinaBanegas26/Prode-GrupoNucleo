import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';

import { Button } from '../../src/components/Button';
import { FormTextField } from '../../src/components/FormTextField';
import { Screen } from '../../src/components/Screen';
import { type ResetPasswordFormValues, resetPasswordSchema } from '../../src/features/auth/schemas';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import {
  PasswordRecoveryError,
  establishRecoverySessionFromUrl,
  hasActiveRecoverySession,
  subscribeToPasswordRecoveryLinks,
  updatePassword,
} from '../../src/services/auth/passwordRecoveryService';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [success, setSuccess] = useState(false);

  const logoSource = useMemo(
    () =>
       theme.isDark
        ? require('../../images/icononucleo.png')
        : require('../../images/icononucleo-light.png'),
    [theme.isDark],
  );

  const { control, handleSubmit, formState } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      try {
        const active = await hasActiveRecoverySession();
        if (mounted) {
          setSessionReady(active);
          if (!active) {
            setLinkError(
              'Abrí el enlace que recibiste por correo para restablecer tu contraseña.',
            );
          }
        }
      } catch (e) {
        if (!mounted) return;
        setLinkError(
          e instanceof PasswordRecoveryError
            ? e.message
            : 'No se pudo validar el enlace de recuperación.',
        );
      } finally {
        if (mounted) setCheckingLink(false);
      }
    }

    const unsubscribe = subscribeToPasswordRecoveryLinks(async (url) => {
      setCheckingLink(true);
      setLinkError(null);
      try {
        const established = await establishRecoverySessionFromUrl(url);
        if (established) {
          setSessionReady(true);
          setLinkError(null);
        }
      } catch (e) {
        setSessionReady(false);
        setLinkError(
          e instanceof PasswordRecoveryError
            ? e.message
            : 'El enlace expiró o ya fue utilizado. Solicitá uno nuevo.',
        );
      } finally {
        setCheckingLink(false);
      }
    });

    verifySession();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await updatePassword(values.password);
      setSuccess(true);
    } catch (e) {
      setSubmitError(
        e instanceof PasswordRecoveryError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'No se pudo restablecer la contraseña.',
      );
    }
  });

  if (checkingLink) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#5C5C5C', fontSize: 14 }}>Validando enlace seguro...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Image source={logoSource} style={{ width: 120, height: 120 }} resizeMode="contain" />
          <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800' }}>
            Nueva contraseña
          </Text>
          <Text style={{ color: '#5C5C5C', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            Definí una contraseña segura para tu cuenta de Prode Mundial 2026.
          </Text>
        </View>

        {success ? (
          <View style={{ gap: 12 }}>
            <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '700' }}>
              Contraseña actualizada correctamente
            </Text>
            <Text style={{ color: '#5C5C5C', fontSize: 14, lineHeight: 20 }}>
              Ya podés iniciar sesión con tu nueva contraseña.
            </Text>
            <Button title="Ir a login" onPress={() => router.replace('/(auth)/login')} />
          </View>
        ) : !sessionReady ? (
          <View style={{ gap: 12 }}>
            {linkError ? (
              <Text style={{ color: '#CC2627', fontSize: 13, fontWeight: '600', lineHeight: 18 }}>
                {linkError}
              </Text>
            ) : null}
            <Button
              title="Solicitar nuevo enlace"
              variant="secondary"
              onPress={() => router.replace('/(auth)/forgot-password')}
            />
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={{ color: '#CC2627', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                Volver a login
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <FormTextField
              control={control}
              name="password"
              label="Nueva contraseña"
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
              <Text style={{ color: '#CC2627', fontSize: 13, fontWeight: '600' }}>
                {submitError}
              </Text>
            ) : null}

            <Button
              title="Actualizar contraseña"
              onPress={onSubmit}
              loading={formState.isSubmitting}
            />

            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={{ color: '#CC2627', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                Volver a login
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Screen>
  );
}
