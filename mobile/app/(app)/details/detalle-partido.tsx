import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../../src/components/AppHeader';
import { Button } from '../../../src/components/Button';
import { Screen } from '../../../src/components/Screen';
import { useMatchResults } from '../../../src/hooks/useMatchResults';
import { toMatchItemFromDb } from '../../../src/features/matchesAdapter';
import { useAppTheme } from '../../../src/providers/ThemeProvider';

const resultOptions = ['1-0', '2-0', '2-1', '1-1'];
const tabs = ['Pronóstico', 'Estadísticas', 'H2H'] as const;

type TabOption = typeof tabs[number];

export default function MatchDetailsScreen() {
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<{ matchId?: string }>();
  const { matches: dbMatches, loading } = useMatchResults();

  const match = useMemo(() => {
    if (!params.matchId) return undefined;
    const numericId = Number(params.matchId);
    const found = (dbMatches ?? []).find((m: any) => m.fixture_id === numericId);
    return found ? toMatchItemFromDb(found) : undefined;
  }, [dbMatches, params.matchId]);
  const [selectedTab, setSelectedTab] = useState<TabOption>('Pronóstico');
  const [winner, setWinner] = useState<'local' | 'draw' | 'away'>('local');
  const [score, setScore] = useState('2-1');
  const [qualified, setQualified] = useState(false);
  const [overtime, setOvertime] = useState(false);
  const [penalties, setPenalties] = useState(false);

  if (loading && !match) {
    return (
      <Screen>
        <AppHeader />
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: theme.colors.text }]}>Cargando partido...</Text>
        </View>
      </Screen>
    );
  }

  if (!match) {
    return (
      <Screen>
        <AppHeader />
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: theme.colors.text }]}>Partido no encontrado</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.matchHeader, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <View style={styles.teamCard}>
            <Text style={[styles.teamCode, { color: theme.colors.text }]}>{match.homeCode}</Text>
            <Text style={[styles.teamName, { color: theme.colors.text }]}>{match.homeTeam}</Text>
          </View>
          <View style={styles.matchInfo}>
            <Text style={[styles.vsText, { color: theme.colors.muted }]}>VS</Text>
            <Text style={[styles.stadiumText, { color: theme.colors.muted }]}>{match.date} · {match.time}</Text>
            <Text style={[styles.stadiumText, { color: theme.colors.muted }]}>{match.stadium}</Text>
          </View>
          <View style={styles.teamCardRight}>
            <Text style={[styles.teamCode, { color: theme.colors.text }]}>{match.awayCode}</Text>
            <Text style={[styles.teamName, { color: theme.colors.text }]}>{match.awayTeam}</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const selected = tab === selectedTab;
            return (
              <Pressable key={tab} onPress={() => setSelectedTab(tab)} style={[styles.tabItem, selected && { backgroundColor: theme.colors.primary }]}> 
                <Text style={[styles.tabLabel, { color: selected ? '#fff' : theme.colors.text }]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedTab === 'Pronóstico' ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>¿Quién ganará?</Text>
            <View style={styles.optionsRow}>
              <Pressable style={[styles.optionButton, winner === 'local' && { backgroundColor: theme.colors.primary }]} onPress={() => setWinner('local')}>
                <Text style={[styles.optionText, winner === 'local' && { color: '#fff' }]}>{match.homeTeam}</Text>
              </Pressable>
              <Pressable style={[styles.optionButton, winner === 'draw' && { backgroundColor: theme.colors.primary }]} onPress={() => setWinner('draw')}>
                <Text style={[styles.optionText, winner === 'draw' && { color: '#fff' }]}>Empate</Text>
              </Pressable>
              <Pressable style={[styles.optionButton, winner === 'away' && { backgroundColor: theme.colors.primary }]} onPress={() => setWinner('away')}>
                <Text style={[styles.optionText, winner === 'away' && { color: '#fff' }]}>{match.awayTeam}</Text>
              </Pressable>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Resultado exacto</Text>
            <View style={styles.scoreRow}>
              {resultOptions.map((option) => {
                const selected = option === score;
                return (
                  <Pressable key={option} onPress={() => setScore(option)} style={[styles.scoreButton, selected && { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.scoreText, selected && { color: '#fff' }]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Detalles</Text>
            <View style={styles.detailRow}>
              <Pressable style={[styles.detailChip, qualified && { borderColor: theme.colors.primary, backgroundColor: qualified ? 'rgba(204, 38, 39, 0.12)' : undefined }]} onPress={() => setQualified((value) => !value)}>
                <Text style={[styles.detailText, qualified && { color: theme.colors.primary }]}>Clasificado</Text>
              </Pressable>
              <Pressable style={[styles.detailChip, overtime && { borderColor: theme.colors.primary, backgroundColor: overtime ? 'rgba(204, 38, 39, 0.12)' : undefined }]} onPress={() => setOvertime((value) => !value)}>
                <Text style={[styles.detailText, overtime && { color: theme.colors.primary }]}>¿Hay alargue?</Text>
              </Pressable>
            </View>
            <View style={styles.detailRow}> 
              <Pressable style={[styles.detailChip, penalties && { borderColor: theme.colors.primary, backgroundColor: penalties ? 'rgba(204, 38, 39, 0.12)' : undefined }]} onPress={() => setPenalties((value) => !value)}>
                <Text style={[styles.detailText, penalties && { color: theme.colors.primary }]}>¿Hay penales?</Text>
              </Pressable>
            </View>

            <Button title="Guardar Pronóstico" onPress={() => null} />
          </View>
        ) : (
          <View style={styles.notAvailableBox}>
            <Text style={[styles.notAvailableText, { color: theme.colors.text }]}>Contenido aún no disponible en esta demo.</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 40,
  },
  matchHeader: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  teamCard: {
    alignItems: 'flex-start',
  },
  teamCardRight: {
    alignItems: 'flex-end',
    marginTop: -72,
  },
  teamCode: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  matchInfo: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stadiumText: {
    fontSize: 12,
    marginTop: 10,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#11182710',
    marginRight: 10,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  scoreButton: {
    minWidth: 76,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  detailChip: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  notAvailableBox: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  notAvailableText: {
    fontSize: 14,
    textAlign: 'center',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
