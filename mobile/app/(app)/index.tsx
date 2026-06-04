import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { DashboardSection, SportMatchCard } from '../../src/components';
import { Screen } from '../../src/components/Screen';
import { homePosition, getUpcomingMatches } from '../../src/features/mockData';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { getGreeting } from '../../src/theme/theme';

const BANNER_H = 180;

// ── 4 banners del Mundial 2026 ────────────────────────────────
const WC_BANNERS = [
  {
    id: 'b1',
    emoji: '🏆',
    title: 'Copa Mundial FIFA 2026',
    subtitle: '11 Jun – 19 Jul · Canadá, México y EE.UU.',
    bg: ['#CC2627', '#8B0000'] as [string, string],
    route: '/(app)/fixture',
  },
  {
    id: 'b2',
    emoji: '⚽',
    title: '48 equipos · 104 partidos',
    subtitle: 'El torneo más grande de la historia',
    bg: ['#1a3a5c', '#0d2035'] as [string, string],
    route: '/(app)/fixture',
  },
  {
    id: 'b3',
    emoji: '🎯',
    title: 'Hacé tus pronósticos',
    subtitle: 'Competí con tus compañeros y ganá',
    bg: ['#1a5c2a', '#0d3518'] as [string, string],
    route: '/(app)/pronosticos',
  },
  {
    id: 'b4',
    emoji: '🏅',
    title: 'Tabla de posiciones',
    subtitle: 'Mirá cómo vas en el ranking',
    bg: ['#4a2c6e', '#2d1a44'] as [string, string],
    route: '/(app)/posiciones',
  },
];

// ── Carrusel ──────────────────────────────────────────────────
function WCBanner() {
  const router   = useRouter();
  const flatRef  = useRef<FlatList>(null);
  const [active, setActive]       = useState(0);
  const [itemWidth, setItemWidth] = useState(Dimensions.get('window').width - 32);

  // Autoplay cada 4 segundos
  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % WC_BANNERS.length;
        flatRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setItemWidth(w);
  }, []);

  const onViewable = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActive(viewableItems[0].index);
    }
  }, []);

  const viewConfig = useMemo(() => ({ itemVisiblePercentThreshold: 50 }), []);

  return (
    <View style={bannerS.wrapper} onLayout={onLayout}>
      <FlatList
        ref={flatRef}
        data={WC_BANNERS}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth + 12}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewable}
        viewabilityConfig={viewConfig}
        keyExtractor={(b) => b.id}
        getItemLayout={(_, index) => ({
          length: itemWidth + 12,
          offset: (itemWidth + 12) * index,
          index,
        })}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(item.route as any)}
            style={[bannerS.bannerItem, { width: itemWidth, marginRight: 12 }]}
          >
            <LinearGradient
              colors={item.bg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={bannerS.gradient}
            >
              <Text style={bannerS.emoji}>{item.emoji}</Text>
              <View style={bannerS.textBlock}>
                <Text style={bannerS.title}>{item.title}</Text>
                <Text style={bannerS.subtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.55)" />
            </LinearGradient>
          </Pressable>
        )}
      />
      {/* Indicadores */}
      <View style={bannerS.dots}>
        {WC_BANNERS.map((_, i) => (
          <View
            key={i}
            style={[
              bannerS.dot,
              {
                backgroundColor: i === active ? '#CC2627' : 'rgba(150,150,150,0.4)',
                width: i === active ? 20 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const bannerS = StyleSheet.create({
  wrapper:    { marginBottom: 20 },
  bannerItem: { overflow: 'hidden', borderRadius: 20 },
  gradient: {
    height: BANNER_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    gap: 14,
  },
  emoji:     { fontSize: 42 },
  textBlock: { flex: 1, gap: 5 },
  title:     { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  subtitle:  { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '500', lineHeight: 17 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: { height: 6, borderRadius: 3 },
});

// ── Pantalla principal ────────────────────────────────────────
export default function AppHomeScreen() {
  const router      = useRouter();
  const { theme }   = useAppTheme();
  const { user }    = useAuth();

  if (!user) return null;

  const greeting = getGreeting();
  const firstName = user.nombre?.split(' ')[0] ?? user.nombre ?? 'Usuario';

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 110 }]}
      >
        {/* ── Saludo ──────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.muted }]}>{greeting} 👋</Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{firstName}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/perfil')}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={styles.avatarText}>
              {user.nombre?.substring(0, 2).toUpperCase() ?? 'U'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* ── Banner carrusel ─────────────────────────── */}
          <WCBanner />

          {/* ── Mi posición ─────────────────────────────── */}
          <DashboardSection
            title="🏆 Mi posición"
            icon="trophy"
            action={{ label: 'Ver ranking', onPress: () => router.push('/(app)/posiciones') }}
          >
            <View style={styles.statsRow}>
              <StatCard label="Posición" value={`#${homePosition.position}`} color={theme.colors.primary} theme={theme} />
              <StatCard label="Puntos"   value={String(homePosition.points)} color={theme.colors.text}    theme={theme} />
              <StatCard label="Variación" value={`+${homePosition.variation}`} color={theme.colors.success ?? '#4CAF50'} theme={theme} />
            </View>
          </DashboardSection>

          {/* ── Próximos partidos ────────────────────────── */}
          <DashboardSection
            title="⚽ Próximos partidos"
            icon="calendar"
            action={{ label: 'Ver fixture', onPress: () => router.push('/(app)/fixture') }}
          >
            {getUpcomingMatches(3).map((item) => (
              <SportMatchCard
                key={item.id}
                {...item}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/details/detalle-partido',
                    params: { matchId: item.id },
                  })
                }
              />
            ))}
          </DashboardSection>

          {/* ── Accesos rápidos ──────────────────────────── */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Accesos rápidos</Text>
          <View style={styles.quickGrid}>
            <QuickBtn icon="calendar-outline"   label="Fixture"      color="#CC2627" onPress={() => router.push('/(app)/fixture')}      theme={theme} />
            <QuickBtn icon="bar-chart-outline"   label="Ranking"      color="#F59E0B" onPress={() => router.push('/(app)/posiciones')}   theme={theme} />
            <QuickBtn icon="trophy-outline"      label="Pronósticos"  color="#10B981" onPress={() => router.push('/(app)/pronosticos')}  theme={theme} />
            <QuickBtn icon="person-outline"      label="Mi perfil"    color="#6366F1" onPress={() => router.push('/(app)/perfil')}       theme={theme} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function StatCard({ label, value, color, theme }: { label: string; value: string; color: string; theme: any }) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.muted }]}>{label}</Text>
    </View>
  );
}

function QuickBtn({ icon, label, color, onPress, theme }: { icon: any; label: string; color: string; onPress: () => void; theme: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickBtn,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.quickLabel, { color: theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll:  { flexGrow: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { fontSize: 13, fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  content: { paddingHorizontal: 16 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickBtn: {
    width: '47%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 14, fontWeight: '700' },
});
