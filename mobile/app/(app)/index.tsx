import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from '../../src/components/Screen';
import { getUpcomingMatches } from '../../src/features/mockData';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { getGreeting, getFlagEmoji } from '../../src/theme/theme';

// ── Paleta Argentina (separada del rojo) ──────────────────────
const CELESTE      = '#6EC6FF';
const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE    = '#0F4C81';
const RED          = '#CC2627';
const BANNER_H     = 200;

// ── Banners — celeste/blanco para arg, rojo solo para Núcleo ──
const WC_BANNERS = [
  {
    id: 'b1',
    emoji: '⚽',
    title: 'Copa Mundial FIFA 2026',
    subtitle: '11 Jun – 19 Jul · Canadá, México y EE.UU.',
    bg: [DEEP_BLUE, CELESTE_DARK] as [string, string],
    route: '/(app)/fixture',
    accent: CELESTE,
  },
  {
    id: 'b2',
    emoji: '🎯',
    title: 'Hacé tu pronóstico',
    subtitle: 'Predecí resultados y sumá puntos',
    bg: ['#0a3460', DEEP_BLUE] as [string, string],
    route: '/(app)/pronosticos',
    accent: CELESTE,
  },
  {
    id: 'b3',
    emoji: '🏆',
    title: 'Tabla de posiciones',
    subtitle: 'Mirá cómo vas en el ranking general',
    bg: ['#1a5c2a', '#0d3518'] as [string, string],
    route: '/(app)/posiciones',
    accent: '#22C55E',
  },
];

