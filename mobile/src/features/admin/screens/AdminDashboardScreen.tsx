import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { useAllPredictions } from '../../content/api/predictions';
import { useUsersStore } from '../../users/store/usersStore';
import { useAdminActivityStore } from '../store/adminActivityStore';
import { useAuth } from '../../../providers/AuthProvider';

// ── Paleta idéntica a la app usuario ───────────────────────────
const CELESTE      = '#6EC6FF';
const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE    = '#0F4C81';
const RED          = '#CC2627';

type MenuOption = {
  id: string;
  icon: string;
  label: string;
  description: string;
  route: string;
};

const MENU_OPTIONS: MenuOption[] = [
  { id: '1', icon: 'account-multiple', label: 'Usuarios',         description: 'Administrá usuarios registrados',    route: '/(admin)/users'         },
  { id: '10', icon: 'soccer',          label: 'Partidos',          description: 'Resultados y estados de partidos',   route: '/(admin)/matches'        },
  { id: '11', icon: 'newspaper',       label: 'Novedades',         description: 'Noticias publicadas en la app',      route: '/(admin)/news'           },
  { id: '9', icon: 'view-carousel',    label: 'Slider',            description: 'Banners del inicio de usuarios',      route: '/(admin)/slider'         },
  { id: '12', icon: 'bell',            label: 'Notificaciones',    description: 'Push manual e historial',            route: '/(admin)/notifications'  },
  { id: '4', icon: 'trophy',           label: 'Rankings',          description: 'Puntos, ranking y puntuación',       route: '/(admin)/rankings'       },
  { id: '13', icon: 'cellphone',       label: 'Versiones APK',     description: 'Actualizaciones de la aplicación',   route: '/(admin)/app-versions'   },
  { id: '2', icon: 'chart-line',       label: 'Estadísticas',      description: 'Datos y métricas en tiempo real',    route: '/(admin)/statistics'     },
  { id: '6', icon: 'chart-box',        label: 'Participación',     description: 'Seguimiento de participación',       route: '/(admin)/participation'  },
  { id: '7', icon: 'vote',             label: 'Predicciones',      description: 'Partidos con más pronósticos',        route: '/(admin)/voted-matches'  },
  { id: '8', icon: 'history',          label: 'Actividad',         description: 'Registro de eventos del admin',       route: '/(admin)/user-activity'  },
];

