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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { supabase } from '../../../lib/supabase';
import { useMatches, useUpsertMatch, type MatchRow } from '../../content/api/matches';

const CELESTE      = '#6EC6FF';
const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE    = '#0F4C81';

function statusColor(status: string) {
  if (status === 'FT' || status === 'AET' || status === 'PEN') return '#22C55E';
  if (status === '1H' || status === '2H' || status === 'HT' || status === 'LIVE') return '#F59E0B';
  if (status === 'CANC' || status === 'PST') return '#ef4444';
  return '#94A3B8';
}

const STATUS_OPTIONS = ['NS', 'TBD', '1H', 'HT', '2H', 'FT', 'AET', 'PEN', 'CANC', 'PST'];

type FormState = Partial<MatchRow> & { fixture_id: number };

function emptyForm(): FormState {
  return {
    fixture_id: 0,
    home_team: '',
    away_team: '',
    match_date: new Date().toISOString(),
    status: 'NS',
    round: '',
    venue: '',
    home_goals: null,
    away_goals: null,
  };
}

export function MatchesManagementScreen() {
  const { theme } = useAppTheme();
  const isDark = theme.isDark;
  const router = useRouter();

  const { data: matches = [], isLoading, refetch } = useMatches();
  const upsert = useUpsertMatch();

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isEdit, setIsEdit] = useState(false);
  const [query, setQuery] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedingPreds, setSeedingPreds] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return matches;
    return matches.filter(
      (m) =>
        m.home_team.toLowerCase().includes(q) ||
        m.away_team.toLowerCase().includes(q) ||
        String(m.fixture_id).includes(q),
    );
  }, [matches, query]);

  const openCreate = () => {
    setForm(emptyForm());
    setIsEdit(false);
    setModalVisible(true);
  };

  const openEdit = (m: MatchRow) => {
    setForm({
      fixture_id: m.fixture_id,
      home_team: m.home_team,
      away_team: m.away_team,
      match_date: m.match_date,
      status: m.status,
      round: m.round ?? '',
      venue: m.venue ?? '',
      home_goals: m.home_goals,
      away_goals: m.away_goals,
    });
    setIsEdit(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.home_team?.trim() || !form.away_team?.trim()) {
      Alert.alert('Error', 'Equipos local y visitante son obligatorios');
      return;
    }
    if (!isEdit && (!form.fixture_id || form.fixture_id <= 0)) {
      Alert.alert('Error', 'fixture_id debe ser un número positivo');
      return;
    }
    setSaving(true);
    try {
      await upsert.mutateAsync({
        fixture_id: form.fixture_id,
        home_team: form.home_team!.trim(),
        away_team: form.away_team!.trim(),
        match_date: form.match_date ?? new Date().toISOString(),
        status: form.status ?? 'NS',
        round: form.round?.trim() ?? null,
        venue: form.venue?.trim() ?? null,
        home_goals: form.home_goals ?? null,
        away_goals: form.away_goals ?? null,
      } as any);
      setModalVisible(false);
      await refetch();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedTestMatch = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.rpc('seed_test_match');
      if (error) throw new Error(error.message);
      await refetch();
      const kickoff = new Date(Date.now() + 15 * 60 * 1000).toLocaleString('es-AR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      });
      Alert.alert(
        'Partido de prueba listo',
        `Argentina vs Brasil (#${data ?? 999001})\nInicio: ${kickoff}\nBloqueo: 10 min antes.`,
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear el partido de prueba');
    } finally {
      setSeeding(false);
    }
  };

  const handleSeedTestPredictions = async () => {
    setSeedingPreds(true);
    try {
      const { data: fixtureId } = await supabase.rpc('seed_test_match');
      const fid = fixtureId ?? 999001;
      const { data, error } = await supabase.rpc('seed_test_predictions', { p_fixture_id: fid });
      if (error) throw new Error(error.message);
      await refetch();
      const count = (data as { count?: number })?.count ?? 0;
      Alert.alert(
        'Predicciones de prueba',
        `Se crearon ${count} pronósticos de usuarios reales para el partido #${fid}.`,
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudieron simular predicciones');
    } finally {
      setSeedingPreds(false);
    }
  };

  const confirmDelete = (m: MatchRow) => {
    Alert.alert(
      'Eliminar partido',
      `¿Eliminar ${m.home_team} vs ${m.away_team}?`,
      [
        { text: 'Cancelar' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('matches')
              .delete()
              .eq('fixture_id', m.fixture_id);
            if (error) Alert.alert('Error', error.message);
            else await refetch();
          },
        },
      ],
    );
  };

  const bg = isDark ? '#0D0D0D' : '#F5F7FA';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff';
  const cardBorder = isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.25)';

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <LinearGradient
        colors={[CELESTE_DARK, DEEP_BLUE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.circleL} />
        <View style={s.headerRow}>
          <Pressable onPress={() => router.push('/(admin)')} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Partidos</Text>
            <Text style={s.sub}>{matches.length} partidos</Text>
          </View>
          <Pressable onPress={openCreate} style={s.addBtn}>
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={() => refetch()} style={[s.addBtn, { marginLeft: 6 }]}>
            <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <Pressable
        onPress={handleSeedTestMatch}
        disabled={seeding}
        style={[s.seedBtn, { backgroundColor: isDark ? 'rgba(110,198,255,0.12)' : CELESTE + '22', borderColor: CELESTE_DARK, marginHorizontal: 16, marginBottom: 8 }]}
      >
        <MaterialCommunityIcons name="soccer" size={18} color={CELESTE_DARK} />
        <Text style={[s.seedBtnText, { color: CELESTE_DARK }]}>
          {seeding ? 'Creando partido de prueba…' : 'Crear partido de prueba (ARG vs BRA, +15 min)'}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleSeedTestPredictions}
        disabled={seedingPreds}
        style={[s.seedBtn, { backgroundColor: isDark ? 'rgba(34,197,94,0.10)' : '#22C55E18', borderColor: '#22C55E', marginHorizontal: 16, marginBottom: 8 }]}
      >
        <MaterialCommunityIcons name="account-multiple-check" size={18} color="#22C55E" />
        <Text style={[s.seedBtnText, { color: '#22C55E' }]}>
          {seedingPreds ? 'Simulando usuarios…' : 'Simular predicciones (usuarios reales de DB)'}
        </Text>
      </Pressable>

      <View style={[s.searchBox, { backgroundColor: cardBg, borderColor: cardBorder, margin: 16, marginBottom: 8 }]}>
        <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar equipo o ID..."
          placeholderTextColor={theme.colors.muted}
          style={[s.searchInput, { color: theme.colors.text }]}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(m) => String(m.fixture_id)}
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 10, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ color: theme.colors.muted, fontSize: 14 }}>
              {isLoading ? 'Cargando...' : 'Sin partidos'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const sColor = statusColor(item.status);
          const hasResult = item.home_goals !== null && item.away_goals !== null;
          const dateStr = new Date(item.match_date).toLocaleString('es-AR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          });
          return (
            <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={s.cardTop}>
                <View style={[s.statusBadge, { backgroundColor: sColor + '20' }]}>
                  <Text style={[s.statusText, { color: sColor }]}>{item.status}</Text>
                </View>
                <Text style={[s.fixtureId, { color: theme.colors.muted }]}>#{item.fixture_id}</Text>
                <Text style={[s.dateText, { color: theme.colors.muted }]}>{dateStr}</Text>
              </View>
              <View style={s.teamsRow}>
                <Text style={[s.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                  {item.home_team}
                </Text>
                <Text style={[s.score, { color: hasResult ? CELESTE_DARK : theme.colors.muted }]}>
                  {hasResult ? `${item.home_goals} - ${item.away_goals}` : 'vs'}
                </Text>
                <Text style={[s.teamName, s.teamRight, { color: theme.colors.text }]} numberOfLines={1}>
                  {item.away_team}
                </Text>
              </View>
              {item.round ? (
                <Text style={[s.round, { color: theme.colors.muted }]}>{item.round}</Text>
              ) : null}
              <View style={s.cardActions}>
                <Pressable
                  onPress={() => openEdit(item)}
                  style={[s.actionBtn, { backgroundColor: CELESTE_DARK + '18' }]}
                >
                  <MaterialCommunityIcons name="pencil" size={14} color={CELESTE_DARK} />
                  <Text style={[s.actionText, { color: CELESTE_DARK }]}>Editar</Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete(item)}
                  style={[s.actionBtn, { backgroundColor: '#ef444418' }]}
                >
                  <MaterialCommunityIcons name="delete" size={14} color="#ef4444" />
                  <Text style={[s.actionText, { color: '#ef4444' }]}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[mo.backdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[mo.sheet, { backgroundColor: isDark ? '#151515' : '#fff', borderColor: cardBorder }]}>
            <View style={mo.sheetHeader}>
              <Text style={[mo.sheetTitle, { color: theme.colors.text }]}>
                {isEdit ? 'Editar partido' : 'Nuevo partido'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={theme.colors.muted} />
              </Pressable>
            </View>

            <ScrollView style={mo.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {!isEdit && (
                <>
                  <Text style={[mo.label, { color: theme.colors.muted }]}>Fixture ID *</Text>
                  <TextInput
                    value={form.fixture_id ? String(form.fixture_id) : ''}
                    onChangeText={(v) => setForm((f) => ({ ...f, fixture_id: parseInt(v) || 0 }))}
                    keyboardType="number-pad"
                    placeholder="ID único del partido"
                    placeholderTextColor={theme.colors.muted}
                    style={[mo.input, { color: theme.colors.text, borderColor: cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA' }]}
                  />
                </>
              )}

              <Text style={[mo.label, { color: theme.colors.muted }]}>Equipo local *</Text>
              <TextInput
                value={form.home_team ?? ''}
                onChangeText={(v) => setForm((f) => ({ ...f, home_team: v }))}
                placeholder="Ej: Argentina"
                placeholderTextColor={theme.colors.muted}
                style={[mo.input, { color: theme.colors.text, borderColor: cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA' }]}
              />

              <Text style={[mo.label, { color: theme.colors.muted }]}>Equipo visitante *</Text>
              <TextInput
                value={form.away_team ?? ''}
                onChangeText={(v) => setForm((f) => ({ ...f, away_team: v }))}
                placeholder="Ej: Francia"
                placeholderTextColor={theme.colors.muted}
                style={[mo.input, { color: theme.colors.text, borderColor: cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA' }]}
              />

              <Text style={[mo.label, { color: theme.colors.muted }]}>Fecha (ISO)</Text>
              <TextInput
                value={form.match_date ?? ''}
                onChangeText={(v) => setForm((f) => ({ ...f, match_date: v }))}
                placeholder="2026-06-12T18:00:00Z"
                placeholderTextColor={theme.colors.muted}
                autoCapitalize="none"
                style={[mo.input, { color: theme.colors.text, borderColor: cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA' }]}
              />

              <Text style={[mo.label, { color: theme.colors.muted }]}>Round / Fase</Text>
              <TextInput
                value={form.round ?? ''}
                onChangeText={(v) => setForm((f) => ({ ...f, round: v }))}
                placeholder="Ej: Group Stage - 1"
                placeholderTextColor={theme.colors.muted}
                style={[mo.input, { color: theme.colors.text, borderColor: cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA' }]}
              />

              <Text style={[mo.label, { color: theme.colors.muted }]}>Estado</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                  {STATUS_OPTIONS.map((st) => (
                    <Pressable
                      key={st}
                      onPress={() => setForm((f) => ({ ...f, status: st }))}
                      style={[mo.statusBtn, {
                        backgroundColor: form.status === st ? statusColor(st) : 'transparent',
                        borderColor: statusColor(st),
                      }]}
                    >
                      <Text style={[mo.statusBtnText, { color: form.status === st ? '#fff' : statusColor(st) }]}>
                        {st}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={[mo.label, { color: theme.colors.muted }]}>Goles local</Text>
              <TextInput
                value={form.home_goals !== null && form.home_goals !== undefined ? String(form.home_goals) : ''}
                onChangeText={(v) => setForm((f) => ({ ...f, home_goals: v === '' ? null : parseInt(v) || 0 }))}
                keyboardType="number-pad"
                placeholder="— (vacío = no jugado)"
                placeholderTextColor={theme.colors.muted}
                style={[mo.input, { color: theme.colors.text, borderColor: cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA' }]}
              />

              <Text style={[mo.label, { color: theme.colors.muted }]}>Goles visitante</Text>
              <TextInput
                value={form.away_goals !== null && form.away_goals !== undefined ? String(form.away_goals) : ''}
                onChangeText={(v) => setForm((f) => ({ ...f, away_goals: v === '' ? null : parseInt(v) || 0 }))}
                keyboardType="number-pad"
                placeholder="— (vacío = no jugado)"
                placeholderTextColor={theme.colors.muted}
                style={[mo.input, { color: theme.colors.text, borderColor: cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA' }]}
              />

              <Text style={{ color: theme.colors.muted, fontSize: 11, marginBottom: 20, lineHeight: 16 }}>
                Al guardar goles, el sistema calcula automáticamente los puntos de todas las predicciones de este partido.
              </Text>
            </ScrollView>

            <View style={[mo.footer, { borderTopColor: cardBorder }]}>
              <Pressable onPress={() => setModalVisible(false)} style={[mo.cancelBtn, { borderColor: cardBorder }]}>
                <Text style={{ color: theme.colors.muted, fontWeight: '700' }}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} style={[mo.saveBtn, { opacity: saving ? 0.7 : 1 }]}>
                <LinearGradient colors={[CELESTE_DARK, DEEP_BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={mo.saveBtnGrad}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                    {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear partido'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  circleL: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: `${CELESTE}25`, top: -60, right: -40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  seedBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  seedBtnText: { fontSize: 13, fontWeight: '700', flex: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, fontSize: 14 },
  card: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },
  fixtureId: { fontSize: 11, fontWeight: '500' },
  dateText: { flex: 1, fontSize: 11, fontWeight: '500', textAlign: 'right' },
  teamsRow: { flexDirection: 'row', alignItems: 'center' },
  teamName: { flex: 1, fontSize: 15, fontWeight: '700' },
  teamRight: { textAlign: 'right' },
  score: { width: 60, textAlign: 'center', fontSize: 16, fontWeight: '800' },
  round: { fontSize: 11, fontWeight: '500' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  actionText: { fontSize: 12, fontWeight: '700' },
});

const mo = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, maxHeight: '90%', overflow: 'hidden' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  body: { paddingHorizontal: 20 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14, marginBottom: 4 },
  statusBtn: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  statusBtnText: { fontSize: 12, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  saveBtnGrad: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
