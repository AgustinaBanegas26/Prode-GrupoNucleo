import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '../../../src/components/Screen';
import {
  useDeletePrediction,
  usePredictions,
  usePredictionsRealtime,
  useUpsertPrediction,
} from '../../../src/features/content/api/predictions';
import { useMatch } from '../../../src/hooks/useApiFootball';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useAppTheme } from '../../../src/providers/ThemeProvider';
import { getFlagEmoji } from '../../../src/theme/theme';
import {
  buildMatchDate,
  isPredictionLocked,
  PREDICTION_LOCKED_MESSAGE,
} from '../../../src/utils/predictionLock';

const CELESTE = '#6EC6FF';
const CELESTE_DARK = '#3DA5F5';
const CELESTE_LIGHT = '#DDF4FF';

function TeamLogo({ logo, code, size = 64 }: { logo?: string; code: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const emoji = getFlagEmoji(code);
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
  return <Text style={{ fontSize: size * 0.75, lineHeight: size }}>{emoji}</Text>;
}

function confirmDelete(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm('¿Eliminar pronóstico?\n\nEsta acción no se puede deshacer.')) {
      onConfirm();
    }
    return;
  }
  Alert.alert(
    'Eliminar pronóstico',
    '¿Estás seguro de que querés eliminar tu pronóstico? Esta acción no se puede deshacer.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onConfirm },
    ],
  );
}

