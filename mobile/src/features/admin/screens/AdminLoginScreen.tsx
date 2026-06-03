import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { TextField } from '../../../components/TextField';
import { Button } from '../../../components/Button';
import { useAdminStore } from '../store/adminStore';
import { useAdminActivityStore } from '../store/adminActivityStore';

export function AdminLoginScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { signIn } = useAdminStore();
  const log = useAdminActivityStore((s) => s.log);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    // Simular delay de verificación
    await new Promise((resolve) => setTimeout(resolve, 500));

    const ok = await signIn(email, password);
    if (ok) {
      log({ action: 'login', module: 'auth', title: 'Inicio de sesión admin', detail: email });
      router.replace('/(admin)');
    } else {
      Alert.alert('Error', 'Credenciales inválidas');
      setPassword('');
    }

    setLoading(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-account"
              size={48}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Panel de Administrador
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Acceso exclusivo
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextField
            label="Usuario"
            value={email}
            onChangeText={setEmail}
            placeholder="admin"
            keyboardType="default"
            autoCapitalize="none"
          />

          <TextField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <Button
            title={loading ? 'Iniciando sesión...' : 'Ingresar'}
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: radius.lg,
              paddingVertical: spacing.md,
            }}
          />
        </View>

        {/* Info */}
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={theme.colors.info}
          />
          <View style={styles.infoText}>
            <Text
              style={[
                styles.infoTitle,
                { color: theme.colors.text },
              ]}
            >
              Demo: Credenciales de Prueba
            </Text>
            <Text
              style={[
                styles.infoDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              Usuario: admin{'\n'}
              Contraseña: 1234
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: typography.bold as any,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: typography.medium as any,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing['3xl'],
  },
  infoBox: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
    ...shadows.sm,
  },
  infoText: {
    flex: 1,
    gap: spacing.xs,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
  infoDescription: {
    fontSize: 12,
    fontWeight: typography.regular as any,
    lineHeight: 18,
  },
});
