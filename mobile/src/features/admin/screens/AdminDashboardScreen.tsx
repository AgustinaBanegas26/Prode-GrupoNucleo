import React, { useEffect, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { predictions } from '../../mockData';
import { useNewsStore } from '../../content/store/newsStore';
import { useImageAssetsStore } from '../../content/store/imageAssetsStore';
import { useRewardsStore } from '../../content/store/rewardsStore';
import { useSliderRealtime, useSliderSlides } from '../../content/api/sliderSlides';
import { useUsersStore } from '../../users/store/usersStore';
import { useAdminActivityStore } from '../store/adminActivityStore';
import { useAuth } from '../../../providers/AuthProvider';

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
    id: '13',
    icon: 'soccer',
    label: 'Gestión de Partidos',
    description: 'Crear, editar y cargar resultados',
    route: '/(admin)/matches',
    color: 'primary',
  },
  {
    id: '1',
    icon: 'account-multiple',
    label: 'Usuarios',
    description: 'Administra usuarios registrados',
    route: '/(admin)/users',
    color: 'primary',
  },
  {
    id: '14',
    icon: 'bell-ring',
    label: 'Notificaciones Push',
    description: 'Enviar globales, por grupo o individuales',
    route: '/(admin)/notifications',
    color: 'info',
  },
  {
    id: '11',
    icon: 'newspaper-variant',
    label: 'Noticias',
    description: 'Publicar y editar noticias',
    route: '/(admin)/news',
    color: 'success',
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
    label: 'Premios',
    description: 'Control de premios y recompensas',
    route: '/(admin)/rewards',
    color: 'warning',
  },
  {
    id: '10',
    icon: 'view-carousel',
    label: 'Slider / Banners',
    description: 'Slides, botones y orden',
    route: '/(admin)/slider',
    color: 'info',
  },
  {
    id: '9',
    icon: 'image-multiple',
    label: 'Imágenes',
    description: 'Slider, ads y banners',
    route: '/(admin)/images',
    color: 'primary',
  },
  {
    id: '5',
    icon: 'file-export',
    label: 'Reportes',
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
  const { logout } = useAuth();
  const log = useAdminActivityStore((s) => s.log);

  const users = useUsersStore((s) => s.users);
  const refreshUsers = useUsersStore((s) => s.refresh);

  const rewards = useRewardsStore((s) => s.rewards);
  const news = useNewsStore((s) => s.items);
  const images = useImageAssetsStore((s) => s.assets);
  const { data: slides = [] } = useSliderSlides();
  useSliderRealtime();

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.activo).length;
    const predictionsCount = predictions.length;
    const rewardsCount = rewards.length;
    const publishedNews = news.filter((n) => n.status === 'published').length;
    const imagesCount = images.length;
    const activeSlides = slides.filter((s) => s.active).length;

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

  const handleLogout = async () => {
    log({ action: 'logout', module: 'auth', title: 'Cierre de sesión admin' });
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header premium */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.adminAvatar, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="shield-crown" size={22} color="#fff" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Panel Admin
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Mundial 2026 🏆
            </Text>
          </View>
        </View>
        <Pressable onPress={handleLogout} style={[styles.logoutButton, { backgroundColor: 'rgba(244,67,54,0.12)' }]}>
          <MaterialCommunityIcons name="logout" size={18} color={theme.colors.error} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Stats — 2 columnas grandes */}
        <View style={styles.statsGrid}>
          {[
            { icon: 'account-multiple', value: stats.totalUsers, label: 'Usuarios', color: theme.colors.primary },
            { icon: 'account-check', value: stats.activeUsers, label: 'Activos', color: theme.colors.success },
            { icon: 'soccer', value: stats.predictionsCount, label: 'Pronósticos', color: theme.colors.info },
            { icon: 'gift-outline', value: stats.rewardsCount, label: 'Premios', color: theme.colors.warning },
            { icon: 'newspaper-variant', value: stats.publishedNews, label: 'Noticias', color: theme.colors.success },
            { icon: 'image-multiple', value: stats.imagesCount, label: 'Imágenes', color: theme.colors.primary },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[
                styles.statCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={[styles.statIconBox, { backgroundColor: `${stat.color}18` }]}>
                <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
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

        {/* Menu Grid — 2 columnas */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Módulos
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
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${getColorValue(option.color)}18` },
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={26}
                  color={getColorValue(option.color)}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  menuCard: {
    width: '48%',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.sm,
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
