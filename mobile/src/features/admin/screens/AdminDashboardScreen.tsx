import React, { useEffect, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { predictions } from '../../mockData';
import { useNewsStore } from '../../content/store/newsStore';
import { useImageAssetsStore } from '../../content/store/imageAssetsStore';
import { useRewardsStore } from '../../content/store/rewardsStore';
import { useSliderStore } from '../../content/store/sliderStore';
import { useUsersStore } from '../../users/store/usersStore';
import { useAdminStore } from '../store/adminStore';
import { useAdminActivityStore } from '../store/adminActivityStore';

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
    description: 'Slider, ads y banners',
    route: '/(admin)/images',
    color: 'primary',
  },
  {
    id: '10',
    icon: 'view-carousel',
    label: 'Gestión de Slider',
    description: 'Slides, botones y orden',
    route: '/(admin)/slider',
    color: 'info',
  },
  {
    id: '11',
    icon: 'newspaper-variant',
    label: 'Noticias',
    description: 'Publicar y editar',
    route: '/(admin)/news',
    color: 'success',
  },
  {
    id: '12',
    icon: 'cog',
    label: 'Configuración',
    description: 'Logo, colores y textos',
    route: '/(admin)/settings',
    color: 'warning',
  },
];

export function AdminDashboardScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { signOut } = useAdminStore();
  const log = useAdminActivityStore((s) => s.log);

  const users = useUsersStore((s) => s.users);
  const refreshUsers = useUsersStore((s) => s.refresh);

  const rewards = useRewardsStore((s) => s.rewards);
  const news = useNewsStore((s) => s.items);
  const images = useImageAssetsStore((s) => s.assets);
  const slides = useSliderStore((s) => s.slides);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const predictionsCount = predictions.length;
    const rewardsCount = rewards.length;
    const publishedNews = news.filter((n) => n.status === 'published').length;
    const imagesCount = images.length;
    const activeSlides = slides.filter((s) => s.status === 'active').length;

    const participationPct = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    return {
      totalUsers,
      activeUsers,
      predictionsCount,
      rewardsCount,
      publishedNews,
      imagesCount,
      activeSlides,
      participationPct,
    };
  }, [images.length, news, rewards.length, slides, users]);

  type ChartPoint = { label: string; value: number };

  const chart = useMemo(() => {
    const today = new Date();
    const points: ChartPoint[] = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;

      const count = news.filter((n) => n.status === 'published' && n.date >= start && n.date < end).length;
      const label = d.toLocaleDateString(undefined, { weekday: 'short' });
      points.push({ label, value: count });
    }

    return points;
  }, [news]);

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
    log({ action: 'logout', module: 'auth', title: 'Cierre de sesión admin' });
    signOut();
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
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons name="account-multiple" size={28} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.totalUsers}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Usuarios</Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons name="account-check" size={28} color={theme.colors.success} />
            <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.activeUsers}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Usuarios activos</Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons name="soccer" size={28} color={theme.colors.info} />
            <Text style={[styles.statValue, { color: theme.colors.info }]}>{stats.predictionsCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Pronósticos</Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons name="gift-outline" size={28} color={theme.colors.warning} />
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>{stats.rewardsCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Premios</Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons name="newspaper-variant" size={28} color={theme.colors.success} />
            <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.publishedNews}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Noticias publicadas</Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons name="image-multiple" size={28} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.imagesCount}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Imágenes</Text>
          </View>
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Participación general</Text>
          <View style={styles.chartRow}>
            <Text style={[styles.chartValue, { color: theme.colors.success }]}>{stats.participationPct}%</Text>
            <Text style={[styles.chartLabel, { color: theme.colors.textSecondary }]}>
              {stats.activeUsers}/{stats.totalUsers} usuarios activos
            </Text>
          </View>
          <ProgressBar value={stats.participationPct} />
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Noticias publicadas (7 días)</Text>
          <SimpleBarChart data={chart} />
          <View style={styles.chartHint}>
            <MaterialCommunityIcons name="view-carousel" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.chartHintText, { color: theme.colors.textSecondary }]}>
              Slider activo: {stats.activeSlides}/{slides.length}
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

function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const { theme } = useAppTheme();
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.barChart}>
      {data.map((d) => (
        <View key={d.label} style={styles.barCol}>
          <View
            style={[
              styles.bar,
              {
                height: `${Math.round((d.value / max) * 100)}%`,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
          <Text style={[styles.barLabel, { color: theme.colors.textSecondary }]}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

function ProgressBar({ value }: { value: number }) {
  const { theme } = useAppTheme();
  const pct = Math.min(Math.max(value, 0), 100);

  return (
    <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceAlt }]}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: theme.colors.success }]} />
    </View>
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
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
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
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: typography.semibold as any,
    marginBottom: spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chartValue: {
    fontSize: 22,
    fontWeight: typography.bold as any,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: typography.medium as any,
  },
  progressTrack: {
    height: 12,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  barCol: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '100%',
    borderRadius: radius.md,
  },
  barLabel: {
    marginTop: spacing.sm,
    fontSize: 10,
    fontWeight: typography.medium as any,
  },
  chartHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chartHintText: {
    fontSize: 12,
    fontWeight: typography.regular as any,
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
