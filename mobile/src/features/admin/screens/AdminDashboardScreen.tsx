import React from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { useAdminStore } from '../store/adminStore';

type MenuOption = {
  id: string;
  icon: string;
  label: string;
  description: string;
  route: string;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info';
};

const MENU_OPTIONS: MenuOption[] = [
  {
    id: '1',
    icon: 'account-multiple',
    label: 'Gestión de Usuarios',
    description: 'Administra usuarios registrados',
    route: '/(admin)/users',
    color: 'primary',
  },
  {
    id: '2',
    icon: 'chart-line',
    label: 'Estadísticas',
    description: 'Visualiza datos y métricas',
    route: '/(admin)/statistics',
    color: 'info',
  },
  {
    id: '3',
    icon: 'gift-outline',
    label: 'Gestión de Premios',
    description: 'Control de premios y recompensas',
    route: '/(admin)/rewards',
    color: 'warning',
  },
  {
    id: '4',
    icon: 'trophy',
    label: 'Rankings',
    description: 'Consulta de clasificaciones',
    route: '/(admin)/rankings',
    color: 'primary',
  },
  {
    id: '5',
    icon: 'file-export',
    label: 'Exportar Reportes',
    description: 'Genera reportes en PDF/Excel',
    route: '/(admin)/reports',
    color: 'success',
  },
  {
    id: '6',
    icon: 'chart-box',
    label: 'Participación',
    description: 'Seguimiento de participación',
    route: '/(admin)/participation',
    color: 'warning',
  },
  {
    id: '7',
    icon: 'soccer',
    label: 'Partidos Votados',
    description: 'Partidos más votados',
    route: '/(admin)/voted-matches',
    color: 'error',
  },
  {
    id: '8',
    icon: 'history',
    label: 'Actividad de Usuarios',
    description: 'Control de actividad',
    route: '/(admin)/user-activity',
    color: 'info',
  },
  {
    id: '9',
    icon: 'image-multiple',
    label: 'Gestión de Imágenes',
    description: 'Agregar imágenes al slider',
    route: '/(admin)/images',
    color: 'primary',
  },
];

export function AdminDashboardScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { logout } = useAdminStore();

  const getColorValue = (color: MenuOption['color']) => {
    switch (color) {
      case 'primary':
        return theme.colors.primary;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      case 'info':
        return theme.colors.info;
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/(admin)/login');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Panel de Administrador
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Bienvenido al control total
          </Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <MaterialCommunityIcons
            name="logout"
            size={24}
            color={theme.colors.error}
          />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.primaryLight,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              1,234
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Usuarios
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              5,678
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Predicciones
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>
              89
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Premios
            </Text>
          </View>
        </View>

        {/* Menu Grid */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Funciones Disponibles
        </Text>

        <View style={styles.menuGrid}>
          {MENU_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => router.push(option.route as any)}
              style={({ pressed }) => [
                styles.menuCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: getColorValue(option.color) },
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={28}
                  color="#fff"
                />
              </View>
              <Text style={[styles.menuLabel, { color: theme.colors.text }]}>
                {option.label}
              </Text>
              <Text style={[styles.menuDescription, { color: theme.colors.textSecondary }]}>
                {option.description}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: typography.bold as any,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: typography.regular as any,
    marginTop: spacing.xs,
  },
  logoutButton: {
    padding: spacing.md,
  },
  content: {
    padding: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: typography.bold as any,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: typography.medium as any,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: typography.semibold as any,
    marginBottom: spacing.lg,
  },
  menuGrid: {
    gap: spacing.md,
  },
  menuCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
    ...shadows.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
  menuDescription: {
    fontSize: 12,
    fontWeight: typography.regular as any,
    lineHeight: 16,
  },
});
