import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../../components/Button';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { getFlagEmoji, getNationalColor, radius, shadows, spacing } from '../../../theme/theme';
import {
  useMatches,
  useMatchesRealtime,
  useUpsertMatch,
  matchesQueryKey,
  type MatchRow,
} from '../../content/api/matches';
import { supabase } from '../../../lib/supabase';
import { toMatchItemFromDb, inferPhaseFromRound } from '../../matchesAdapter';

const PHASES = ['Fase de Grupos', 'Octavos', 'Cuartos', 'Semifinales', 'Final'] as const;

type StatusLabel = 'Próximo' | 'EN VIVO' | 'Finalizado';

function getStatusLabel(status: string): StatusLabel {
  if (['FT', 'AET', 'PEN'].includes(status)) return 'Finalizado';
  if (['1H', '2H', 'ET', 'BT', 'P', 'INT', 'LIVE'].includes(status)) return 'EN VIVO';
  return 'Próximo';
}

const STATUS_COLORS: Record<StatusLabel, string> = {
  Próximo: '#FF9800',
  'EN VIVO': '#F44336',
  Finalizado: '#4CAF50',
};

// ── Componente fila de partido ────────────────────────────────

function MatchRowCard({ item, onSetResult }: { item: MatchRow; onSetResult: () => void }) {
  const { theme } = useAppTheme();
  const adapted = toMatchItemFromDb(item);
  const homeFlag = getFlagEmoji(adapted.homeCode);
  const awayFlag = getFlagEmoji(adapted.awayCode);
  const homeColor = getNationalColor(adapted.homeCode);
  const awayColor = getNationalColor(adapted.awayCode);
  const statusLabel = getStatusLabel(item.status ?? '');

  return (
    <View style={[styles.matchCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, shadows.sm]}>
      <View style={styles.teamsRow}>
        <View style={[styles.teamChip, { backgroundColor: homeColor.bg }]}>
          <Text style={styles.teamFlag}>{homeFlag}</Text>
          <Text style={[styles.teamCode, { color: theme.colors.text }]}>{adapted.homeCode}</Text>
        </View>

        <View style={styles.matchMeta}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[statusLabel] }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          <Text style={[styles.matchTime, { color: theme.colors.text }]}>
            {adapted.date} {adapted.time}
          </Text>
          {statusLabel === 'Finalizado' && item.home_goals != null && (
            <Text style={[styles.resultText, { color: theme.colors.primary }]}>
              {item.home_goals} — {item.away_goals}
            </Text>
          )}
        </View>

        <View style={[styles.teamChip, { backgroundColor: awayColor.bg }]}>
          <Text style={styles.teamFlag}>{awayFlag}</Text>
          <Text style={[styles.teamCode, { color: theme.colors.text }]}>{adapted.awayCode}</Text>
        </View>
      </View>

      <Text style={[styles.matchInfo, { color: theme.colors.textSecondary }]}>
        {[adapted.group, adapted.stadium].filter(Boolean).join(' · ')}
      </Text>

      <View style={styles.actionsRow}>
        <Pressable onPress={onSetResult} style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Feather name="check-square" size={14} color={theme.colors.success} />
          <Text style={[styles.actionText, { color: theme.colors.success }]}>Cargar resultado</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────

export function MatchesManagementScreen() {
  const { theme } = useAppTheme();
  const qc = useQueryClient();

  useMatchesRealtime();

  const { data: matches, isLoading } = useMatches();
  const upsertMatch = useUpsertMatch();

  const [phaseFilter, setPhaseFilter] = useState<string>('Todos');
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(null);
  const [homeGoals, setHomeGoals] = useState('');
  const [awayGoals, setAwayGoals] = useState('');

  const filtered = useMemo(() => {
    if (!matches) return [];
    if (phaseFilter === 'Todos') return matches;
    return matches.filter((m) => inferPhaseFromRound(m.round) === phaseFilter);
  }, [matches, phaseFilter]);

  const openResult = (fixtureId: number) => {
    const m = matches?.find((x) => x.fixture_id === fixtureId);
    setSelectedFixtureId(fixtureId);
    setHomeGoals(String(m?.home_goals ?? ''));
    setAwayGoals(String(m?.away_goals ?? ''));
    setResultModalVisible(true);
  };

  const handleSaveResult = async () => {
    const h = parseInt(homeGoals, 10);
    const a = parseInt(awayGoals, 10);
    if (isNaN(h) || isNaN(a)) {
      Alert.alert('Error', 'Ingresá resultados válidos.');
      return;
    }
    if (!selectedFixtureId) return;

    try {
      await upsertMatch.mutateAsync({
        fixture_id: selectedFixtureId,
        home_goals: h,
        away_goals: a,
        status: 'FT',
        updated_at: new Date().toISOString(),
      });
      setResultModalVisible(false);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  };

  const selectedMatch = matches?.find((m) => m.fixture_id === selectedFixtureId);
  const selectedAdapted = selectedMatch ? toMatchItemFromDb(selectedMatch) : null;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Partidos</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {matches?.length ?? 0} partidos en Supabase
          </Text>
        </View>
      </View>

      {/* Phase filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {['Todos', ...PHASES].map((p) => {
          const active = p === phaseFilter;
          return (
            <Pressable
              key={p}
              onPress={() => setPhaseFilter(p)}
              style={[styles.filterPill, { backgroundColor: active ? '#CC2627' : (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') }]}
            >
              <Text style={[styles.filterText, { color: active ? '#fff' : theme.colors.textSecondary }]}>{p}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={styles.loadingBox}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(m) => String(m.fixture_id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <MatchRowCard item={item} onSetResult={() => openResult(item.fixture_id)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="soccer" size={48} color={theme.colors.muted} />
              <Text style={[styles.emptyText, { color: theme.colors.muted }]}>
                No hay partidos para esta fase.{'\n'}Los partidos se sincronizan automáticamente desde el backend.
              </Text>
            </View>
          }
        />
      )}

      {/* Result Modal */}
      <Modal visible={resultModalVisible} transparent animationType="fade" onRequestClose={() => setResultModalVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.resultCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, marginBottom: spacing.lg }]}>
              Cargar resultado
            </Text>
            {selectedAdapted && (
              <Text style={[styles.matchLabel, { color: theme.colors.textSecondary }]}>
                {getFlagEmoji(selectedAdapted.homeCode)} {selectedAdapted.homeCode}  vs  {selectedAdapted.awayCode} {getFlagEmoji(selectedAdapted.awayCode)}
              </Text>
            )}

            <View style={styles.resultInputRow}>
              <TextInput
                value={homeGoals}
                onChangeText={setHomeGoals}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="0"
                placeholderTextColor={theme.colors.placeholder}
                style={[styles.goalInput, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                textAlign="center"
              />
              <Text style={[styles.goalDash, { color: theme.colors.muted }]}>—</Text>
              <TextInput
                value={awayGoals}
                onChangeText={setAwayGoals}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="0"
                placeholderTextColor={theme.colors.placeholder}
                style={[styles.goalInput, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                textAlign="center"
              />
            </View>

            <View style={styles.resultFooter}>
              <Pressable onPress={() => setResultModalVisible(false)} style={[styles.cancelBtn, { borderColor: theme.colors.border }]}>
                <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleSaveResult} disabled={upsertMatch.isPending} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>{upsertMatch.isPending ? 'Guardando...' : 'Confirmar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  filterScroll: { maxHeight: 52 },
  filterContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  filterText: { fontSize: 12, fontWeight: '700' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  listContent: { padding: spacing.lg, paddingBottom: 100, gap: spacing.md },
  matchCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  teamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamChip: { flex: 1, alignItems: 'center', borderRadius: radius.lg, padding: spacing.sm, gap: 4 },
  teamFlag: { fontSize: 28 },
  teamCode: { fontSize: 14, fontWeight: '800' },
  matchMeta: { alignItems: 'center', gap: 4, flex: 0.8 },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  matchTime: { fontSize: 13, fontWeight: '700' },
  resultText: { fontSize: 18, fontWeight: '800' },
  matchInfo: { fontSize: 11, textAlign: 'center' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, gap: 4 },
  actionText: { fontSize: 12, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  resultCard: { borderRadius: 28, borderWidth: 1, padding: spacing.xl, alignItems: 'center', gap: spacing.lg },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  matchLabel: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  resultInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  goalInput: { width: 72, height: 72, borderRadius: radius.xl, borderWidth: 2, fontSize: 28, fontWeight: '800' },
  goalDash: { fontSize: 24, fontWeight: '300' },
  resultFooter: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  cancelBtn: { flex: 1, height: 48, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700' },
  confirmBtn: { flex: 1, height: 48, borderRadius: radius.xl, backgroundColor: '#CC2627', alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
