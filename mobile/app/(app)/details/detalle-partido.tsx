import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '../../../src/components/Screen';
import { Button } from '../../../src/components/Button';
import { useMatchById, useMatchesRealtime } from '../../../src/features/content/api/matches';
import { usePredictions, useUpsertPrediction } from '../../../src/features/content/api/predictions';
import { useAppTheme } from '../../../src/providers/ThemeProvider';
import { useAuth } from '../../../src/providers/AuthProvider';
import { getFlagEmoji } from '../../../src/theme/theme';

const LOCK_MINUTES = 10;

function TeamDisplay({ logo, code, name }: { logo?: string | null; code: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const { theme } = useAppTheme();
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      {logo && !failed
        ? <Image source={{ uri: logo }} style={{ width: 72, height: 72 }} resizeMode="contain" onError={() => setFailed(true)} />
        : <Text style={{ fontSize: 56, lineHeight: 72 }}>{getFlagEmoji(code)}</Text>
      }
      <Text style={[{ color: theme.colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center', maxWidth: 100 }]} numberOfLines={2}>{name}</Text>
    </View>
  );
}

const tabs = ['Pronóstico', 'Info'] as const;
type TabOption = typeof tabs[number];

export default function MatchDetailsScreen() {
  const { theme } = useAppTheme();
  const { user }  = useAuth();
  const router    = useRouter();
  const params    = useLocalSearchParams<{ matchId?: string }>();

  const fixtureId = params.matchId ? Number(params.matchId) : undefined;

  useMatchesRealtime();
  const { data: match, isLoading } = useMatchById(fixtureId);
  const { data: predictions }      = usePredictions(user?.cliente_id);
  const upsert = useUpsertPrediction();

  const [selectedTab, setSelectedTab] = useState<TabOption>('Pronóstico');
  const [winner,   setWinner]   = useState<'home' | 'draw' | 'away'>('home');
  const [scoreH,   setScoreH]   = useState('');
  const [scoreA,   setScoreA]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSavedMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pronóstico existente para este partido
  const existing = useMemo(
    () => predictions?.find(p => p.fixture_id === fixtureId),
    [predictions, fixtureId]
  );

  // Lock 10 minutos antes
  const isLocked = useMemo(() => {
    if (!match?.match_date) return false;
    const matchTime = new Date(match.match_date).getTime();
    const lockTime  = matchTime - LOCK_MINUTES * 60 * 1000;
    return Date.now() >= lockTime;
  }, [match?.match_date]);

  const handleSave = async () => {
    if (!user || !fixtureId || isLocked) return;
    if (scoreH === '' || scoreA === '') {
      setErrorMsg('Completá el resultado exacto');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      await upsert.mutateAsync({
        user_id:    user.id,
        cliente_id: user.cliente_id ?? user.id,
        fixture_id: fixtureId,
        pick_winner: winner,
        score_home: Number(scoreH),
        score_away: Number(scoreA),
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Error al guardar pronóstico');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>← Volver</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.muted, marginTop: 12 }}>Cargando partido...</Text>
        </View>
      </Screen>
    );
  }

  if (!match) {
    return (
      <Screen>
        <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>← Volver</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 36 }}>⚽</Text>
          <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 16 }}>Partido no encontrado</Text>
          <Text style={{ color: theme.colors.muted, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 }}>
            Este partido aún no está en la base de datos. El administrador debe cargarlo.
          </Text>
        </View>
      </Screen>
    );
  }

  const homeCode = match.home_team?.substring(0, 3).toUpperCase() ?? 'LOC';
  const awayCode = match.away_team?.substring(0, 3).toUpperCase() ?? 'VIS';

  return (
    <Screen style={{ paddingBottom: 20 }}>
      <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>← Volver</Text>
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Header del partido */}
        <View style={[s.matchHeader, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TeamDisplay logo={match.home_logo} code={homeCode} name={match.home_team} />
          <View style={s.centerInfo}>
            {match.home_goals !== null && match.away_goals !== null ? (
              <Text style={[s.score, { color: theme.colors.text }]}>
                {match.home_goals} – {match.away_goals}
              </Text>
            ) : (
              <Text style={[s.vsText, { color: theme.colors.muted }]}>VS</Text>
            )}
            <Text style={[s.dateText, { color: theme.colors.muted }]}>
              {new Date(match.match_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            </Text>
            <Text style={[s.timeText, { color: theme.colors.textSecondary }]}>
              {new Date(match.match_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {match.venue ? (
              <Text style={[s.venueText, { color: theme.colors.muted }]} numberOfLines={1}>{match.venue}</Text>
            ) : null}
          </View>
          <TeamDisplay logo={match.away_logo} code={awayCode} name={match.away_team} />
        </View>

        {/* Status */}
        {match.status && match.status !== 'NS' && match.status !== 'TBD' ? (
          <View style={[s.statusBadge, { backgroundColor: match.status === 'FT' ? 'rgba(100,100,100,0.1)' : 'rgba(34,197,94,0.12)' }]}>
            <Text style={[s.statusText, { color: match.status === 'FT' ? theme.colors.muted : '#22C55E' }]}>
              {match.status === 'FT' ? '🏁 Finalizado' :
               match.status === '1H' || match.status === '2H' ? `⚡ En juego` :
               match.status === 'HT' ? '⏸ Medio tiempo' : match.status}
            </Text>
          </View>
        ) : null}

        {/* Tabs */}
        <View style={s.tabRow}>
          {tabs.map(tab => {
            const selected = tab === selectedTab;
            return (
              <Pressable key={tab} onPress={() => setSelectedTab(tab)}
                style={[s.tabItem, selected && { backgroundColor: theme.colors.primary }]}>
                <Text style={[s.tabLabel, { color: selected ? '#fff' : theme.colors.text }]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedTab === 'Pronóstico' ? (
          <View style={s.section}>
            {isLocked ? (
              <View style={[s.lockedBox, { backgroundColor: 'rgba(0,0,0,0.05)', borderColor: 'rgba(0,0,0,0.1)' }]}>
                <Text style={{ fontSize: 28 }}>🔒</Text>
                <Text style={[s.lockedTitle, { color: theme.colors.text }]}>Pronósticos cerrados</Text>
                <Text style={[s.lockedSub, { color: theme.colors.muted }]}>
                  Las predicciones para este partido ya fueron cerradas.
                </Text>
                {existing && (
                  <View style={[s.existingBox, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}>
                    <Text style={[{ color: theme.colors.primary, fontWeight: '700', fontSize: 13 }]}>
                      Tu pronóstico: {match.home_team} {existing.score_home} – {existing.score_away} {match.away_team}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <>
                {existing && (
                  <View style={[s.existingBox, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary, marginBottom: 16 }]}>
                    <Text style={[{ color: theme.colors.primary, fontWeight: '700', fontSize: 13 }]}>
                      Pronóstico guardado: {existing.score_home} – {existing.score_away}
                    </Text>
                  </View>
                )}

                <Text style={[s.sectionTitle, { color: theme.colors.text }]}>¿Quién ganará?</Text>
                <View style={s.optionsRow}>
                  {(['home', 'draw', 'away'] as const).map(opt => (
                    <Pressable key={opt}
                      style={[s.optionButton, winner === opt && { backgroundColor: theme.colors.primary }]}
                      onPress={() => setWinner(opt)}>
                      <Text style={[s.optionText, { color: winner === opt ? '#fff' : theme.colors.text }]}>
                        {opt === 'home' ? match.home_team : opt === 'away' ? match.away_team : 'Empate'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[s.sectionTitle, { color: theme.colors.text }]}>Resultado exacto</Text>
                <View style={s.exactRow}>
                  <View style={s.exactTeam}>
                    <Text style={[s.exactTeamName, { color: theme.colors.textSecondary }]} numberOfLines={1}>{match.home_team}</Text>
                    <TextInput
                      style={[s.exactInput, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                      value={scoreH} onChangeText={(v: string) => setScoreH(v.replace(/[^0-9]/g, '').slice(0, 2))}
                      keyboardType="number-pad" maxLength={2} placeholder="0"
                      placeholderTextColor={theme.colors.placeholder} textAlign="center"
                      // @ts-ignore web
                      outlineStyle="none"
                    />
                  </View>
                  <Text style={[s.exactVs, { color: theme.colors.muted }]}>–</Text>
                  <View style={s.exactTeam}>
                    <Text style={[s.exactTeamName, { color: theme.colors.textSecondary }]} numberOfLines={1}>{match.away_team}</Text>
                    <TextInput
                      style={[s.exactInput, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                      value={scoreA} onChangeText={(v: string) => setScoreA(v.replace(/[^0-9]/g, '').slice(0, 2))}
                      keyboardType="number-pad" maxLength={2} placeholder="0"
                      placeholderTextColor={theme.colors.placeholder} textAlign="center"
                      // @ts-ignore web
                      outlineStyle="none"
                    />
                  </View>
                </View>

                {errorMsg ? (
                  <Text style={[s.errorText, { color: theme.colors.primary }]}>{errorMsg}</Text>
                ) : null}

                {saved ? (
                  <View style={[s.successBox, { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }]}>
                    <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 14 }}>✓ Pronóstico guardado</Text>
                  </View>
                ) : null}

                <Button
                  title={saving ? 'Guardando...' : existing ? 'Actualizar Pronóstico' : 'Guardar Pronóstico'}
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving || scoreH === '' || scoreA === ''}
                />
              </>
            )}
          </View>
        ) : (
          <View style={s.infoSection}>
            <View style={[s.infoRow, { borderBottomColor: theme.colors.divider }]}>
              <Text style={[s.infoLabel, { color: theme.colors.muted }]}>Estadio</Text>
              <Text style={[s.infoValue, { color: theme.colors.text }]}>{match.venue ?? 'Por confirmar'}</Text>
            </View>
            <View style={[s.infoRow, { borderBottomColor: theme.colors.divider }]}>
              <Text style={[s.infoLabel, { color: theme.colors.muted }]}>Ronda</Text>
              <Text style={[s.infoValue, { color: theme.colors.text }]}>{match.round ?? '-'}</Text>
            </View>
            <View style={[s.infoRow, { borderBottomColor: 'transparent' }]}>
              <Text style={[s.infoLabel, { color: theme.colors.muted }]}>Estado</Text>
              <Text style={[s.infoValue, { color: theme.colors.text }]}>{match.status ?? 'Por jugar'}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

// @ts-ignore react-native TextInput en web
const TextInput = require('react-native').TextInput;

const s = StyleSheet.create({
  matchHeader:   { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  centerInfo:    { alignItems: 'center', gap: 4, flex: 1 },
  score:         { fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  vsText:        { fontSize: 20, fontWeight: '800' },
  dateText:      { fontSize: 12, fontWeight: '600' },
  timeText:      { fontSize: 13, fontWeight: '700' },
  venueText:     { fontSize: 11, fontWeight: '500', maxWidth: 100, textAlign: 'center' },
  statusBadge:   { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'center', marginBottom: 16 },
  statusText:    { fontSize: 13, fontWeight: '700' },
  tabRow:        { flexDirection: 'row', marginBottom: 20, gap: 8 },
  tabItem:       { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: '#11182710' },
  tabLabel:      { fontSize: 13, fontWeight: '700' },
  section:       { gap: 4 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 8 },
  optionsRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 6 },
  optionButton:  { flex: 1, borderRadius: 18, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12, alignItems: 'center' },
  optionText:    { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  exactRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 },
  exactTeam:     { alignItems: 'center', gap: 8, flex: 1 },
  exactTeamName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  exactInput:    { width: 64, height: 64, borderRadius: 16, borderWidth: 1.5, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  exactVs:       { fontSize: 20, fontWeight: '800' },
  errorText:     { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  successBox:    { borderRadius: 10, borderWidth: 1, padding: 12, alignItems: 'center', marginBottom: 12 },
  existingBox:   { borderRadius: 12, borderWidth: 1, padding: 12 },
  lockedBox:     { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10 },
  lockedTitle:   { fontSize: 17, fontWeight: '800' },
  lockedSub:     { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  infoSection:   { borderRadius: 16, overflow: 'hidden' },
  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
  infoLabel:     { fontSize: 13, fontWeight: '600' },
  infoValue:     { fontSize: 13, fontWeight: '700' },
});
