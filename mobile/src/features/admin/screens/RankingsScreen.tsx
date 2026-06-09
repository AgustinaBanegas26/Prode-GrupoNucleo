import React, { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { useRanking, useRankingRealtime } from '../../content/api/ranking';
import { useScoringConfig, useUpdateScoringConfig } from '../../content/api/scoringConfig';
import { useAuth } from '../../../providers/AuthProvider';
import { adminApiFetch } from '../../../lib/backendApi';
import { useAutoScoringSync } from '../../../hooks/useAutoScoringSync';

const CELESTE      = '#6EC6FF';
const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE    = '#0F4C81';
const DORADO       = '#F59E0B';
const PLATA        = '#94A3B8';

type RankingPeriod = 'general' | 'semanal' | 'mensual';

function medalColor(pos: number) {
  if (pos === 1) return DORADO;
  if (pos === 2) return PLATA;
  if (pos === 3) return '#CD7F32';
  return 'rgba(128,128,128,0.4)';
}

export function RankingsScreen() {
  const { theme } = useAppTheme();
  const isDark    = theme.isDark;
  const router    = useRouter();
  const [period, setPeriod] = useState<RankingPeriod>('general');
  const [query,  setQuery]  = useState('');

  const { user } = useAuth();
  const { data: ranking = [] } = useRanking(period);
  const { data: scoring } = useScoringConfig();
  const updateScoring = useUpdateScoringConfig();
  useRankingRealtime();
  useAutoScoringSync();

  const [exactPts, setExactPts] = useState('3');
  const [winnerPts, setWinnerPts] = useState('1');
  const [drawPts, setDrawPts] = useState('1');

  React.useEffect(() => {
    if (scoring) {
      setExactPts(String(scoring.points_exact));
      setWinnerPts(String(scoring.points_winner));
      setDrawPts(String(scoring.points_draw));
    }
  }, [scoring]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ranking.filter(item => !q || item.userName.toLowerCase().includes(q));
  }, [ranking, query]);

  const bg         = isDark ? '#0D0D0D' : '#F5F7FA';
  const cardBg     = isDark ? 'rgba(255,255,255,0.05)' : '#fff';
  const cardBorder = isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.25)';
  const searchBg   = isDark ? 'rgba(255,255,255,0.06)' : '#fff';
  const textMuted  = theme.colors.muted;

  return (
    <ScrollView style={[s.root, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>

      <LinearGradient colors={[CELESTE_DARK, DEEP_BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.circleL} />
        <View style={s.circleS} />
        <View style={s.headerRow}>
          <Pressable onPress={() => router.push('/(admin)')} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View style={[s.iconBox, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <MaterialCommunityIcons name="trophy" size={22} color="#fff" />
          </View>
          <View>
            <Text style={s.title}>Rankings</Text>
            <Text style={s.sub}>{filtered.length} clasificados</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[s.content, { backgroundColor: bg }]}>

        <View style={[s.tabBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(110,198,255,0.10)' }]}>
          {(['general', 'semanal', 'mensual'] as const).map((p) => {
            const active = period === p;
            return (
              <Pressable key={p} onPress={() => setPeriod(p)}
                style={[s.tabItem, active && { backgroundColor: CELESTE_DARK }]}>
                <Text style={[s.tabText, { color: active ? '#fff' : theme.colors.textSecondary }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[s.searchBox, { backgroundColor: searchBg, borderColor: isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.3)', shadowColor: CELESTE }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar usuario"
            placeholderTextColor={theme.colors.placeholder}
            style={[s.searchInput, { color: theme.colors.text }]}
            autoCapitalize="none"
          />
        </View>

        <View style={s.tableHeader}>
          <Text style={[s.th, { color: textMuted }]}>#</Text>
          <Text style={[s.th, s.thUser, { color: textMuted }]}>Usuario</Text>
          <Text style={[s.th, { color: textMuted, textAlign: 'right' }]}>Pts</Text>
          <Text style={[s.th, { color: textMuted, textAlign: 'right' }]}>PJ</Text>
        </View>

        <View style={[s.configCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[s.configTitle, { color: theme.colors.text }]}>Tabla de puntuación</Text>
          <View style={s.configRow}>
            <Text style={{ color: textMuted, flex: 1 }}>Resultado exacto</Text>
            <TextInput value={exactPts} onChangeText={setExactPts} keyboardType="number-pad" style={[s.configInput, { color: theme.colors.text, borderColor: cardBorder }]} />
          </View>
          <View style={s.configRow}>
            <Text style={{ color: textMuted, flex: 1 }}>Ganador correcto</Text>
            <TextInput value={winnerPts} onChangeText={setWinnerPts} keyboardType="number-pad" style={[s.configInput, { color: theme.colors.text, borderColor: cardBorder }]} />
          </View>
          <View style={s.configRow}>
            <Text style={{ color: textMuted, flex: 1 }}>Empate correcto</Text>
            <TextInput value={drawPts} onChangeText={setDrawPts} keyboardType="number-pad" style={[s.configInput, { color: theme.colors.text, borderColor: cardBorder }]} />
          </View>
          <Pressable
            onPress={async () => {
              try {
                await updateScoring.mutateAsync({
                  points_exact: parseInt(exactPts, 10) || 3,
                  points_winner: parseInt(winnerPts, 10) || 1,
                  points_draw: parseInt(drawPts, 10) || 1,
                });
                Alert.alert('✓', 'Puntuación actualizada');
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
              }
            }}
            style={[s.recalcBtn, { backgroundColor: CELESTE_DARK }]}
          >
            <Text style={s.recalcText}>Guardar tabla</Text>
          </Pressable>
          <Text style={[s.autoHint, { color: textMuted }]}>
            Los puntos se actualizan automáticamente desde la API al finalizar cada partido.
          </Text>
          <Pressable
            onPress={() => {
              Alert.alert(
                '⚠️ Resetear estadísticas',
                'Se borrarán puntos, predicciones y ranking. Los usuarios y sus datos permanecen intactos.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Confirmar reset',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        if (!user?.adminToken) {
                          Alert.alert('Error', 'Se requiere token admin');
                          return;
                        }
                        await adminApiFetch('/admin/reset-stats', user.adminToken, { method: 'DELETE' });
                        Alert.alert('✓', 'Estadísticas reseteadas. Usuarios intactos.');
                      } catch (e) {
                        Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo resetear');
                      }
                    },
                  },
                ],
              );
            }}
            style={[s.recalcBtn, { backgroundColor: '#CC2627' }]}
          >
            <Text style={s.recalcText}>Resetear estadísticas</Text>
          </Pressable>
        </View>

        <View style={s.list}>
          {filtered.map((item, idx) => {
            const pos = item.position ?? idx + 1;
            const medal = medalColor(pos);
            return (
              <View key={item.id} style={[s.row, { backgroundColor: cardBg, borderColor: cardBorder, shadowColor: CELESTE }]}>
                <Text style={[s.rank, { color: medal }]}>{pos}</Text>
                <Text style={[s.rowName, { color: theme.colors.text }]} numberOfLines={1}>{item.userName}</Text>
                <Text style={[s.rowPts, { color: CELESTE_DARK }]}>{item.points}</Text>
                <Text style={[s.rowPj, { color: textMuted }]}>{item.played}</Text>
              </View>
            );
          })}
        </View>

      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  circleL:     { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1.5, borderColor: `${CELESTE}30`, top: -50, right: -40 },
  circleS:     { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1,   borderColor: `${CELESTE}20`, top: 30,  right: 60  },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  iconBox:     { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  title:       { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub:         { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  content:     { padding: 16, gap: 14 },
  tabBar:      { flexDirection: 'row', borderRadius: 20, padding: 4 },
  tabItem:     { flex: 1, paddingVertical: 9, paddingHorizontal: 22, borderRadius: 18, alignItems: 'center' },
  tabText:     { fontSize: 14, fontWeight: '700' },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, height: 46, fontSize: 14 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  th:          { flex: 1, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  thUser:      { flex: 3 },
  list:        { gap: 8, paddingBottom: 40 },
  row:         { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14, gap: 10, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  rank:        { width: 26, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  rowName:     { flex: 3, fontSize: 13, fontWeight: '600' },
  rowPts:      { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '800' },
  rowPj:       { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '500' },
  configCard:  { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10, marginBottom: 8 },
  configTitle: { fontSize: 15, fontWeight: '800' },
  configRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  configInput: { width: 56, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, textAlign: 'center', fontWeight: '700' },
  recalcBtn:   { borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  recalcText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  autoHint:    { fontSize: 12, fontWeight: '500', lineHeight: 18, textAlign: 'center' },
});
