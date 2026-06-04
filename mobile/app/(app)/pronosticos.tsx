/**
 * Pantalla Pronósticos — Prode Mundial 2026
 *
 * Layout:
 *  • Tabs: Pendientes / Completados
 *  • Banner informativo celeste
 *  • Partidos agrupados por fecha
 *  • Card por partido: bandera cuadrada redondeada + input "-" + vs + input "-" + bandera
 *  • Al guardar → pasa automáticamente a la lista Completados
 *
 * Colores: celeste argentino (#6EC6FF) para UI — rojo (#CC2627) solo para acción primaria
 * NO se mezcla rojo con celeste en degradados.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';

import { Screen } from '../../src/components/Screen';
import { fixtures } from '../../src/features/mockData';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { getFlagEmoji } from '../../src/theme/theme';

// ── Paleta ────────────────────────────────────────────────────
const CELESTE      = '#6EC6FF';
const CELESTE_LIGHT = '#DDF4FF';
const RED          = '#CC2627';

// ── Tipos ─────────────────────────────────────────────────────
type Tab = 'PENDIENTES' | 'COMPLETADOS';

type SavedPrediction = {
  matchId: string;
  home: string;
  away: string;
};

// ── Formatear fecha larga ─────────────────────────────────────
const MONTHS: Record<string, string> = {
  'Jun': 'junio', 'Jul': 'julio', 'Ago': 'agosto',
};

function formatDateLabel(date: string): string {
  // "11 Jun" → "11 de junio"
  const parts = date.split(' ');
  if (parts.length === 2) {
    const month = MONTHS[parts[1]] ?? parts[1].toLowerCase();
    return `${parts[0]} de ${month}`;
  }
  return date;
}

// ── Agrupar partidos por fecha ────────────────────────────────
function groupByDate(matchIds: string[]) {
  const map = new Map<string, typeof fixtures>();
  for (const id of matchIds) {
    const match = fixtures.find(m => m.id === id);
    if (!match) continue;
    const label = formatDateLabel(match.date);
    const list = map.get(label) ?? [];
    list.push(match);
    map.set(label, list);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

// ── Card individual de partido ────────────────────────────────
type MatchCardProps = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
  group?: string;
  time: string;
  saved: SavedPrediction | null;
  onSave: (matchId: string, home: string, away: string) => void;
  onEdit: (matchId: string) => void;
};

function MatchCard({
  matchId, homeTeam, awayTeam, homeCode, awayCode,
  group, time, saved, onSave, onEdit,
}: MatchCardProps) {
  const { theme } = useAppTheme();
  const [home, setHome] = useState(saved?.home ?? '');
  const [away, setAway] = useState(saved?.away ?? '');
  const isEditing = !saved;

  const canSave = home !== '' && away !== '';

  const handleSave = () => {
    if (!canSave) return;
    onSave(matchId, home, away);
  };

  const handleEdit = () => {
    onEdit(matchId);
  };

  return (
    <View style={[card.container, {
      backgroundColor: theme.isDark ? '#1E1E1E' : '#FFFFFF',
      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    }]}>
      {/* Header: Grupo + Hora */}
      <View style={card.header}>
        <Text style={[card.group, { color: theme.colors.text }]}>{group}</Text>
        <Text style={[card.time, { color: theme.colors.textSecondary }]}>{time}</Text>
      </View>

      {/* Equipos + inputs */}
      <View style={card.body}>
        {/* Local */}
        <View style={card.teamCol}>
          <View style={card.flagBox}>
            <Text style={card.flagEmoji}>{getFlagEmoji(homeCode)}</Text>
          </View>
          <Text style={[card.teamName, { color: theme.colors.text }]} numberOfLines={2}>
            {homeTeam}
          </Text>
        </View>

        {/* Inputs centrales */}
        <View style={card.scoreRow}>
          {isEditing ? (
            <>
              <TextInput
                style={[card.input, {
                  backgroundColor: theme.isDark ? '#2A2A2A' : '#F5F7FA',
                  borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                  color: theme.colors.text,
                }]}
                value={home}
                onChangeText={v => setHome(v.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="-"
                placeholderTextColor={theme.colors.muted}
                textAlign="center"
                accessibilityLabel={`Goles ${homeTeam}`}
              />
              <Text style={[card.vs, { color: theme.colors.muted }]}>vs</Text>
              <TextInput
                style={[card.input, {
                  backgroundColor: theme.isDark ? '#2A2A2A' : '#F5F7FA',
                  borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                  color: theme.colors.text,
                }]}
                value={away}
                onChangeText={v => setAway(v.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="-"
                placeholderTextColor={theme.colors.muted}
                textAlign="center"
                accessibilityLabel={`Goles ${awayTeam}`}
              />
            </>
          ) : (
            <>
              <View style={[card.savedInput, {
                backgroundColor: theme.isDark ? '#2A2A2A' : '#F5F7FA',
                borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
              }]}>
                <Text style={[card.savedNum, { color: theme.colors.text }]}>{saved!.home}</Text>
              </View>
              <Text style={[card.vs, { color: theme.colors.muted }]}>vs</Text>
              <View style={[card.savedInput, {
                backgroundColor: theme.isDark ? '#2A2A2A' : '#F5F7FA',
                borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
              }]}>
                <Text style={[card.savedNum, { color: theme.colors.text }]}>{saved!.away}</Text>
              </View>
            </>
          )}
        </View>

        {/* Visitante */}
        <View style={card.teamCol}>
          <View style={card.flagBox}>
            <Text style={card.flagEmoji}>{getFlagEmoji(awayCode)}</Text>
          </View>
          <Text style={[card.teamName, { color: theme.colors.text }]} numberOfLines={2}>
            {awayTeam}
          </Text>
        </View>
      </View>

      {/* Footer */}
      {isEditing ? (
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={[card.saveBtn, {
            backgroundColor: canSave ? RED : (theme.isDark ? '#333' : '#E5E7EB'),
          }]}
        >
          <Text style={[card.saveBtnText, { color: canSave ? '#fff' : theme.colors.muted }]}>
            Guardar predicción
          </Text>
        </Pressable>
      ) : (
        <View style={[card.savedFooter, {
          borderTopColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }]}>
          <Text style={[card.savedLabel, { color: theme.colors.textSecondary }]}>
            Tu resultado:{' '}
            <Text style={[card.savedScore, { color: theme.colors.text }]}>
              {saved!.home} - {saved!.away}
            </Text>
          </Text>
          <Pressable
            onPress={handleEdit}
            style={[card.editBtn, { backgroundColor: CELESTE }]}
          >
            <Text style={card.editBtnText}>Editar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const card = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 0,
  },
  group: { fontSize: 13, fontWeight: '700' },
  time:  { fontSize: 13, fontWeight: '600' },

  body: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  flagBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  flagEmoji: { fontSize: 40 },
  teamName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 90,
    lineHeight: 16,
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  input: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  vs: {
    fontSize: 12,
    fontWeight: '600',
    width: 20,
    textAlign: 'center',
  },
  savedInput: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedNum: { fontSize: 20, fontWeight: '700' },

  saveBtn: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700' },

  savedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  savedLabel: { fontSize: 13, fontWeight: '500' },
  savedScore: { fontWeight: '800' },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

// ── Pantalla principal ────────────────────────────────────────
export default function PronosticosScreen() {
  const { theme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<Tab>('PENDIENTES');
  // saved: { matchId → { home, away } }
  const [saved, setSaved] = useState<Record<string, SavedPrediction>>({});

  const handleSave = useCallback((matchId: string, home: string, away: string) => {
    setSaved(prev => ({ ...prev, [matchId]: { matchId, home, away } }));
  }, []);

  const handleEdit = useCallback((matchId: string) => {
    setSaved(prev => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
  }, []);

  // IDs por tab
  const pendingIds   = fixtures.filter(m => !saved[m.id]).map(m => m.id);
  const completedIds = fixtures.filter(m => !!saved[m.id]).map(m => m.id);
  const currentIds   = activeTab === 'PENDIENTES' ? pendingIds : completedIds;

  const sections = groupByDate(currentIds);

  const bg = theme.isDark ? '#0D0D0D' : '#F5F7FA';

  return (
    <Screen style={{ backgroundColor: bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Título ─────────────────────────────────────── */}
        <View style={[scr.topBar, { backgroundColor: bg }]}>
          <Text style={[scr.title, { color: theme.colors.text }]}>Pronósticos</Text>
        </View>

        {/* ── Tabs ───────────────────────────────────────── */}
        <View style={[scr.tabsWrapper, { backgroundColor: bg }]}>
          <View style={[scr.tabsRow, {
            backgroundColor: theme.isDark ? '#1A1A1A' : '#FFFFFF',
            borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          }]}>
            {(['PENDIENTES', 'COMPLETADOS'] as Tab[]).map(tab => {
              const active = tab === activeTab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[scr.tab, active && {
                    borderColor: CELESTE,
                    backgroundColor: theme.isDark ? 'rgba(110,198,255,0.1)' : '#fff',
                  }]}
                >
                  {tab === 'COMPLETADOS' && (
                    <View style={[scr.tabDot, {
                      backgroundColor: completedIds.length > 0 ? '#22C55E' : theme.colors.muted,
                    }]} />
                  )}
                  <Text style={[scr.tabText, {
                    color: active ? (theme.isDark ? CELESTE : '#1D1D1D') : theme.colors.muted,
                    fontWeight: active ? '700' : '500',
                  }]}>
                    {tab === 'PENDIENTES' ? 'Pendientes' : 'Completados'}
                    {tab === 'COMPLETADOS' && completedIds.length > 0
                      ? ` (${completedIds.length})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Banner info ────────────────────────────────── */}
        <View style={[scr.infoBanner, {
          backgroundColor: theme.isDark ? 'rgba(110,198,255,0.08)' : CELESTE_LIGHT,
          borderColor: theme.isDark ? 'rgba(110,198,255,0.2)' : 'rgba(110,198,255,0.4)',
          marginHorizontal: 16,
          marginBottom: 4,
        }]}>
          <Ionicons name="information-circle-outline" size={16} color={CELESTE} />
          <Text style={[scr.infoText, { color: theme.isDark ? CELESTE : '#0F4C81' }]}>
            Cuantos más partidos completás, más puntos podés sumar
          </Text>
        </View>

        {/* ── Lista ──────────────────────────────────────── */}
        {sections.length === 0 ? (
          <View style={scr.empty}>
            <Text style={scr.emptyEmoji}>
              {activeTab === 'COMPLETADOS' ? '🎯' : '⚽'}
            </Text>
            <Text style={[scr.emptyTitle, { color: theme.colors.text }]}>
              {activeTab === 'COMPLETADOS'
                ? 'Todavía no guardaste ningún pronóstico'
                : 'Todos los pronósticos están completados'}
            </Text>
            <Text style={[scr.emptySubtitle, { color: theme.colors.muted }]}>
              {activeTab === 'COMPLETADOS'
                ? 'Pasá a Pendientes para empezar a predecir'
                : '¡Bien hecho! Seguí así'}
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (
              <Text style={[scr.dateHeader, { color: theme.colors.text }]}>
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => (
              <MatchCard
                matchId={item.id}
                homeTeam={item.homeTeam}
                awayTeam={item.awayTeam}
                homeCode={item.homeCode}
                awayCode={item.awayCode}
                group={item.group ?? item.phase}
                time={item.time}
                saved={saved[item.id] ?? null}
                onSave={handleSave}
                onEdit={handleEdit}
              />
            )}
          />
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const scr = StyleSheet.create({
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  tabsWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  tabText: {
    fontSize: 14,
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  dateHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyEmoji:    { fontSize: 52 },
  emptyTitle:    { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
