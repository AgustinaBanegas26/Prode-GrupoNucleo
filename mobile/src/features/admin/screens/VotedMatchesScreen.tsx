import React, { useMemo, useRef, useEffect, useState } from 'react';
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
import { fixtures, fixturePhases, makeMatchLabel, type MatchPhase } from '../../mockData';

const DORADO = '#F59E0B';
const ROJO   = '#ef4444';

type VoteRow = { id: string; label: string; phase: MatchPhase; votes: number };

function hashVotes(input: string) {
  let n = 0;
  for (let i = 0; i < input.length; i += 1) n = (n * 31 + input.charCodeAt(i)) % 1000;
  return 50 + (n % 450);
}

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

function AnimatedBar({ pct, accent, isDark }: { pct: number; accent: string; isDark: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 700, useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={[b.track, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
      <Animated.View style={[{ width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]}>
        <LinearGradient colors={[accent, accent + '66']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={b.fill} />
      </Animated.View>
    </View>
  );
}
const b = StyleSheet.create({
  track: { height: 8, borderRadius: 99, overflow: 'hidden' },
  fill:  { height: 8, borderRadius: 99 },
});

function rankColor(pos: number) {
  if (pos === 1) return DORADO;
  if (pos === 2) return '#94A3B8';
  if (pos === 3) return '#CD7F32';
  return 'rgba(128,128,128,0.4)';
}

export function VotedMatchesScreen() {
  const { theme } = useAppTheme();
  const isDark = theme.isDark;
  const router = useRouter();
  const [phase, setPhase] = useState<MatchPhase | 'all'>('all');

  const rows = useMemo<VoteRow[]>(() => {
    return fixtures
      .filter((m) => (phase === 'all' ? true : m.phase === phase))
      .map<VoteRow>((m) => ({
        id:    m.id,
        label: makeMatchLabel(m),
        phase: m.phase,
        votes: hashVotes(`${m.id}_${m.homeTeam}_${m.awayTeam}`),
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 20);
  }, [phase]);

  const maxVotes = Math.max(...rows.map((r) => r.votes), 1);

  const bg          = isDark ? '#0a0f0a' : '#fff1f2';
  const hFrom       = isDark ? '#7f1d1d' : '#b91c1c';
  const hTo         = isDark ? '#0a0f0a' : '#fff1f2';
  const textPrimary = isDark ? '#fff' : '#111';
  const textSub     = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const cardBg      = isDark ? 'rgba(255,255,255,0.04)' : '#fff';
  const cardBorder  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const rojoLight   = isDark ? ROJO : '#dc2626';

  return (
    <ScrollView style={[s.root, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[hFrom, hTo]} style={s.header}>
        <View style={s.circleL} />
        <FadeSlide delay={0}>
          <View style={s.headerRow}>
            <Pressable onPress={() => router.push('/(admin)')} style={s.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <LinearGradient colors={['#7f1d1d', '#450a0a']} style={s.iconGrad}>
              <MaterialCommunityIcons name="soccer" size={22} color={ROJO} />
            </LinearGradient>
            <View>
              <Text style={s.title}>Partidos más votados</Text>
              <Text style={s.sub}>Top {rows.length} · modo demo</Text>
            </View>
          </View>
        </FadeSlide>
      </LinearGradient>

      <View style={s.content}>
        {/* Filtros */}
        <FadeSlide delay={40}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
            {(['all', ...fixturePhases] as const).map((p) => {
              const active = phase === p;
              return (
                <Pressable key={p} onPress={() => setPhase(p)}
                  style={[s.filterBtn, {
                    borderColor: active ? rojoLight : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'),
                    backgroundColor: active ? (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(220,38,38,0.10)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  }]}>
                  <Text style={[s.filterTxt, { color: active ? rojoLight : textSub }]} numberOfLines={1}>
                    {p === 'all' ? '🏆 Todos' : p}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </FadeSlide>

        {/* Top 3 */}
        {rows.length >= 3 && (
          <FadeSlide delay={80}>
            <View style={s.topThreeRow}>
              {rows.slice(0, 3).map((r, idx) => {
                const accent = rankColor(idx + 1);
                const darkGrads: [string, string][] = [['#78350f', '#451a03'], ['#1e3a5f', '#0f2040'], ['#2d1a00', '#1a1000']];
                const lightGrads: [string, string][] = [['#fef3c7', '#fde68a'], ['#dbeafe', '#bfdbfe'], ['#fed7aa', '#fdba74']];
                const grad = isDark ? darkGrads[idx] : lightGrads[idx];
                return (
                  <LinearGradient key={r.id} colors={grad}
                    style={[s.topCard, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                    <Text style={{ fontSize: idx === 0 ? 28 : 22 }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </Text>
                    <Text style={[s.topLabel, { color: isDark ? '#fff' : '#111' }]} numberOfLines={2}>{r.label}</Text>
                    <Text style={[s.topVotes, { color: accent }]}>{r.votes}</Text>
                    <Text style={[s.topVotesLbl, { color: textSub }]}>votos</Text>
                  </LinearGradient>
                );
              })}
            </View>
          </FadeSlide>
        )}

        {/* Lista */}
        <View style={s.list}>
          {rows.map((r, idx) => {
            const pct    = Math.round((r.votes / maxVotes) * 100);
            const accent = idx === 0 ? DORADO : idx === 1 ? '#94A3B8' : idx === 2 ? '#CD7F32' : rojoLight;
            return (
              <FadeSlide key={r.id} delay={idx * 30}>
                <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={s.cardGrad}>
                    <Text style={[s.rank, { color: rankColor(idx + 1) }]}>{idx + 1}</Text>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={s.cardTop}>
                        <Text style={[s.matchLabel, { color: textPrimary }]} numberOfLines={1}>{r.label}</Text>
                        <Text style={[s.votes, { color: accent }]}>{r.votes}</Text>
                      </View>
                      <AnimatedBar pct={pct} accent={accent} isDark={isDark} />
                      <Text style={[s.phaseTxt, { color: textSub }]}>{r.phase}</Text>
                    </View>
                  </View>
                </View>
              </FadeSlide>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  header:   { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  circleL:  { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.20)', top: -60, right: -40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  iconGrad:  { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  title:     { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub:       { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  content:   { padding: 16, gap: 14 },
  filtersRow: { gap: 8, paddingVertical: 2 },
  filterBtn:  { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1 },
  filterTxt:  { fontSize: 12, fontWeight: '700' },
  topThreeRow: { flexDirection: 'row', gap: 8 },
  topCard:    { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 6, borderWidth: 1 },
  topLabel:   { fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 14 },
  topVotes:   { fontSize: 18, fontWeight: '800' },
  topVotesLbl: { fontSize: 9, fontWeight: '600' },
  list:       { gap: 8, paddingBottom: 40 },
  card:       { borderRadius: 16, borderWidth: 1 },
  cardGrad:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rank:       { width: 26, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  cardTop:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchLabel: { flex: 1, fontSize: 13, fontWeight: '700' },
  votes:      { fontSize: 16, fontWeight: '800' },
  phaseTxt:   { fontSize: 11, fontWeight: '500' },
});
