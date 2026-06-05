/**
 * Pantalla Pronósticos — Prode Mundial 2026
 * Datos reales desde Supabase (tabla predictions)
 * Lock: 10 minutos antes del partido
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '../../src/components/Screen';
import { useAllFixtures } from '../../src/hooks/useApiFootball';
import { usePredictions, useUpsertPrediction } from '../../src/features/content/api/predictions';
import type { NormalizedMatch } from '../../src/services/apiFootball.types';
import { fixtures } from '../../src/features/mockData';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { getFlagEmoji } from '../../src/theme/theme';

const CELESTE       = '#6EC6FF';
const CELESTE_LIGHT = '#DDF4FF';
const CELESTE_DARK  = '#3DA5F5';
const LOCK_MINUTES  = 10;

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
  matchDate?: Date;
};

// ── Logo con fallback ─────────────────────────────────────────
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

// ── Formatear fecha ───────────────────────────────────────────
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

// ── Card de partido ───────────────────────────────────────────
type CardProps = {
  match: MatchEntry;
  savedHome?: string;
  savedAway?: string;
  isLocked: boolean;
  isSaving: boolean;
  onSave: (fixtureId: number, home: number, away: number) => void;
};

function MatchCard({ match, savedHome, savedAway, isLocked, isSaving, onSave }: CardProps) {
  const { theme } = useAppTheme();
  const [home, setHome] = useState(savedHome ?? '');
  const [away, setAway] = useState(savedAway ?? '');
  const hasSaved = savedHome !== undefined;
  const canSave  = home !== '' && away !== '' && !isLocked && !isSaving;

  useEffect(() => {
    setHome(savedHome ?? '');
    setAway(savedAway ?? '');
  }, [savedHome, savedAway]);

  return (
    <View style={[card.container, { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.07)' }]}>
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
          {!hasSaved && !isLocked ? (
            <>
              <TextInput
                style={[card.input, { backgroundColor: '#F5F7FA', borderColor: 'rgba(0,0,0,0.12)', color: theme.colors.text }]}
                value={home}
                onChangeText={(v) => setHome(v.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="-"
                placeholderTextColor={theme.colors.muted}
                textAlign="center"
              />
              <Text style={[card.vs, { color: theme.colors.muted }]}>vs</Text>
              <TextInput
                style={[card.input, { backgroundColor: '#F5F7FA', borderColor: 'rgba(0,0,0,0.12)', color: theme.colors.text }]}
                value={away}
                onChangeText={(v) => setAway(v.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="-"
                placeholderTextColor={theme.colors.muted}
                textAlign="center"
              />
            </>
          ) : (
            <>
              <View style={[card.savedInput, { backgroundColor: '#F5F7FA', borderColor: 'rgba(0,0,0,0.12)' }]}>
                <Text style={[card.savedNum, { color: theme.colors.text }]}>{savedHome ?? '-'}</Text>
              </View>
              <Text style={[card.vs, { color: theme.colors.muted }]}>vs</Text>
              <View style={[card.savedInput, { backgroundColor: '#F5F7FA', borderColor: 'rgba(0,0,0,0.12)' }]}>
                <Text style={[card.savedNum, { color: theme.colors.text }]}>{savedAway ?? '-'}</Text>
              </View>
            </>
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

      {isLocked ? (
        <View style={[card.lockedFooter, { borderTopColor: 'rgba(0,0,0,0.06)' }]}>
          <Ionicons name="lock-closed" size={14} color={theme.colors.muted} />
          <Text style={[card.lockedText, { color: theme.colors.muted }]}>
            Las predicciones para este partido ya fueron cerradas.
          </Text>
        </View>
      ) : hasSaved ? (
        <View style={[card.savedFooter, { borderTopColor: 'rgba(0,0,0,0.06)' }]}>
          <Text style={[card.savedLabel, { color: theme.colors.textSecondary }]}>
            Tu resultado:{' '}
            <Text style={[card.savedScore, { color: theme.colors.text }]}>
              {savedHome} - {savedAway}
            </Text>
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={() => canSave && onSave(match.fixtureId, Number(home), Number(away))}
          disabled={!canSave}
          style={[card.saveBtn, { backgroundColor: canSave ? CELESTE_DARK : '#E5E7EB' }]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[card.saveBtnText, { color: canSave ? '#fff' : '#9CA3AF' }]}>
              Guardar predicción
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const card = StyleSheet.create({
  container:    { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12 },
  group:        { fontSize: 13, fontWeight: '700' },
  time:         { fontSize: 13, fontWeight: '600' },
  body:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 16 },
  teamCol:      { flex: 1, alignItems: 'center', gap: 8 },
  logoBox:      { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  teamName:     { fontSize: 12, fontWeight: '500', textAlign: 'center', maxWidth: 90, lineHeight: 16 },
  scoreRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  input:        { width: 48, height: 48, borderRadius: 10, borderWidth: 1.5, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  vs:           { fontSize: 12, fontWeight: '600', width: 20, textAlign: 'center' },
  savedInput:   { width: 48, height: 48, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  savedNum:     { fontSize: 20, fontWeight: '700' },
  saveBtn:      { marginHorizontal: 14, marginBottom: 14, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  saveBtnText:  { fontSize: 14, fontWeight: '700' },
  savedFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  savedLabel:   { fontSize: 13, fontWeight: '500' },
  savedScore:   { fontWeight: '800' },
  lockedFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  lockedText:   { fontSize: 12, fontWeight: '500', flex: 1 },
});

// ── Pantalla principal ────────────────────────────────────────
export default function PronosticosScreen() {
  const { theme }  = useAppTheme();
  const { user }   = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('PENDIENTES');
  const [savingId, setSavingId]   = useState<number | null>(null);

  const { data: apiMatches } = useAllFixtures();
  const { data: predictions, refetch: refetchPredictions } = usePredictions(user?.cliente_id);
  const upsert = useUpsertPrediction();

  // Mapa fixture_id → predicción
  const savedMap = React.useMemo(() => {
    const m: Record<number, { home: string; away: string }> = {};
    for (const p of predictions ?? []) {
      m[p.fixture_id] = {
        home: String(p.score_home ?? ''),
        away: String(p.score_away ?? ''),
      };
    }
    return m;
  }, [predictions]);

  // Normalizar partidos
  const allMatches: MatchEntry[] = React.useMemo(() => {
    if (apiMatches && apiMatches.length > 0) {
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
        matchDate: new Date(`${m.isoDate}T${m.time}:00`),
      }));
    }
    return fixtures.map((m): MatchEntry => ({
      id:        m.id,
      fixtureId: parseInt(m.id, 10) || 0,
      homeTeam:  m.homeTeam,
      awayTeam:  m.awayTeam,
      homeCode:  m.homeCode,
      awayCode:  m.awayCode,
      group:     m.group,
      phase:     m.phase,
      time:      m.time,
      date:      m.date,
      isoDate:   m.isoDate,
      matchDate: new Date(`${m.isoDate}T${m.time}:00`),
    }));
  }, [apiMatches]);

  const isLocked = (match: MatchEntry): boolean => {
    if (!match.matchDate) return false;
    const lockTime = match.matchDate.getTime() - LOCK_MINUTES * 60 * 1000;
    return Date.now() >= lockTime;
  };

  const pendingMatches   = allMatches.filter((m) => !savedMap[m.fixtureId]);
  const completedMatches = allMatches.filter((m) => !!savedMap[m.fixtureId]);
  const currentMatches   = activeTab === 'PENDIENTES' ? pendingMatches : completedMatches;
  const sections         = groupByDate(currentMatches);

  const handleSave = useCallback(
    async (fixtureId: number, home: number, away: number) => {
      if (!user) return;
      setSavingId(fixtureId);
      try {
        await upsert.mutateAsync({
          user_id:     String(user.id),
          cliente_id:  user.cliente_id ?? String(user.id),
          fixture_id:  fixtureId,
          pick_winner: home > away ? 'home' : home < away ? 'away' : 'draw',
          score_home:  home,
          score_away:  away,
        });
        await refetchPredictions();
      } catch (e: any) {
        console.error('[Pronosticos] Error guardando:', e?.message);
      } finally {
        setSavingId(null);
      }
    },
    [user, upsert, refetchPredictions],
  );

  return (
    <Screen style={{ backgroundColor: '#F5F7FA' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

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
            Los pronósticos se cierran {LOCK_MINUTES} minutos antes de cada partido
          </Text>
        </View>

        {sections.length === 0 ? (
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
            keyboardShouldPersistTaps="handled"
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
                isLocked={isLocked(item)}
                isSaving={savingId === item.fixtureId}
                onSave={handleSave}
              />
            )}
          />
        )}
      </KeyboardAvoidingView>
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
