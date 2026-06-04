import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader, MatchCard } from '../../src/components';
import { Screen } from '../../src/components/Screen';
import { useMatchResults } from '../../src/hooks/useMatchResults';
import {
  fixturePhases,
  getMatchesByPhase,
  type MatchItem,
  type MatchPhase,
  toMatchItemFromDb,
} from '../../src/features/matchesAdapter';

const phaseLabels = fixturePhases;

export default function FixtureScreen() {
  const router = useRouter();
  const [selectedPhase, setSelectedPhase] = useState<MatchPhase>('Fase de Grupos');
  const { matches: dbMatches, loading, error } = useMatchResults();

  const matches = useMemo(() => {
    const adapted = (dbMatches ?? []).map(toMatchItemFromDb) as MatchItem[];
    return getMatchesByPhase(adapted, selectedPhase);
  }, [dbMatches, selectedPhase]);

  return (
    <Screen style={styles.screen}>
      <AppHeader />
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Fixture</Text>

        {loading ? (
          <Text style={{ color: '#5C5C5C', marginBottom: 12 }}>Cargando partidos...</Text>
        ) : error ? (
          <Text style={{ color: '#CC2627', marginBottom: 12 }}>
            No se pudo cargar el fixture. Revisá la conexión a Supabase.
          </Text>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phasesScroll} contentContainerStyle={styles.phasesContent}>
          {phaseLabels.map((phase) => {
            const selected = phase === selectedPhase;
            return (
              <Text
                key={phase}
                onPress={() => setSelectedPhase(phase)}
                style={[styles.phaseTab, selected && styles.phaseTabActive]}
              >
                {phase}
              </Text>
            );
          })}
        </ScrollView>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {matches.map((item) => (
            <MatchCard
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
          {!loading && !error && matches.length === 0 ? (
            <Text style={{ color: '#5C5C5C', marginTop: 8 }}>
              No hay partidos cargados para esta fase. Corré el sync del backend para poblar el fixture.
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 18,
  },
  phasesScroll: {
    marginBottom: 18,
  },
  phasesContent: {
    paddingVertical: 4,
  },
  phaseTab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#11182710',
    color: '#5C5C5C',
    fontWeight: '700',
    marginRight: 10,
  },
  phaseTabActive: {
    backgroundColor: '#CC2627',
    color: '#fff',
  },
  listContent: {
    paddingBottom: 40,
  },
});
