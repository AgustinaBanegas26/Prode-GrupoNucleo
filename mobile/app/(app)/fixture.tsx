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

import { AppHeader } from '../../src/components';
import { Screen } from '../../src/components/Screen';
import { useAllFixtures } from '../../src/hooks/useApiFootball';
import type { NormalizedMatch } from '../../src/services/apiFootball.types';
import {
  fixtureGroups,
  fixturePhases,
  getMatchesByGroup,
  getMatchesByPhase,
  type MatchPhase,
} from '../../src/features/mockData';
import { useAppTheme } from '../../src/providers/ThemeProvider';

// ── Fases para los tabs superiores ───────────────────────────
const PHASES = ['Fase de Grupos', 'Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinales', 'Final'] as const;
type Phase = typeof PHASES[number];

// ── Componente tarjeta de partido ─────────────────────────────
function MatchRow({ match, onPress }: { match: NormalizedMatch; onPress: () => void }) {
  const { theme } = useAppTheme();

  const statusColor =
    match.isLive     ? '#22c55e' :
    match.isFinished ? theme.colors.muted :
    theme.colors.textSecondary;

  const statusLabel =
    match.isLive     ? `⚡ ${match.elapsed ?? 0}'` :
    match.isFinished ? 'FT' :
    match.time;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.matchRow,
        {
          backgroundColor: theme.colors.surface,
          borderColor: match.isLive ? '#22c55e' : theme.colors.border,
          opacity: pressed ? 0.88 : 1,
          borderWidth: match.isLive ? 1.5 : 1,
        },
      ]}
    >
      {/* Equipo Local */}
      <View style={styles.teamSide}>
        {match.homeLogo ? (
          <Image source={{ uri: match.homeLogo }} style={styles.teamLogo} resizeMode="contain" />
        ) : (
          <View style={[styles.teamLogoPlaceholder, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={[styles.teamCodeText, { color: theme.colors.text }]}>{match.homeCode}</Text>
          </View>
        )}
        <Text style={[styles.teamName, { color: theme.colors.text }]} numberOfLines={2}>
          {match.homeTeam}
        </Text>
      </View>

      {/* Centro */}
      <View style={styles.centerBlock}>
        {match.isFinished || match.isLive ? (
          <Text style={[styles.score, { color: theme.colors.text }]}>
            {match.homeScore ?? 0}  –  {match.awayScore ?? 0}
          </Text>
        ) : (
          <Text style={[styles.time, { color: theme.colors.text }]}>{match.time}</Text>
        )}
        <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
        <Text style={[styles.dateLabel, { color: theme.colors.muted }]}>{match.date}</Text>
      </View>

      {/* Equipo Visitante */}
      <View style={[styles.teamSide, styles.teamSideRight]}>
        {match.awayLogo ? (
          <Image source={{ uri: match.awayLogo }} style={styles.teamLogo} resizeMode="contain" />
        ) : (
          <View style={[styles.teamLogoPlaceholder, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={[styles.teamCodeText, { color: theme.colors.text }]}>{match.awayCode}</Text>
          </View>
        )}
        <Text style={[styles.teamName, styles.teamNameRight, { color: theme.colors.text }]} numberOfLines={2}>
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

  const [selectedPhase, setSelectedPhase] = useState<Phase>('Fase de Grupos');
  const [selectedGroup, setSelectedGroup] = useState('Grupo A');

  const isGroupPhase = selectedPhase === 'Fase de Grupos';
  const hasApiKey    = !!(process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN &&
                          process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN.length > 10);

  // ── Datos desde la API ──────────────────────────────────────
  const { data: apiMatches, isLoading, isError, refetch, isFetching } = useAllFixtures();

  // ── Filtrado ────────────────────────────────────────────────
  const matches = useMemo<NormalizedMatch[]>(() => {
    if (hasApiKey && apiMatches && apiMatches.length > 0) {
      return apiMatches.filter((m) => {
        if (m.phase !== selectedPhase) return false;
        if (isGroupPhase && m.group !== selectedGroup) return false;
        return true;
      });
    }

    // Fallback: mockData
    const mockPhase = selectedPhase as MatchPhase;
    const mockItems = isGroupPhase
      ? getMatchesByGroup(selectedGroup)
      : getMatchesByPhase(mockPhase);

    return mockItems.map((m) => ({
      id:          parseInt(m.id, 10) || 0,
      homeTeam:    m.homeTeam,
      awayTeam:    m.awayTeam,
      homeLogo:    '',
      awayLogo:    '',
      homeCode:    m.homeCode,
      awayCode:    m.awayCode,
      homeScore:   null,
      awayScore:   null,
      date:        m.date,
      isoDate:     m.isoDate,
      time:        m.time,
      stadium:     m.stadium,
      city:        '',
      status:      'NS' as const,
      statusLong:  'Not Started',
      elapsed:     null,
      round:       m.group ?? selectedPhase,
      group:       m.group ?? null,
      phase:       selectedPhase,
      isLive:      false,
      isFinished:  false,
    }));
  }, [apiMatches, hasApiKey, selectedPhase, selectedGroup, isGroupPhase]);

  return (
    <Screen style={styles.screen}>
      <AppHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* ── Header sticky ─────────────────────────────────── */}
        <View style={[styles.stickyHeader, { backgroundColor: theme.colors.background }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.pageTitle, { color: theme.colors.text }]}>⚽ Fixture 2026</Text>
            {!hasApiKey && (
              <Text style={[styles.mockBadge, { backgroundColor: theme.colors.surfaceAlt, color: theme.colors.muted }]}>
                Demo
              </Text>
            )}
          </View>

          {/* Tabs de fase */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {PHASES.map((phase) => {
              const active = phase === selectedPhase;
              return (
                <Pressable
                  key={phase}
                  onPress={() => setSelectedPhase(phase)}
                  style={[
                    styles.phaseTab,
                    {
                      backgroundColor: active
                        ? theme.colors.primary
                        : theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                    },
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
              {fixtureGroups.map((group) => {
                const active = group === selectedGroup;
                return (
                  <Pressable
                    key={group}
                    onPress={() => setSelectedGroup(group)}
                    style={[
                      styles.groupTab,
                      {
                        backgroundColor: active
                          ? theme.isDark ? 'rgba(204,38,39,0.18)' : 'rgba(204,38,39,0.10)'
                          : 'transparent',
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.groupTabText, { color: active ? theme.colors.primary : theme.colors.textSecondary }]}>
                      {group.replace('Grupo ', '')}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── Contenido ─────────────────────────────────────── */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.stateText, { color: theme.colors.muted }]}>Cargando partidos…</Text>
            </View>
          ) : isError ? (
            <View style={styles.centerState}>
              <Text style={{ fontSize: 36 }}>⚠️</Text>
              <Text style={[styles.stateText, { color: theme.colors.muted }]}>
                No se pudieron cargar los partidos.
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.centerState}>
              <Text style={{ fontSize: 40 }}>🏆</Text>
              <Text style={[styles.stateText, { color: theme.colors.muted }]}>
                {isGroupPhase
                  ? `Sin partidos registrados para ${selectedGroup}`
                  : 'Los partidos de esta fase se definirán durante el torneo'}
              </Text>
            </View>
          ) : (
            matches.map((match) => (
              <MatchRow
                key={match.id}
                match={match}
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

  stickyHeader: {
    paddingTop: 6,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  mockBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  tabsRow: { gap: 8, paddingVertical: 2 },
  phaseTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 6,
  },
  phaseTabText: { fontSize: 13, fontWeight: '700' },

  groupTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  groupTabText: { fontSize: 13, fontWeight: '700' },

  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // ── Tarjeta de partido ──────────────────────────────────────
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  teamSideRight: {},
  teamLogo: {
    width: 44,
    height: 44,
  },
  teamLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCodeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 90,
  },
  teamNameRight: {},

  centerBlock: {
    width: 72,
    alignItems: 'center',
    gap: 3,
  },
  score: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  time: {
    fontSize: 18,
    fontWeight: '800',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '500',
  },

  // ── Estados ─────────────────────────────────────────────────
  centerState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 14,
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 30,
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
