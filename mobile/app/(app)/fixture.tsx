/**
 * Fixture — datos 100% desde football-data.org vía proxy Supabase
 * Supabase solo se usa para guardar predicciones, no para partidos
 */
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '../../src/components/Screen';
import { useAllFixtures } from '../../src/hooks/useApiFootball';
import { usePredictions } from '../../src/features/content/api/predictions';
import type { NormalizedMatch } from '../../src/services/apiFootball.types';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { getFlagEmoji } from '../../src/theme/theme';
import { fixtureGroups } from '../../src/features/mockData';

const CELESTE      = '#6EC6FF';
const CELESTE_DARK = '#3DA5F5';
const CELESTE_BG   = '#EBF5FF';

const PHASES = ['Fase de Grupos', 'Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinales', 'Final'] as const;
type Phase = typeof PHASES[number];

// ── Logo de equipo con fallback emoji ─────────────────────────
function TeamLogo({ logo, code, size = 44 }: { logo: string; code: string; size?: number }) {
  const [failed, setFailed] = useState(false);
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
  return <Text style={{ fontSize: size * 0.75, lineHeight: size }}>{getFlagEmoji(code)}</Text>;
}

// ── Tarjeta de partido ────────────────────────────────────────
function MatchRow({
  match,
  myPick,
  onPress,
}: {
  match: NormalizedMatch;
  myPick?: string;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();

  const statusColor = match.isLive ? '#22c55e' : match.isFinished ? theme.colors.muted : theme.colors.textSecondary;
  const centerLabel = match.isLive
    ? `⚡ ${match.elapsed ?? 0}'`
    : match.isFinished
    ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}`
    : match.time;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.matchRow,
        {
          backgroundColor: theme.colors.surface,
          borderColor: match.isLive ? '#22c55e' : theme.colors.border,
          borderWidth: match.isLive ? 1.5 : 1,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      {/* Local */}
      <View style={styles.teamSide}>
        <TeamLogo logo={match.homeLogo} code={match.homeCode} size={44} />
        <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={2}>
          {match.homeTeam}
        </Text>
      </View>

      {/* Centro */}
      <View style={styles.centerBlock}>
        <Text style={[styles.centerLabel, { color: match.isLive ? '#22c55e' : theme.colors.text }]}>
          {centerLabel}
        </Text>
        {!match.isFinished && !match.isLive && (
          <Text style={[styles.dateLabel, { color: theme.colors.muted }]}>{match.date}</Text>
        )}
        {match.isFinished && (
          <Text style={[styles.statusFT, { color: theme.colors.muted }]}>FT</Text>
        )}
        {myPick && (
          <Text style={[styles.myPick, { color: CELESTE_DARK }]}>🎯 {myPick}</Text>
        )}
      </View>

      {/* Visitante */}
      <View style={[styles.teamSide, styles.teamSideRight]}>
        <TeamLogo logo={match.awayLogo} code={match.awayCode} size={44} />
        <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={2}>
          {match.awayTeam}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Pantalla principal ────────────────────────────────────────
export default function FixtureScreen() {
  const router   = useRouter();
  const { theme } = useAppTheme();
  const { user }  = useAuth();

  const [selectedPhase, setSelectedPhase] = useState<Phase>('Fase de Grupos');
  const [selectedGroup, setSelectedGroup] = useState('Grupo A');
  const isGroupPhase = selectedPhase === 'Fase de Grupos';

  // Datos de partidos desde la API (football-data.org)
  const { data: apiMatches, isLoading, isError, error, refetch, isFetching } = useAllFixtures();

  // Pronósticos del usuario desde Supabase
  const { data: predictions } = usePredictions(user?.cliente_id);
  const predMap = useMemo(() => {
    const m: Record<number, string> = {};
    for (const p of predictions ?? []) {
      const label = p.pick_winner === 'home' ? 'Local' : p.pick_winner === 'away' ? 'Visitante' : 'Empate';
      m[p.fixture_id] = `${label} ${p.score_home ?? '?'}–${p.score_away ?? '?'}`;
    }
    return m;
  }, [predictions]);

  // Filtrar por fase y grupo
  const matches = useMemo<NormalizedMatch[]>(() => {
    if (!apiMatches) return [];
    return apiMatches.filter(m => {
      if (m.phase !== selectedPhase) return false;
      if (isGroupPhase && m.group !== selectedGroup) return false;
      return true;
    });
  }, [apiMatches, selectedPhase, selectedGroup, isGroupPhase]);

  const hasApiKey = !!(process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN);

  return (
    <Screen style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={CELESTE_DARK}
            colors={[CELESTE_DARK]}
          />
        }
      >
        {/* Sticky header */}
        <View style={[styles.stickyHeader, { backgroundColor: theme.colors.background }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.pageTitle, { color: theme.colors.text }]}>⚽ Fixture 2026</Text>
            {!hasApiKey && (
              <View style={[styles.demoBadge, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Text style={[styles.demoText, { color: theme.colors.muted }]}>Sin API</Text>
              </View>
            )}
          </View>

          {/* Tabs de fase */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {PHASES.map(phase => {
              const active = phase === selectedPhase;
              return (
                <Pressable
                  key={phase}
                  onPress={() => setSelectedPhase(phase)}
                  style={[
                    styles.phaseTab,
                    { backgroundColor: active ? CELESTE_DARK : theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' },
                  ]}
                >
                  <Text style={[styles.phaseTabText, { color: active ? '#fff' : theme.colors.muted }]}>
                    {phase}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Sub-tabs de grupo */}
          {isGroupPhase && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
              {fixtureGroups.map(group => {
                const active = group === selectedGroup;
                return (
                  <Pressable
                    key={group}
                    onPress={() => setSelectedGroup(group)}
                    style={[
                      styles.groupTab,
                      {
                        backgroundColor: active ? (theme.isDark ? 'rgba(61,165,245,0.18)' : 'rgba(61,165,245,0.10)') : 'transparent',
                        borderColor: active ? CELESTE_DARK : theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.groupTabText, { color: active ? CELESTE_DARK : theme.colors.textSecondary }]}>
                      {group.replace('Grupo ', '')}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Contenido */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={CELESTE_DARK} />
              <Text style={[styles.stateText, { color: theme.colors.muted }]}>Cargando partidos…</Text>
            </View>
          ) : isError ? (
            <View style={styles.centerState}>
              <Text style={{ fontSize: 36 }}>⚠️</Text>
              <Text style={[styles.stateText, { color: theme.colors.muted }]}>
                Error cargando fixture:{'\n'}
                {(error as Error)?.message ?? 'Sin conexión a la API'}
              </Text>
              <Pressable onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: CELESTE_DARK }]}>
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.centerState}>
              <Text style={{ fontSize: 40 }}>🏆</Text>
              <Text style={[styles.stateText, { color: theme.colors.muted }]}>
                {isGroupPhase
                  ? `Sin partidos para ${selectedGroup}`
                  : 'Los partidos de esta fase se definirán durante el torneo'}
              </Text>
            </View>
          ) : (
            matches.map(match => (
              <MatchRow
                key={match.id}
                match={match}
                myPick={predMap[match.id]}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/details/detalle-partido',
                    params: { matchId: String(match.id) },
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen:        { paddingBottom: 0 },
  scrollContent: { paddingBottom: 120 },
  stickyHeader:  { paddingTop: 6, paddingBottom: 12, paddingHorizontal: 16, gap: 10 },
  titleRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageTitle:     { fontSize: 24, fontWeight: '800' },
  demoBadge:     { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  demoText:      { fontSize: 11, fontWeight: '700' },
  tabsRow:       { gap: 8, paddingVertical: 2 },
  phaseTab:      { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 6 },
  phaseTabText:  { fontSize: 13, fontWeight: '700' },
  groupTab:      { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, marginRight: 6 },
  groupTabText:  { fontSize: 13, fontWeight: '700' },
  listContainer: { paddingHorizontal: 16, paddingTop: 8 },

  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  teamSide:      { flex: 1, alignItems: 'center', gap: 6 },
  teamSideRight: {},
  teamName:      { fontSize: 12, fontWeight: '700', textAlign: 'center', maxWidth: 90 },
  centerBlock:   { width: 76, alignItems: 'center', gap: 3 },
  centerLabel:   { fontSize: 16, fontWeight: '800' },
  dateLabel:     { fontSize: 11, fontWeight: '500' },
  statusFT:      { fontSize: 11, fontWeight: '700' },
  myPick:        { fontSize: 10, fontWeight: '600', marginTop: 2 },

  centerState: { alignItems: 'center', paddingVertical: 60, gap: 14 },
  stateText:   { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 30 },
  retryBtn:    { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, marginTop: 4 },
  retryBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
});