function FadeSlide({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export function AdminDashboardScreen() {
  const { theme } = useAppTheme();
  const isDark    = theme.isDark;
  const router    = useRouter();
  const { logout } = useAuth();
  const log        = useAdminActivityStore((s) => s.log);
  const users      = useUsersStore((s) => s.users);
  const refreshUsers = useUsersStore((s) => s.refresh);
  const { data: allPredictions = [] } = useAllPredictions();

  useEffect(() => { refreshUsers(); }, [refreshUsers]);

  const stats = useMemo(() => {
    const totalUsers  = users.length;
    const activeUsers = users.filter((u) => u.activo).length;
    const predictionsCount = allPredictions.length;
    const participationPct = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    return { totalUsers, activeUsers, predictionsCount, participationPct };
  }, [users, allPredictions]);

  const handleLogout = async () => {
    log({ action: 'logout', module: 'auth', title: 'Cierre de sesión admin' });
    await logout();
    router.replace('/(auth)/login');
  };

  const bg = isDark ? '#0D0D0D' : '#F5F7FA';

  return (
    <ScrollView style={[s.root, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>

      {/* ── Header — mismo degradado celeste que la app ── */}
      <LinearGradient
        colors={[CELESTE_DARK, DEEP_BLUE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        {/* Decoración geométrica igual a los banners */}
        <View style={s.circleL} />
        <View style={s.circleS} />

        <View style={s.headerRow}>
          <LinearGradient colors={[CELESTE, CELESTE_DARK]} style={s.avatar}>
            <MaterialCommunityIcons name="shield-crown" size={24} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Panel Admin</Text>
            <Text style={s.headerSub}>Mundial 2026 🏆</Text>
          </View>
          <Pressable onPress={handleLogout} style={s.logoutBtn}>
            <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={[s.content, { backgroundColor: bg }]}>

        {/* ── Stats ────────────────────────────────────── */}
        <FadeSlide delay={60}>
          <View style={s.statsRow}>
            {[
              { icon: 'account-multiple', value: stats.totalUsers,       label: 'Usuarios'    },
              { icon: 'account-check',    value: stats.activeUsers,      label: 'Activos'     },
              { icon: 'soccer',           value: stats.predictionsCount, label: 'Pronósticos' },
              { icon: 'percent',          value: `${stats.participationPct}%`, label: 'Part.' },
            ].map((st) => (
              <View
                key={st.label}
                style={[s.statCard, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                  borderColor:     isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.3)',
                  shadowColor: CELESTE,
                }]}
              >
                <MaterialCommunityIcons name={st.icon as any} size={20} color={CELESTE_DARK} />
                <Text style={[s.statValue, { color: CELESTE_DARK }]}>{st.value}</Text>
                <Text style={[s.statLabel, { color: theme.colors.muted }]}>{st.label}</Text>
              </View>
            ))}
          </View>
        </FadeSlide>

        {/* ── Barra participación ──────────────────────── */}
        <FadeSlide delay={120}>
          <View style={[s.card, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
            borderColor:     isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.25)',
            shadowColor: CELESTE,
          }]}>
            <View style={s.cardHeaderRow}>
              <MaterialCommunityIcons name="percent" size={18} color={CELESTE_DARK} />
              <Text style={[s.cardTitle, { color: theme.colors.text }]}>Participación general</Text>
              <Text style={[s.bigPct, { color: CELESTE_DARK }]}>{stats.participationPct}%</Text>
            </View>
            <Text style={[s.cardSub, { color: theme.colors.muted }]}>
              {stats.activeUsers} de {stats.totalUsers} usuarios activos
            </Text>
            {/* Barra celeste → azul */}
            <View style={[s.track, { backgroundColor: isDark ? 'rgba(110,198,255,0.12)' : '#EBF5FF' }]}>
              <LinearGradient
                colors={[CELESTE, CELESTE_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.fill, { width: `${stats.participationPct}%` }]}
              />
            </View>
          </View>
        </FadeSlide>

        {/* ── Módulos ──────────────────────────────────── */}
        <FadeSlide delay={180}>
          <Text style={[s.sectionTitle, { color: theme.colors.text }]}>⚽  Módulos</Text>
          <View style={s.menuGrid}>
            {MENU_OPTIONS.map((opt, idx) => (
              <MenuCard key={opt.id} option={opt} theme={theme} isDark={isDark} delay={idx * 40} onPress={() => router.push(opt.route as any)} />
            ))}
          </View>
        </FadeSlide>

      </View>
    </ScrollView>
  );
}

function MenuCard({ option, theme, isDark, delay, onPress }: {
  option: MenuOption; theme: any; isDark: boolean; delay: number; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 15, stiffness: 300 }).start();

  return (
    <Animated.View style={[mc.wrap, { transform: [{ scale }] }]}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ flex: 1 }}>
        <View style={[mc.card, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
          borderColor:     isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.25)',
          shadowColor: CELESTE,
        }]}>
          {/* Ícono con fondo celeste suave */}
          <View style={[mc.iconBox, { backgroundColor: isDark ? 'rgba(110,198,255,0.12)' : '#EBF5FF' }]}>
            <MaterialCommunityIcons name={option.icon as any} size={24} color={CELESTE_DARK} />
          </View>
          <Text style={[mc.label, { color: theme.colors.text }]}>{option.label}</Text>
          <Text style={[mc.desc, { color: theme.colors.muted }]}>{option.description}</Text>
          {/* Flecha */}
          <View style={mc.arrow}>
            <MaterialCommunityIcons name="chevron-right" size={16} color={CELESTE_DARK} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const mc = StyleSheet.create({
  wrap: { width: '47%' },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBox:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: 13, fontWeight: '800' },
  desc:     { fontSize: 10, fontWeight: '500', lineHeight: 14 },
  arrow:    { alignSelf: 'flex-end' },
});

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { paddingTop: 56, paddingBottom: 32, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  circleL:    { position: 'absolute', width: 180, height: 180, borderRadius: 90,  borderWidth: 1.5, borderColor: `${CELESTE}30`, top: -50, right: -40 },
  circleS:    { position: 'absolute', width: 100, height: 100, borderRadius: 50,  borderWidth: 1,   borderColor: `${CELESTE}20`, top: 30,  right: 60  },
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar:     { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub:  { color: 'rgba(255,255,255,0.68)', fontSize: 13, fontWeight: '500', marginTop: 2 },
  logoutBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center' },
  content:    { padding: 16, gap: 16, paddingBottom: 40 },
  statsRow:   { flexDirection: 'row', gap: 8 },
  statCard:   {
    flex: 1, borderRadius: 18, borderWidth: 1, padding: 12,
    alignItems: 'center', gap: 5,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
  },
  statValue:  { fontSize: 17, fontWeight: '800' },
  statLabel:  { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  card:       {
    borderRadius: 20, borderWidth: 1, padding: 18, gap: 10,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:  { flex: 1, fontSize: 14, fontWeight: '700' },
  bigPct:     { fontSize: 22, fontWeight: '800' },
  cardSub:    { fontSize: 12, fontWeight: '500' },
  track:      { height: 10, borderRadius: 99, overflow: 'hidden' },
  fill:       { height: '100%', borderRadius: 99 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  menuGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
