import React, { useMemo, useState } from 'react';
import {
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

import { Button } from '../../../components/Button';
import { useAppTheme } from '../../../providers/ThemeProvider';
import {
  getFlagEmoji,
  getNationalColor,
  radius,
  shadows,
  spacing,
  typography,
} from '../../../theme/theme';
import {
  AdminMatch,
  makeEmptyMatch,
  MatchStatus,
  useMatchesStore,
} from '../../content/store/matchesStore';
import { useAdminActivityStore } from '../store/adminActivityStore';

const PHASES = ['Fase de Grupos', 'Octavos', 'Cuartos', 'Semifinales', 'Final'] as const;
const STATUS_LABELS: Record<MatchStatus, string> = {
  upcoming: 'Próximo',
  live: 'EN VIVO',
  finished: 'Finalizado',
};
const STATUS_COLORS: Record<MatchStatus, string> = {
  upcoming: '#FF9800',
  live: '#F44336',
  finished: '#4CAF50',
};

function MatchRow({ item, onEdit, onDelete, onSetResult }: {
  item: AdminMatch;
  onEdit: () => void;
  onDelete: () => void;
  onSetResult: () => void;
}) {
  const { theme } = useAppTheme();
  const homeFlag = getFlagEmoji(item.homeCode);
  const awayFlag = getFlagEmoji(item.awayCode);
  const homeColor = getNationalColor(item.homeCode);
  const awayColor = getNationalColor(item.awayCode);

  return (
    <View style={[styles.matchCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, shadows.sm]}>
      {/* Teams row */}
      <View style={styles.teamsRow}>
        <View style={[styles.teamChip, { backgroundColor: homeColor.bg }]}>
          <Text style={styles.teamFlag}>{homeFlag}</Text>
          <Text style={[styles.teamCode, { color: theme.colors.text }]}>{item.homeCode || '---'}</Text>
        </View>

        <View style={styles.matchMeta}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
          </View>
          <Text style={[styles.matchTime, { color: theme.colors.text }]}>
            {item.date} {item.time}
          </Text>
          {item.status === 'finished' && item.homeScore != null && (
            <Text style={[styles.resultText, { color: theme.colors.primary }]}>
              {item.homeScore} — {item.awayScore}
            </Text>
          )}
        </View>

        <View style={[styles.teamChip, { backgroundColor: awayColor.bg }]}>
          <Text style={styles.teamFlag}>{awayFlag}</Text>
          <Text style={[styles.teamCode, { color: theme.colors.text }]}>{item.awayCode || '---'}</Text>
        </View>
      </View>

      {/* Info */}
      <Text style={[styles.matchInfo, { color: theme.colors.textSecondary }]}>
        {[item.group, item.phase, item.stadium].filter(Boolean).join(' · ')}
      </Text>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Pressable onPress={onEdit} style={[styles.actionBtn, { backgroundColor: theme.colors.primaryLight }]}>
          <Feather name="edit-2" size={14} color={theme.colors.primary} />
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>Editar</Text>
        </Pressable>
        <Pressable onPress={onSetResult} style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Feather name="check-square" size={14} color={theme.colors.success} />
          <Text style={[styles.actionText, { color: theme.colors.success }]}>Resultado</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Feather name="trash-2" size={14} color={theme.colors.error} />
          <Text style={[styles.actionText, { color: theme.colors.error }]}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function MatchesManagementScreen() {
  const { theme } = useAppTheme();
  const matches = useMatchesStore((s) => s.matches);
  const upsert = useMatchesStore((s) => s.upsert);
  const remove = useMatchesStore((s) => s.remove);
  const setResult = useMatchesStore((s) => s.setResult);
  const log = useAdminActivityStore((s) => s.log);

  const [phaseFilter, setPhaseFilter] = useState<string>('Todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(makeEmptyMatch());
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [homeGoals, setHomeGoals] = useState('');
  const [awayGoals, setAwayGoals] = useState('');

  const filtered = useMemo(
    () => (phaseFilter === 'Todos' ? matches : matches.filter((m) => m.phase === phaseFilter)),
    [matches, phaseFilter],
  );

  const openCreate = () => {
    setForm(makeEmptyMatch());
    setModalVisible(true);
  };

  const openEdit = (m: AdminMatch) => {
    setForm({
      id: m.id, homeTeam: m.homeTeam, awayTeam: m.awayTeam,
      homeCode: m.homeCode, awayCode: m.awayCode,
      date: m.date, time: m.time, stadium: m.stadium,
      group: m.group, phase: m.phase, status: m.status,
      homeScore: m.homeScore, awayScore: m.awayScore,
    });
    setModalVisible(true);
  };

  const openResult = (id: string) => {
    const m = matches.find((x) => x.id === id);
    setSelectedMatchId(id);
    setHomeGoals(String(m?.homeScore ?? ''));
    setAwayGoals(String(m?.awayScore ?? ''));
    setResultModalVisible(true);
  };

  const handleSave = () => {
    if (!form.homeCode.trim() || !form.awayCode.trim() || !form.date.trim()) {
      Alert.alert('Error', 'Completá Local, Visitante y Fecha.');
      return;
    }
    setSaving(true);
    try {
      const existed = matches.some((m) => m.id === form.id);
      upsert({
        ...form,
        homeTeam: form.homeTeam || form.homeCode,
        awayTeam: form.awayTeam || form.awayCode,
      });
      log({ action: existed ? 'update' : 'create', module: 'matches', title: existed ? 'Partido actualizado' : 'Partido creado', detail: `${form.homeCode} vs ${form.awayCode}` });
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResult = () => {
    const h = parseInt(homeGoals, 10);
    const a = parseInt(awayGoals, 10);
    if (isNaN(h) || isNaN(a)) {
      Alert.alert('Error', 'Ingresá resultados válidos.');
      return;
    }
    if (selectedMatchId) {
      setResult(selectedMatchId, h, a);
      const m = matches.find((x) => x.id === selectedMatchId);
      log({ action: 'update', module: 'matches', title: 'Resultado cargado', detail: `${m?.homeCode} ${h}-${a} ${m?.awayCode}` });
    }
    setResultModalVisible(false);
  };

  const confirmDelete = (m: AdminMatch) => {
    Alert.alert('Eliminar partido', `${m.homeCode} vs ${m.awayCode}`, [
      { text: 'Cancelar' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => {
          remove(m.id);
          log({ action: 'delete', module: 'matches', title: 'Partido eliminado', detail: `${m.homeCode} vs ${m.awayCode}` });
        },
      },
    ]);
  };

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Gestión de Partidos</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{matches.length} partidos</Text>
        </View>
        <Pressable onPress={openCreate} style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Nuevo</Text>
        </Pressable>
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

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MatchRow
            item={item}
            onEdit={() => openEdit(item)}
            onDelete={() => confirmDelete(item)}
            onSetResult={() => openResult(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="soccer" size={48} color={theme.colors.muted} />
            <Text style={[styles.emptyText, { color: theme.colors.muted }]}>No hay partidos cargados</Text>
            <Pressable onPress={openCreate} style={[styles.emptyBtn, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.emptyBtnText}>Crear primer partido</Text>
            </Pressable>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {matches.some((m) => m.id === form.id) ? 'Editar partido' : 'Nuevo partido'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Equipos */}
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Código Local (ej: ARG)</Text>
              <TextInput
                value={form.homeCode}
                onChangeText={(v) => setForm((s) => ({ ...s, homeCode: v.toUpperCase(), homeTeam: v.toUpperCase() }))}
                placeholder="ARG"
                placeholderTextColor={theme.colors.placeholder}
                maxLength={3}
                autoCapitalize="characters"
                style={[styles.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
              />
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Código Visitante (ej: BRA)</Text>
              <TextInput
                value={form.awayCode}
                onChangeText={(v) => setForm((s) => ({ ...s, awayCode: v.toUpperCase(), awayTeam: v.toUpperCase() }))}
                placeholder="BRA"
                placeholderTextColor={theme.colors.placeholder}
                maxLength={3}
                autoCapitalize="characters"
                style={[styles.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
              />

              {/* Fecha y hora */}
              <View style={styles.twoCol}>
                <View style={styles.colHalf}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Fecha</Text>
                  <TextInput
                    value={form.date}
                    onChangeText={(v) => setForm((s) => ({ ...s, date: v }))}
                    placeholder="20 Nov"
                    placeholderTextColor={theme.colors.placeholder}
                    style={[styles.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Hora</Text>
                  <TextInput
                    value={form.time}
                    onChangeText={(v) => setForm((s) => ({ ...s, time: v }))}
                    placeholder="18:00"
                    placeholderTextColor={theme.colors.placeholder}
                    style={[styles.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                  />
                </View>
              </View>

              {/* Grupo y estadio */}
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Grupo</Text>
              <TextInput
                value={form.group}
                onChangeText={(v) => setForm((s) => ({ ...s, group: v }))}
                placeholder="Grupo A"
                placeholderTextColor={theme.colors.placeholder}
                style={[styles.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
              />

              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Estadio</Text>
              <TextInput
                value={form.stadium}
                onChangeText={(v) => setForm((s) => ({ ...s, stadium: v }))}
                placeholder="Lusail Stadium"
                placeholderTextColor={theme.colors.placeholder}
                style={[styles.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
              />

              {/* Fase */}
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Fase</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {PHASES.map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setForm((s) => ({ ...s, phase: p }))}
                      style={[styles.filterPill, { backgroundColor: form.phase === p ? '#CC2627' : theme.colors.surfaceAlt }]}
                    >
                      <Text style={[styles.filterText, { color: form.phase === p ? '#fff' : theme.colors.textSecondary }]}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title={saving ? 'Guardando...' : 'Guardar partido'} onPress={handleSave} disabled={saving} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Result Modal */}
      <Modal visible={resultModalVisible} transparent animationType="fade" onRequestClose={() => setResultModalVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.resultCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, marginBottom: spacing.lg }]}>
              Cargar resultado
            </Text>
            <Text style={[styles.matchLabel, { color: theme.colors.textSecondary }]}>
              {selectedMatch ? `${getFlagEmoji(selectedMatch.homeCode)} ${selectedMatch.homeCode}  vs  ${selectedMatch.awayCode} ${getFlagEmoji(selectedMatch.awayCode)}` : ''}
            </Text>

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
              <Pressable onPress={handleSaveResult} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>Confirmar</Text>
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
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  filterScroll: { maxHeight: 52 },
  filterContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  filterText: { fontSize: 12, fontWeight: '700' },
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
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText: { fontSize: 14, fontWeight: '600' },
  emptyBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.xl, marginTop: spacing.sm },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalBody: { paddingHorizontal: spacing.lg },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: spacing.md },
  input: { borderWidth: 1, borderRadius: radius.lg, height: 48, paddingHorizontal: spacing.md, fontSize: 15, fontWeight: '500' },
  twoCol: { flexDirection: 'row', gap: spacing.sm },
  colHalf: { flex: 1 },
  modalFooter: { padding: spacing.lg },
  resultCard: { margin: spacing.xl, borderRadius: 28, borderWidth: 1, padding: spacing.xl, alignItems: 'center', gap: spacing.lg },
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