export default function PronosticoPartidoScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ fixtureId?: string }>();
  const fixtureId = params.fixtureId ? Number(params.fixtureId) : null;

  const { data: match, isLoading: matchLoading } = useMatch(fixtureId);
  const { data: predictions, refetch: refetchPredictions } = usePredictions(user?.cliente_id);
  usePredictionsRealtime();
  const upsert = useUpsertPrediction();
  const remove = useDeletePrediction();

  const existing = useMemo(
    () => predictions?.find((p) => p.fixture_id === fixtureId),
    [predictions, fixtureId],
  );

  const matchDate = useMemo(() => {
    if (!match) return null;
    return buildMatchDate(match.isoDate, match.time);
  }, [match]);

  const locked = isPredictionLocked(matchDate);
  const hasExisting = !!existing;

  const [isEditing, setIsEditing] = useState(!hasExisting);
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setHome(String(existing.score_home ?? ''));
      setAway(String(existing.score_away ?? ''));
      setIsEditing(false);
    } else {
      setHome('');
      setAway('');
      setIsEditing(true);
    }
  }, [existing?.id, existing?.score_home, existing?.score_away]);

  useEffect(() => {
    if (!matchLoading && !match && fixtureId) {
      router.replace('/(app)/pronosticos');
    }
  }, [matchLoading, match, fixtureId, router]);

  const canEdit = !locked && (isEditing || !hasExisting);
  const canSave = canEdit && home !== '' && away !== '' && !saving && !deleting;
  const inputsDisabled = locked || !canEdit || saving || deleting;

  const handleSave = async () => {
    if (!user || !fixtureId || locked || !canEdit) return;
    if (home === '' || away === '') {
      setErrorMsg('Completá el resultado de ambos equipos.');
      return;
    }

    const homeNum = Number(home);
    const awayNum = Number(away);
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await upsert.mutateAsync({
        user_id:     String(user.id),
        cliente_id:  user.cliente_id ?? String(user.id),
        fixture_id:  fixtureId,
        pick_winner: homeNum > awayNum ? 'home' : homeNum < awayNum ? 'away' : 'draw',
        score_home:  homeNum,
        score_away:  awayNum,
      });
      await refetchPredictions();
      setIsEditing(false);
      setSuccessMsg(hasExisting ? 'Pronóstico actualizado correctamente.' : 'Pronóstico guardado correctamente.');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No se pudo guardar el pronóstico.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!user || !existing || locked || deleting) return;

    confirmDelete(async () => {
      setDeleting(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      try {
        await remove.mutateAsync({
          user_id:       String(user.id),
          cliente_id:    user.cliente_id ?? String(user.id),
          prediction_id: existing.id,
          fixture_id:    fixtureId!,
        });
        await refetchPredictions();
        setHome('');
        setAway('');
        setIsEditing(true);
        setSuccessMsg('Pronóstico eliminado.');
        setTimeout(() => setSuccessMsg(null), 2500);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'No se pudo eliminar el pronóstico.');
      } finally {
        setDeleting(false);
      }
    });
  };

  if (matchLoading || !match) {
    return (
      <Screen style={{ backgroundColor: '#F5F7FA' }}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={CELESTE_DARK} />
          <Text style={{ color: theme.colors.muted, marginTop: 12 }}>Cargando partido…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={{ backgroundColor: '#F5F7FA' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={CELESTE_DARK} />
          <Text style={[s.backText, { color: CELESTE_DARK }]}>Volver</Text>
        </Pressable>

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[s.matchCard, { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.07)' }]}>
            <Text style={[s.phase, { color: theme.colors.textSecondary }]}>
              {match.group ?? match.phase}
            </Text>

            <View style={s.teamsRow}>
              <View style={s.teamCol}>
                <TeamLogo logo={match.homeLogo} code={match.homeCode} />
                <Text style={[s.teamName, { color: theme.colors.text }]} numberOfLines={2}>
                  {match.homeTeam}
                </Text>
              </View>

              <View style={s.centerCol}>
                <Text style={[s.dateText, { color: theme.colors.muted }]}>{match.date}</Text>
                <Text style={[s.timeText, { color: locked ? theme.colors.error : theme.colors.text }]}>
                  {locked ? '🔒 Cerrado' : match.time}
                </Text>
              </View>

              <View style={s.teamCol}>
                <TeamLogo logo={match.awayLogo} code={match.awayCode} />
                <Text style={[s.teamName, { color: theme.colors.text }]} numberOfLines={2}>
                  {match.awayTeam}
                </Text>
              </View>
            </View>
          </View>

          {locked ? (
            <View style={[s.lockedBanner, { backgroundColor: CELESTE_LIGHT, borderColor: 'rgba(110,198,255,0.4)' }]}>
              <Ionicons name="lock-closed" size={18} color={CELESTE_DARK} />
              <Text style={[s.lockedText, { color: '#0F4C81' }]}>{PREDICTION_LOCKED_MESSAGE}</Text>
            </View>
          ) : (
            <View style={[s.infoBanner, { backgroundColor: CELESTE_LIGHT, borderColor: 'rgba(110,198,255,0.4)' }]}>
              <Ionicons name="information-circle-outline" size={16} color={CELESTE} />
              <Text style={[s.infoText, { color: '#0F4C81' }]}>
                Podés crear, editar o eliminar tu pronóstico hasta 10 minutos antes del partido.
              </Text>
            </View>
          )}

          <View style={[s.formCard, { backgroundColor: '#FFF', borderColor: 'rgba(0,0,0,0.07)' }]}>
            <Text style={[s.formTitle, { color: theme.colors.text }]}>
              {hasExisting ? (isEditing ? 'Editar pronóstico' : 'Tu pronóstico') : 'Nuevo pronóstico'}
            </Text>

            <View style={s.scoreRow}>
              <View style={s.scoreCol}>
                <Text style={[s.scoreLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {match.homeTeam}
                </Text>
                <TextInput
                  style={[
                    s.input,
                    {
                      backgroundColor: inputsDisabled ? '#F0F2F5' : '#F5F7FA',
                      borderColor: 'rgba(0,0,0,0.12)',
                      color: theme.colors.text,
                    },
                  ]}
                  value={home}
                  onChangeText={(v) => setHome(v.replace(/[^0-9]/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="-"
                  placeholderTextColor={theme.colors.muted}
                  textAlign="center"
                  editable={!inputsDisabled}
                />
              </View>

              <Text style={[s.vs, { color: theme.colors.muted }]}>vs</Text>

              <View style={s.scoreCol}>
                <Text style={[s.scoreLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {match.awayTeam}
                </Text>
                <TextInput
                  style={[
                    s.input,
                    {
                      backgroundColor: inputsDisabled ? '#F0F2F5' : '#F5F7FA',
                      borderColor: 'rgba(0,0,0,0.12)',
                      color: theme.colors.text,
                    },
                  ]}
                  value={away}
                  onChangeText={(v) => setAway(v.replace(/[^0-9]/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="-"
                  placeholderTextColor={theme.colors.muted}
                  textAlign="center"
                  editable={!inputsDisabled}
                />
              </View>
            </View>

            {errorMsg ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={s.successBox}>
                <Text style={s.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {!locked && hasExisting && !isEditing ? (
              <View style={s.actionsRow}>
                <Pressable
                  onPress={() => {
                    setIsEditing(true);
                    setErrorMsg(null);
                  }}
                  style={[s.btn, s.btnPrimary, { flex: 1 }]}
                >
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <Text style={s.btnPrimaryText}>Editar Pronóstico</Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  disabled={deleting}
                  style={[s.btn, s.btnDanger, { flex: 1, opacity: deleting ? 0.6 : 1 }]}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      <Text style={s.btnDangerText}>Eliminar Pronóstico</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : null}

            {!locked && (isEditing || !hasExisting) ? (
              <View style={s.actionsCol}>
                <Pressable
                  onPress={handleSave}
                  disabled={!canSave}
                  style={[s.btn, s.btnPrimary, { opacity: canSave ? 1 : 0.5 }]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={s.btnPrimaryText}>
                      {hasExisting ? 'Guardar cambios' : 'Guardar Pronóstico'}
                    </Text>
                  )}
                </Pressable>

                {hasExisting ? (
                  <View style={s.secondaryRow}>
                    <Pressable
                      onPress={() => {
                        setIsEditing(false);
                        setHome(String(existing?.score_home ?? ''));
                        setAway(String(existing?.score_away ?? ''));
                        setErrorMsg(null);
                      }}
                      style={[s.btn, s.btnGhost, { flex: 1 }]}
                    >
                      <Text style={[s.btnGhostText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleDelete}
                      disabled={deleting}
                      style={[s.btn, s.btnDanger, { flex: 1, opacity: deleting ? 0.6 : 1 }]}
                    >
                      {deleting ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <Text style={s.btnDangerText}>Eliminar</Text>
                      )}
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  backText:     { fontSize: 15, fontWeight: '700' },
  scroll:       { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  matchCard:    { borderRadius: 16, borderWidth: 1, padding: 16 },
  phase:        { fontSize: 13, fontWeight: '700', marginBottom: 12 },
  teamsRow:     { flexDirection: 'row', alignItems: 'center' },
  teamCol:      { flex: 1, alignItems: 'center', gap: 8 },
  teamName:     { fontSize: 12, fontWeight: '600', textAlign: 'center', maxWidth: 100 },
  centerCol:    { width: 72, alignItems: 'center', gap: 4 },
  dateText:     { fontSize: 11, fontWeight: '500' },
  timeText:     { fontSize: 14, fontWeight: '800' },
  lockedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  lockedText:   { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  infoBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  infoText:     { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  formCard:     { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  formTitle:    { fontSize: 16, fontWeight: '800' },
  scoreRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  scoreCol:     { flex: 1, alignItems: 'center', gap: 8 },
  scoreLabel:   { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  input:        { width: 64, height: 64, borderRadius: 12, borderWidth: 1.5, fontSize: 24, fontWeight: '800' },
  vs:           { fontSize: 14, fontWeight: '700', marginTop: 20 },
  errorBox:     { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', padding: 12 },
  errorText:    { color: '#ef4444', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  successBox:   { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', padding: 12 },
  successText:  { color: '#22C55E', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  actionsRow:   { flexDirection: 'row', gap: 10 },
  actionsCol:   { gap: 10 },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  btn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14 },
  btnPrimary:   { backgroundColor: CELESTE_DARK },
  btnPrimaryText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
  btnDanger:    { backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  btnDangerText:{ color: '#ef4444', fontSize: 14, fontWeight: '700' },
  btnGhost:     { backgroundColor: 'rgba(0,0,0,0.04)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  btnGhostText: { fontSize: 14, fontWeight: '600' },
});
