import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader, MatchCard } from '../../src/components';
import { Screen } from '../../src/components/Screen';
import { fixtures, fixturePhases, type MatchItem, getMatchesByPhase } from '../../src/features/mockData';

const phaseLabels = fixturePhases;

export default function FixtureScreen() {
  const router = useRouter();
  const [selectedPhase, setSelectedPhase] = useState<MatchItem['phase']>('Fase de Grupos');
  const matches = useMemo(() => getMatchesByPhase(selectedPhase), [selectedPhase]);

  return (
    <Screen style={styles.screen}>
      <AppHeader />
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Fixture</Text>
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
              onPress={() => router.push({ pathname: '/(app)/details/detalle-partido', params: { matchId: item.id } })}
            />
          ))}
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
