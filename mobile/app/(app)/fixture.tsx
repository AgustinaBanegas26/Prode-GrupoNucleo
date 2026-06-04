import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader, SportMatchCard } from '../../src/components';
import { Screen } from '../../src/components/Screen';
import {
  fixtureGroups,
  fixturePhases,
  getMatchesByGroup,
  getMatchesByPhase,
  type MatchItem,
  type MatchPhase,
} from '../../src/features/mockData';
import { useAppTheme } from '../../src/providers/ThemeProvider';

export default function FixtureScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [selectedPhase, setSelectedPhase] = useState<MatchPhase>('Fase de Grupos');
  const [selectedGroup, setSelectedGroup] = useState<string>('Grupo A');

  const isGroupPhase = selectedPhase === 'Fase de Grupos';

  const matches = useMemo<MatchItem[]>(() => {
    if (isGroupPhase) return getMatchesByGroup(selectedGroup);
    return getMatchesByPhase(selectedPhase);
  }, [selectedPhase, selectedGroup, isGroupPhase]);

  return (
    <Screen style={styles.screen}>
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
      >
        {/* Header sticky con tabs de fase */}
        <View style={[styles.stickyHeader, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>⚽ Fixture 2026</Text>

          {/* Tabs de fase */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.phasesContent}
          >
            {fixturePhases.map((phase) => {
              const active = phase === selectedPhase;
              return (
                <Pressable
                  key={phase}
                  onPress={() => setSelectedPhase(phase)}
                  style={[
                    styles.phaseTab,
                    {
                      backgroundColor: active ? theme.colors.primary : theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
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

          {/* Sub-tabs de grupo (solo en Fase de Grupos) */}
          {isGroupPhase && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupsContent}
            >
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
                    <Text
                      style={[
                        styles.groupTabText,
                        { color: active ? theme.colors.primary : theme.colors.textSecondary },
                      ]}
                    >
                      {group.replace('Grupo ', '')}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Lista de partidos */}
        <View style={styles.matchList}>
          {matches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>🏆</Text>
              <Text style={[styles.emptyText, { color: theme.colors.muted }]}>
                Los partidos de esta fase se definirán durante el torneo
              </Text>
            </View>
          ) : (
            matches.map((item) => (
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
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  scrollContent: { paddingBottom: 110 },
  stickyHeader: {
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 18,
    gap: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  phasesContent: {
    gap: 8,
    paddingVertical: 2,
  },
  phaseTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 6,
  },
  phaseTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  groupsContent: {
    gap: 6,
    paddingVertical: 2,
  },
  groupTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  groupTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  matchList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 30,
  },
});
