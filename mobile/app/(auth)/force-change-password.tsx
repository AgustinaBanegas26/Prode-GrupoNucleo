import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { PasswordStrengthBar } from '../../src/components/PasswordStrengthBar';
import { useAuth } from '../../src/providers/AuthProvider';
import { useAppTheme } from '../../src/providers/ThemeProvider';

export default function ForceChangePasswordScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user, changePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);  // Bloquear botón atrás en Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const logoSource = useMemo(
    () =>
      theme.isDark
        ? require('../../images/icononucleo.png')
        : require('../../images/icononucleo-light.png'),
    [theme.isDark],
  );

  const validate = (): string | null => {
    if (password.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(password)) return 'Debe incluir al menos una mayúscula';
    if (!/[a-z]/.test(password)) return 'Debe incluir al menos una minúscula';
    if (!/\d/.test(password)) return 'Debe incluir al menos un número';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Debe incluir al menos un símbolo';
    if (password !== confirm) return 'Las contraseñas no coinciden';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      setError('Sesión no encontrada. Volvé a iniciar sesión.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      console.log('[FCP] llamando changePassword para user:', user.id, 'role:', user.role);
      await changePassword(user, password);
      console.log('[FCP] changePassword exitoso, redirigiendo...');
      router.replace(user.role === 'admin' ? '/(admin)' : '/(app)');
    } catch (e) {
      console.log('[FCP] error:', e);
      setError(e instanceof Error ? e.message : 'Error al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image
              source={logoSource}
              style={{ width: 140, height: 140, marginBottom: 20 }}
              resizeMode="contain"
            />
            <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800', marginBottom: 6 }}>
              Cambiá tu contraseña
            </Text>
            <Text style={{ color: theme.colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              {user ? `Hola ${user.nombre}. Definí tu contraseña definitiva.` : 'Definí tu contraseña definitiva.'}
            </Text>
          </View>

          {/* Formulario */}
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: theme.colors.border,
              gap: 16,
            }}
          >
            {/* Campo contraseña nueva */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                Contraseña nueva
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 50,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                  paddingHorizontal: 14,
                }}
              >
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mín. 8, mayús, minús, número, símbolo"
                  placeholderTextColor={theme.colors.placeholder}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    color: theme.colors.text,
                    fontSize: 15,
                    paddingVertical: 0,
                    outlineStyle: 'none' as any,
                  }}
                />
                <Pressable onPress={() => setShowPass(v => !v)} hitSlop={12}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.muted} />
                </Pressable>
              </View>
            </View>

            {/* Indicador de fortaleza */}
            <PasswordStrengthBar password={password} />

            {/* Campo confirmar */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                Confirmar contraseña
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 50,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                  paddingHorizontal: 14,
                }}
              >
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Repetí la contraseña"
                  placeholderTextColor={theme.colors.placeholder}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    color: theme.colors.text,
                    fontSize: 15,
                    paddingVertical: 0,
                    outlineStyle: 'none' as any,
                  }}
                />
                <Pressable onPress={() => setShowConfirm(v => !v)} hitSlop={12}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.muted} />
                </Pressable>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View
                style={{
                  backgroundColor: 'rgba(61,165,245,0.08)',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(61,165,245,0.25)',
                  padding: 12,
                }}
              >
                <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Botón */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={{
                height: 50,
                borderRadius: 12,
                backgroundColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                  Actualizar contraseña
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