// ── Animación fade+slide ───────────────────────────────────────
function FadeSlide({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ── Carrusel de banners ────────────────────────────────────────
function WCBanner() {
  const router   = useRouter();
  const flatRef  = useRef<FlatList>(null);
  const [active, setActive]       = useState(0);
  const [itemWidth, setItemWidth] = useState(Dimensions.get('window').width - 32);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % WC_BANNERS.length;
        flatRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4500);
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
              {/* Decoración geométrica */}
              <View style={[bannerS.circle, { borderColor: item.accent + '30' }]} />
              <View style={[bannerS.circleSmall, { borderColor: item.accent + '20' }]} />

              <View style={bannerS.row}>
                <View style={bannerS.textBlock}>
                  <Text style={bannerS.emoji}>{item.emoji}</Text>
                  <Text style={bannerS.title}>{item.title}</Text>
                  <Text style={bannerS.subtitle}>{item.subtitle}</Text>
                </View>
                <View style={[bannerS.arrow, { backgroundColor: item.accent + '25' }]}>
                  <Ionicons name="chevron-forward" size={20} color={item.accent} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        )}
      />
      <View style={bannerS.dots}>
        {WC_BANNERS.map((b, i) => (
          <View
            key={i}
            style={[
              bannerS.dot,
              {
                backgroundColor: i === active ? CELESTE : 'rgba(110,198,255,0.25)',
                width: i === active ? 22 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const bannerS = StyleSheet.create({
  wrapper:    { marginBottom: 8 },
  bannerItem: { overflow: 'hidden', borderRadius: 22 },
  gradient: {
    height: BANNER_H,
    padding: 22,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    top: -50,
    right: -40,
  },
  circleSmall: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    top: 30,
    right: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  textBlock: { gap: 4 },
  emoji:    { fontSize: 36, marginBottom: 4 },
  title:    { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '500' },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: { height: 6, borderRadius: 3 },
});

// ── Card partido próximo ───────────────────────────────────────
function UpcomingMatchCard({ match, onPress }: {
  match: ReturnType<typeof getUpcomingMatches>[number];
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 15, stiffness: 300 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: 10 }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          upS.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.isDark ? 'rgba(110,198,255,0.12)' : 'rgba(110,198,255,0.2)',
          },
        ]}
      >
        {/* Grupo + hora */}
        <View style={upS.headerRow}>
          <View style={[upS.groupBadge, { backgroundColor: theme.isDark ? 'rgba(110,198,255,0.15)' : '#EBF5FF' }]}>
            <Text style={[upS.groupText, { color: CELESTE_DARK }]}>{match.group ?? match.phase}</Text>
          </View>
          <Text style={[upS.timeText, { color: theme.colors.textSecondary }]}>{match.time} · {match.date}</Text>
        </View>

        {/* Equipos */}
        <View style={upS.teamsRow}>
          <View style={upS.teamCol}>
            <Text style={upS.flag}>{getFlagEmoji(match.homeCode)}</Text>
            <Text style={[upS.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {match.homeTeam}
            </Text>
          </View>

          <View style={upS.vsCol}>
            <Text style={[upS.vs, { color: theme.colors.muted }]}>VS</Text>
          </View>

          <View style={upS.teamCol}>
            <Text style={upS.flag}>{getFlagEmoji(match.awayCode)}</Text>
            <Text style={[upS.teamName, { color: theme.colors.text }]} numberOfLines={1}>
              {match.awayTeam}
            </Text>
          </View>
        </View>

        {/* Estadio */}
        <View style={upS.footer}>
          <Feather name="map-pin" size={11} color={theme.colors.muted} />
          <Text style={[upS.stadium, { color: theme.colors.muted }]}>{match.stadium}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const upS = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: CELESTE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  groupBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  groupText: { fontSize: 11, fontWeight: '700' },
  timeText:  { fontSize: 12, fontWeight: '500' },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  flag: { fontSize: 36 },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 90,
  },
  vsCol: { width: 40, alignItems: 'center' },
  vs:    { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  stadium: { fontSize: 11, fontWeight: '400' },
});

// ── Sponsors slider continuo ──────────────────────────────────
const SPONSORS = [
  { id: 's1', source: require('../../images/ezviz-seeklogo.png'),     name: 'EZVIZ'   },
  { id: 's2', source: require('../../images/KANY.png'),               name: 'KANY'    },
  { id: 's3', source: require('../../images/PANTUM_ROJO.png'),        name: 'PANTUM'  },
  { id: 's4', source: require('../../images/PCBOX.png'),              name: 'PCBOX'   },
  // duplicados para loop infinito visual
  { id: 's5', source: require('../../images/ezviz-seeklogo.png'),     name: 'EZVIZ2'  },
  { id: 's6', source: require('../../images/KANY.png'),               name: 'KANY2'   },
  { id: 's7', source: require('../../images/PANTUM_ROJO.png'),        name: 'PANTUM2' },
  { id: 's8', source: require('../../images/PCBOX.png'),              name: 'PCBOX2'  },
];

const LOGO_W   = 100;
const LOGO_H   = 52;
const LOGO_GAP = 20;
const LOOP_W   = (LOGO_W + LOGO_GAP) * 4; // ancho de un ciclo (4 logos reales)

function SponsorsSlider({ theme }: { theme: any }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const anim       = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const run = () => {
      translateX.setValue(0);
      anim.current = Animated.loop(
        Animated.timing(translateX, {
          toValue: -LOOP_W,
          duration: 9000,
          useNativeDriver: true,
        }),
      );
      anim.current.start();
    };
    run();
    return () => anim.current?.stop();
  }, []);

  return (
    <View style={spS.wrapper}>
      <Text style={[spS.label, { color: theme.colors.muted }]}>Sponsors oficiales</Text>
      <View style={spS.track}>
        <Animated.View
          style={[spS.row, { transform: [{ translateX }] }]}
        >
          {SPONSORS.map((s) => (
            <View
              key={s.id}
              style={[
                spS.logoBox,
                {
                  backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#fff',
                  borderColor: theme.isDark ? 'rgba(110,198,255,0.12)' : 'rgba(110,198,255,0.18)',
                },
              ]}
            >
              <Image
                source={s.source}
                style={spS.logo}
                resizeMode="contain"
              />
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const spS = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  track: { overflow: 'hidden', height: LOGO_H + 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LOGO_GAP,
    paddingVertical: 8,
  },
  logoBox: {
    width: LOGO_W,
    height: LOGO_H,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: CELESTE,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  logo: { width: LOGO_W - 20, height: LOGO_H - 12 },
});

// ── Pantalla principal ────────────────────────────────────────
export default function AppHomeScreen() {
  const router    = useRouter();
  const { theme } = useAppTheme();
  const { user }  = useAuth();

  if (!user) return null;

  const greeting  = getGreeting();
  const firstName = user.nombre?.split(' ')[0] ?? 'Hola';
  const initials  = (user.nombre ?? 'U').substring(0, 2).toUpperCase();
  const upcoming  = getUpcomingMatches(3);
  const bg        = theme.isDark ? '#0D0D0D' : '#F5F7FA';

  return (
    <Screen style={{ backgroundColor: bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        {/* ── Header ──────────────────────────────────────── */}
        <FadeSlide delay={0}>
          {/* Logo GrupoNúcleo */}
          <View style={[hdr.logoRow, { backgroundColor: bg }]}>
            <Image
              source={theme.isDark
                ? require('../../images/icononucleo.png')
                : require('../../images/icononucleo-light.png')}
              style={hdr.logo}
              resizeMode="contain"
            />
          </View>
          <View style={[hdr.wrapper, { backgroundColor: bg }]}>
            <View>
              <Text style={[hdr.greeting, { color: theme.colors.muted }]}>{greeting} 👋</Text>
              <Text style={[hdr.name, { color: theme.colors.text }]}>{firstName}</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(app)/perfil')}
              style={hdr.avatarBtn}
            >
              <LinearGradient
                colors={[CELESTE_DARK, DEEP_BLUE]}
                style={hdr.avatarGrad}
              >
                <Text style={hdr.avatarText}>{initials}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </FadeSlide>

        <View style={{ paddingHorizontal: 16, gap: 24 }}>

          {/* ── Banner carrusel ─────────────────────────── */}
          <FadeSlide delay={60}>
            <WCBanner />
          </FadeSlide>

          {/* ── Botón pronósticos ────────────────────────── */}
          <FadeSlide delay={120}>
            <Pressable
              onPress={() => router.push('/(app)/pronosticos')}
              style={({ pressed }) => [predBtn.wrapper, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={[CELESTE_DARK, DEEP_BLUE]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={predBtn.gradient}
              >
                {/* Decoración */}
                <View style={predBtn.circle} />
                <View style={predBtn.circleSmall} />

                <View style={predBtn.left}>
                  <Text style={predBtn.emoji}>🎯</Text>
                  <View>
                    <Text style={predBtn.title}>Hacer predicción</Text>
                    <Text style={predBtn.sub}>Predecí los resultados del Mundial</Text>
                  </View>
                </View>
                <View style={predBtn.arrow}>
                  <Feather name="chevron-right" size={22} color="#fff" />
                </View>
              </LinearGradient>
            </Pressable>
          </FadeSlide>

          {/* ── Sponsors slider ──────────────────────────── */}
          <FadeSlide delay={150}>
            <SponsorsSlider theme={theme} />
          </FadeSlide>

          {/* ── Próximos partidos ────────────────────────── */}
          <FadeSlide delay={180}>
            <View style={sec.header}>
              <Text style={[sec.title, { color: theme.colors.text }]}>⚽  Próximos partidos</Text>
              <Pressable onPress={() => router.push('/(app)/fixture')}>
                <Text style={[sec.link, { color: CELESTE_DARK }]}>Ver fixture</Text>
              </Pressable>
            </View>
            {upcoming.map((m) => (
              <UpcomingMatchCard
                key={m.id}
                match={m}
                onPress={() => router.push({
                  pathname: '/(app)/details/detalle-partido',
                  params: { matchId: m.id },
                })}
              />
            ))}
          </FadeSlide>

        </View>
      </ScrollView>
    </Screen>
  );
}

// ── Estilos header ─────────────────────────────────────────────
const hdr = StyleSheet.create({
  logoRow: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 4,
  },
  logo: {
    width: 140,
    height: 40,
  },
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  greeting: { fontSize: 13, fontWeight: '500' },
  name:     { fontSize: 24, fontWeight: '800', marginTop: 2 },
  avatarBtn: {
    shadowColor: CELESTE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarGrad: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// ── Botón pronósticos ──────────────────────────────────────────
const predBtn = StyleSheet.create({
  wrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: DEEP_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    top: -40,
    right: -20,
  },
  circleSmall: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    top: 10,
    right: 60,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  emoji:  { fontSize: 36 },
  title:  { color: '#fff', fontSize: 18, fontWeight: '800' },
  sub:    { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Sección ────────────────────────────────────────────────────
const sec = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '800' },
  link:  { fontSize: 13, fontWeight: '600' },
});
