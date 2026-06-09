/**
 * Pantalla Pronósticos — Prode Mundial 2026
 * Lista de partidos → pantalla de pronóstico por partido
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '../../src/components/Screen';
import { useAllFixtures } from '../../src/hooks/useApiFootball';
import { usePredictions, usePredictionsRealtime } from '../../src/features/content/api/predictions';
import type { NormalizedMatch } from '../../src/services/apiFootball.types';
import { FOOTBALL_DATA_ERROR_MSG } from '../../src/services/footballData';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { getFlagEmoji } from '../../src/theme/theme';
import {
  buildMatchDate,
  isPredictionLocked,
  PREDICTION_LOCK_MINUTES,
  PREDICTION_LOCKED_MESSAGE,
} from '../../src/utils/predictionLock';

const CELESTE       = '#6EC6FF';
const CELESTE_LIGHT = '#DDF4FF';
const CELESTE_DARK  = '#3DA5F5';

type Tab = 'PENDIENTES' | 'COMPLETADOS';

type MatchEntry = {
  id: string;
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
  homeLogo?: string;
  awayLogo?: string;
  group?: string;
  phase: string;
  time: string;
  date: string;
  isoDate: string;
  matchDate: Date;
};

function TeamLogo({ logo, code, size = 52 }: { logo?: string; code: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const emoji = getFlagEmoji(code);
  if (logo && !failed) {
    return (
      <Image
        source={{ uri: logo }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    );
  }
  return <Text style={{ fontSize: size * 0.75, lineHeight: size }}>{emoji}</Text>;
}

const MONTHS: Record<string, string> = { Jun: 'junio', Jul: 'julio', Ago: 'agosto' };
function formatDateLabel(date: string): string {
  const [d, m] = date.split(' ');
  return `${d} de ${MONTHS[m] ?? m?.toLowerCase() ?? ''}`;
}

function groupByDate(matches: MatchEntry[]) {
  const map = new Map<string, MatchEntry[]>();
  for (const m of matches) {
    const label = formatDateLabel(m.date);
    map.set(label, [...(map.get(label) ?? []), m]);
  }
  return Array.from(map.entries())
    .sort(([, a], [, b]) => (a[0]?.isoDate ?? '').localeCompare(b[0]?.isoDate ?? ''))
    .map(([title, data]) => ({ title, data }));
}

type CardProps = {
  match: MatchEntry;
  savedHome?: string;
  savedAway?: string;
  isLocked: boolean;
  onPress: () => void;
};

function MatchCard({ match, savedHome, savedAway, isLocked, onPress }: CardProps) {
  const { theme } = useAppTheme();
  const hasSaved = savedHome !== undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        card.container,
        { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.07)', opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={card.header}>
        <Text style={[card.group, { color: theme.colors.text }]}>{match.group ?? match.phase}</Text>
        <Text style={[card.time, { color: isLocked ? theme.colors.error : theme.colors.textSecondary }]}>
          {isLocked ? '🔒 Cerrado' : match.time}
        </Text>
      </View>

      <View style={card.body}>
        <View style={card.teamCol}>
          <View style={card.logoBox}>
            <TeamLogo logo={match.homeLogo} code={match.homeCode} size={52} />
          </View>
          <Text style={[card.teamName, { color: theme.colors.text }]} numberOfLines={2}>
            {match.homeTeam}
          </Text>
        </View>

        <View style={card.scoreRow}>
          {hasSaved ? (
            <>
              <Text style={[card.savedNum, { color: theme.colors.text }]}>{savedHome}</Text>
              <Text style={[card.vs, { color: theme.colors.muted }]}>vs</Text>
              <Text style={[card.savedNum, { color: theme.colors.text }]}>{savedAway}</Text>
            </>
          ) : (
            <Text style={[card.pendingLabel, { color: theme.colors.muted }]}>Sin pronóstico</Text>
          )}
        </View>

        <View style={card.teamCol}>
          <View style={card.logoBox}>
            <TeamLogo logo={match.awayLogo} code={match.awayCode} size={52} />
          </View>
          <Text style={[card.teamName, { color: theme.colors.text }]} numberOfLines={2}>
            {match.awayTeam}
          </Text>
        </View>
      </View>

      <View style={[card.footer, { borderTopColor: 'rgba(0,0,0,0.06)' }]}>
        {isLocked ? (
          <View style={card.footerRow}>
            <Ionicons name="lock-closed" size={14} color={theme.colors.muted} />
            <Text style={[card.footerText, { color: theme.colors.muted }]} numberOfLines={2}>
              {PREDICTION_LOCKED_MESSAGE}
            </Text>
          </View>
        ) : hasSaved ? (
          <View style={card.footerRow}>
            <Text style={[card.footerText, { color: theme.colors.textSecondary }]}>
              Tu resultado:{' '}
              <Text style={{ fontWeight: '800', color: theme.colors.text }}>
                {savedHome} - {savedAway}
              </Text>
            </Text>
            <Ionicons name="chevron-forward" size={18} color={CELESTE_DARK} />
          </View>
        ) : (
          <View style={card.footerRow}>
            <Text style={[card.ctaText, { color: CELESTE_DARK }]}>Hacer pronóstico</Text>
            <Ionicons name="chevron-forward" size={18} color={CELESTE_DARK} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const card = StyleSheet.create({
  container:     { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12 },
  group:         { fontSize: 13, fontWeight: '700' },
  time:          { fontSize: 13, fontWeight: '600' },
  body:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 16 },
  teamCol:       { flex: 1, alignItems: 'center', gap: 8 },
  logoBox:       { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  teamName:      { fontSize: 12, fontWeight: '500', textAlign: 'center', maxWidth: 90, lineHeight: 16 },
  scoreRow:      { alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8, minWidth: 88 },
  vs:            { fontSize: 12, fontWeight: '600' },
  savedNum:      { fontSize: 22, fontWeight: '800' },
  pendingLabel:  { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  footer:        { paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: 1 },
  footerRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  footerText:    { fontSize: 12, fontWeight: '500', flex: 1, lineHeight: 17 },
  ctaText:       { fontSize: 13, fontWeight: '700', flex: 1 },
});

export default function PronosticosScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('PENDIENTES');

  const { data: apiMatches, isLoading: fixturesLoading, isError: fixturesError, refetch: refetchFixtures } = useAllFixtures();
  const { data: predictions } = usePredictions(user?.cliente_id);
  usePredictionsRealtime();

  const savedMap = useMemo(() => {
    const m: Record<number, { home: string; away: string }> = {};
    for (const p of predictions ?? []) {
      m[p.fixture_id] = {
        home: String(p.score_home ?? ''),
        away: String(p.score_away ?? ''),
      };
    }
    return m;
  }, [predictions]);

  const allMatches: MatchEntry[] = useMemo(() => {
    if (!apiMatches) return [];
    return (apiMatches as NormalizedMatch[]).map((m): MatchEntry => ({
      id:        String(m.id),
      fixtureId: m.id,
      homeTeam:  m.homeTeam,
      awayTeam:  m.awayTeam,
      homeCode:  m.homeCode,
      awayCode:  m.awayCode,
      homeLogo:  m.homeLogo ?? undefined,
      awayLogo:  m.awayLogo ?? undefined,
      group:     m.group ?? undefined,
      phase:     m.phase,
      time:      m.time,
      date:      m.date,
      isoDate:   m.isoDate,
      matchDate: buildMatchDate(m.isoDate, m.time),
    }));
  }, [apiMatches]);

  const pendingMatches   = allMatches.filter((m) => !savedMap[m.fixtureId]);
  const completedMatches = allMatches.filter((m) => !!savedMap[m.fixtureId]);
  const currentMatches   = activeTab === 'PENDIENTES' ? pendingMatches : completedMatches;
  const sections         = groupByDate(currentMatches);

  const openMatch = (fixtureId: number) => {
    router.push({
      pathname: '/(app)/details/pronostico-partido',
      params: { fixtureId: String(fixtureId) },
    });
  };

  return (
    <Screen style={{ backgroundColor: '#F5F7FA' }}>
      <View style={[scr.topBar, { backgroundColor: '#F5F7FA' }]}>
        <Text style={[scr.title, { color: theme.colors.text }]}>Pronósticos</Text>
      </View>

      <View style={[scr.tabsWrapper, { backgroundColor: '#F5F7FA' }]}>
        <View style={[scr.tabsRow, { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.08)' }]}>
          {(['PENDIENTES', 'COMPLETADOS'] as Tab[]).map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[scr.tab, active && { borderColor: CELESTE, backgroundColor: '#fff' }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                {tab === 'COMPLETADOS' && (
                  <View style={[scr.tabDot, {
                    backgroundColor: completedMatches.length > 0 ? '#22C55E' : theme.colors.muted,
                  }]} />
                )}
                <Text style={[scr.tabText, {
                  color: active ? '#1D1D1D' : theme.colors.muted,
                  fontWeight: active ? '700' : '500',
                }]}>
                  {tab === 'PENDIENTES'
                    ? 'Pendientes'
                    : `Completados${completedMatches.length > 0 ? ` (${completedMatches.length})` : ''}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[scr.infoBanner, { backgroundColor: CELESTE_LIGHT, borderColor: 'rgba(110,198,255,0.4)', marginHorizontal: 16, marginBottom: 4 }]}>
        <Ionicons name="information-circle-outline" size={16} color={CELESTE} />
        <Text style={[scr.infoText, { color: '#0F4C81' }]}>
          Los pronósticos se cierran {PREDICTION_LOCK_MINUTES} minutos antes de cada partido
        </Text>
      </View>

      {fixturesLoading ? (
        <View style={scr.empty}>
          <ActivityIndicator size="large" color={CELESTE_DARK} />
          <Text style={[scr.emptyTitle, { color: theme.colors.muted }]}>Cargando partidos…</Text>
        </View>
      ) : fixturesError ? (
        <View style={scr.empty}>
          <Text style={scr.emptyEmoji}>⚠️</Text>
          <Text style={[scr.emptyTitle, { color: theme.colors.text }]}>{FOOTBALL_DATA_ERROR_MSG}</Text>
          <Pressable
            onPress={() => refetchFixtures()}
            style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: CELESTE_DARK }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar</Text>
          </Pressable>
        </View>
      ) : sections.length === 0 ? (
        <View style={scr.empty}>
          <Text style={scr.emptyEmoji}>{activeTab === 'COMPLETADOS' ? '🎯' : '⚽'}</Text>
          <Text style={[scr.emptyTitle, { color: theme.colors.text }]}>
            {activeTab === 'COMPLETADOS'
              ? 'Todavía no guardaste ningún pronóstico'
              : 'No hay partidos disponibles'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={[scr.dateHeader, { color: theme.colors.text }]}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              savedHome={savedMap[item.fixtureId]?.home}
              savedAway={savedMap[item.fixtureId]?.away}
              isLocked={isPredictionLocked(item.matchDate)}
              onPress={() => openMatch(item.fixtureId)}
            />
          )}
        />
      )}
    </Screen>
  );
}

const scr = StyleSheet.create({
  topBar:     { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title:      { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  tabsWrapper:{ paddingHorizontal: 16, paddingBottom: 10 },
  tabsRow:    { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  tab:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent' },
  tabDot:     { width: 7, height: 7, borderRadius: 4 },
  tabText:    { fontSize: 14 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  infoText:   { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  dateHeader: { fontSize: 15, fontWeight: '700', marginTop: 16, marginBottom: 10 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
});
