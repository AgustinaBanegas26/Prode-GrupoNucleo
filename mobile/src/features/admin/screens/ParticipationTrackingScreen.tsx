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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { useAllPredictions } from '../../content/api/predictions';
import { useUsersStore } from '../../users/store/usersStore';
import { useAdminActivityStore } from '../store/adminActivityStore';

const VERDE  = '#22C55E';
const DORADO = '#F59E0B';

const formatDateTime = (ts: number) => new Date(ts).toLocaleString('es-AR');

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

function AnimatedProgress({ value, color1, color2, isDark }: { value: number; color1: string; color2: string; isDark: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct  = Math.min(Math.max(value, 0), 100);
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 900, useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={[pg.track, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
      <Animated.View style={[{ width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]}>
        <LinearGradient colors={[color1, color2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={pg.fill} />
      </Animated.View>
    </View>
  );
}
const pg = StyleSheet.create({
  track: { height: 10, borderRadius: 99, overflow: 'hidden' },
  fill:  { height: 10, borderRadius: 99 },
});

function StatMini({ icon, value, label, accentDark, accentLight, bgLight, isDark }: {
  icon: string; value: number; label: string; accentDark: string; accentLight: string; bgLight: string; isDark: boolean;
}) {
  const accent = isDark ? accentDark : accentLight;
  const bg     = isDark ? accent + '20' : bgLight;
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  return (
    <View style={[sm.card, { backgroundColor: bg, borderColor: border }]}>
      <View style={[sm.iconBox, { backgroundColor: accent + '30' }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={accent} />
      </View>
      <Text style={[sm.value, { color: accent }]}>{value}</Text>
      <Text style={[sm.label, { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' }]}>{label}</Text>
    </View>
  );
}
const sm = StyleSheet.create({
  card:    { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 6, borderWidth: 1 },
  iconBox: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  value:   { fontSize: 17, fontWeight: '800' },
  label:   { fontSize: 9, fontWeight: '600', textAlign: 'center' },
});

export function ParticipationTrackingScreen() {
  const { theme } = useAppTheme();
  const isDark = theme.isDark;
  const router = useRouter();

  const users        = useUsersStore((s) => s.users);
  const refreshUsers = useUsersStore((s) => s.refresh);
  const activity     = useAdminActivityStore((s) => s.items);
  const { data: allPredictions = [] } = useAllPredictions();

  useEffect(() => { refreshUsers(); }, [refreshUsers]);

  const stats = useMemo(() => {
    const totalUsers   = users.length;
    const activeUsers  = users.filter((u) => u.activo).length;
    const blockedUsers = users.filter((u) => !u.activo).length;
    const inactiveUsers = 0;
    const predictionsCount = allPredictions.length;
    const participationPct = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    return { totalUsers, activeUsers, inactiveUsers, blockedUsers, predictionsCount, participationPct };
  }, [users, allPredictions]);

  const recent = useMemo(() => activity.slice(0, 12), [activity]);

  const bg      = isDark ? '#0a0f0a' : '#faf5ff';
  const hFrom   = isDark ? '#052e16' : '#7c3aed';
  const hTo     = isDark ? '#0a0f0a' : '#faf5ff';
  const cardBg  = isDark ? 'rgba(255,255,255,0.05)' : '#fff';
  const border  = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const titleC  = isDark ? '#fff' : '#111';
  const subC    = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const dotC    = VERDE;

  return (
    <ScrollView style={[s.root, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[hFrom, hTo]} style={s.header}>
        <View style={s.circleL} />
        <View style={s.circleS} />
        <FadeSlide delay={0}>
          <View style={s.headerRow}>
            <Pressable onPress={() => router.push('/(admin)')} style={s.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <LinearGradient colors={['#3b0764', '#1e1b4b']} style={s.iconGrad}>
              <MaterialCommunityIcons name="chart-box" size={22} color="#a78bfa" />
            </LinearGradient>
            <View>
              <Text style={s.title}>Participación</Text>
              <Text style={s.sub}>Resumen operativo</Text>
            </View>
          </View>
        </FadeSlide>
      </LinearGradient>

      <View style={s.content}>
        <FadeSlide delay={60}>
          <View style={s.statsRow}>
            <StatMini icon="account-multiple" value={stats.totalUsers}    label="Usuarios"   accentDark={VERDE}     accentLight="#16a34a" bgLight="#dcfce7" isDark={isDark} />
            <StatMini icon="account-check"    value={stats.activeUsers}   label="Activos"    accentDark="#38bdf8"   accentLight="#0284c7" bgLight="#e0f2fe" isDark={isDark} />
            <StatMini icon="account-clock"    value={stats.inactiveUsers} label="Inactivos"  accentDark={DORADO}    accentLight="#d97706" bgLight="#fef3c7" isDark={isDark} />
            <StatMini icon="account-lock"     value={stats.blockedUsers}  label="Bloqueados" accentDark="#ef4444"   accentLight="#dc2626" bgLight="#fee2e2" isDark={isDark} />
          </View>
        </FadeSlide>

        <FadeSlide delay={120}>
          <View style={[s.glassCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={s.cardHeader}>
              <MaterialCommunityIcons name="percent" size={18} color={VERDE} />
              <Text style={[s.cardTitle, { color: titleC }]}>Participación general</Text>
            </View>
            <View style={s.bigRow}>
              <Text style={[s.bigNum, { color: VERDE }]}>{stats.participationPct}%</Text>
              <Text style={[s.bigSub, { color: subC }]}>{stats.activeUsers} de {stats.totalUsers} activos</Text>
            </View>
            <AnimatedProgress value={stats.participationPct} color1={VERDE} color2={DORADO} isDark={isDark} />
          </View>
        </FadeSlide>

        <FadeSlide delay={180}>
          <View style={[s.glassCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={s.cardHeader}>
              <MaterialCommunityIcons name="soccer" size={18} color="#38bdf8" />
              <Text style={[s.cardTitle, { color: titleC }]}>Pronósticos registrados</Text>
            </View>
            <View style={s.bigRow}>
              <Text style={[s.bigNum, { color: '#38bdf8' }]}>{stats.predictionsCount}</Text>
              <Text style={[s.bigSub, { color: subC }]}>Total acumulado</Text>
            </View>
            <AnimatedProgress value={Math.min((stats.predictionsCount / 500) * 100, 100)} color1="#38bdf8" color2="#6366f1" isDark={isDark} />
          </View>
        </FadeSlide>

        <FadeSlide delay={240}>
          <View style={[s.glassCard, { backgroundColor: cardBg, borderColor: border, marginBottom: 32 }]}>
            <View style={s.cardHeader}>
              <MaterialCommunityIcons name="history" size={18} color={DORADO} />
              <Text style={[s.cardTitle, { color: titleC }]}>Actividad reciente</Text>
            </View>
            {recent.length === 0 ? (
              <Text style={[s.empty, { color: subC }]}>Sin actividad registrada todavía.</Text>
            ) : (
              <View style={s.recentList}>
                {recent.map((it) => (
                  <View key={it.id} style={s.recentItem}>
                    <View style={[s.recentDot, { backgroundColor: dotC }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.recentTitle, { color: titleC }]} numberOfLines={1}>{it.title}</Text>
                      <Text style={[s.recentMeta, { color: subC }]} numberOfLines={1}>{it.module} · {formatDateTime(it.createdAt)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </FadeSlide>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  header:   { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  circleL:  { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: `${VERDE}25`, top: -60, right: -40 },
  circleS:  { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: `${DORADO}20`, top: 20, right: 80 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  iconGrad:  { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  title:     { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub:       { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  content:   { padding: 16, gap: 14 },
  statsRow:  { flexDirection: 'row', gap: 7 },
  glassCard: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:  { fontSize: 14, fontWeight: '700' },
  bigRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  bigNum:    { fontSize: 30, fontWeight: '800' },
  bigSub:    { fontSize: 13, fontWeight: '500', flex: 1 },
  empty:     { fontSize: 13, fontWeight: '500' },
  recentList: { gap: 10 },
  recentItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  recentDot:  { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  recentTitle: { fontSize: 13, fontWeight: '600' },
  recentMeta:  { fontSize: 11, fontWeight: '500', marginTop: 2 },
});
