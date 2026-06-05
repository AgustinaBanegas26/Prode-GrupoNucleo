import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
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
import { getFlagEmoji } from '../../../theme/theme';

const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE   = '#0F4C81';

type PredRow = {
  id: string;
  cliente_id: string;
  fixture_id: number;
  pick_winner: string;
  score_home: number | null;
  score_away: number | null;
  points_earned: number;
  status: string;
  submitted_at: string;
  nombre?: string;
};

type MatchGroup = {
  fixture_id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  home_logo: string | null;
  away_logo: string | null;
  preds: PredRow[];
  expanded: boolean;
};

function FadeSlide({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function TeamImg({ logo, code, size = 32 }: { logo?: string | null; code: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (logo && !failed) {
    return <Image source={{ uri: logo }} style={{ width: size, height: size }} resizeMode="contain" onError={() => setFailed(true)} />;
  }
  return <Text style={{ fontSize: size * 0.75 }}>{getFlagEmoji(code)}</Text>;
}

export function VotedMatchesScreen() {
  const { theme }  = useAppTheme();
  const isDark     = theme.isDark;
  const router     = useRouter();

  const [groups,   setGroups]   = useState<MatchGroup[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState('');
  const [filter,   setFilter]   = useState<'all' | 'pending' | 'evaluated'>('all');

  const fetchData = async () => {
    setLoading(true);

    // Leer predicciones
    const { data: preds } = await supabase
      .from('predictions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (!preds || preds.length === 0) { setGroups([]); setLoading(false); return; }

    // Enriquecer con nombres de clientes
    const clienteIds = [...new Set(preds.map(p => p.cliente_id).filter(Boolean))];
    let nombreMap: Record<string, string> = {};
    if (clienteIds.length > 0) {
      const { data: clientes } = await supabase
        .from('clientes')
        .select('cliente_id, nombre')
        .in('cliente_id', clienteIds);
      for (const c of clientes ?? []) nombreMap[c.cliente_id] = c.nombre;
    }

    // Leer matches correspondientes
    const fixtureIds = [...new Set(preds.map(p => p.fixture_id))];
    const { data: matches } = await supabase
      .from('matches')
      .select('fixture_id, home_team, away_team, match_date, home_logo, away_logo')
      .in('fixture_id', fixtureIds);

    const matchMap: Record<number, any> = {};
    for (const m of matches ?? []) matchMap[m.fixture_id] = m;

    // Agrupar por fixture_id
    const groupMap: Record<number, MatchGroup> = {};
    for (const p of preds) {
      const m = matchMap[p.fixture_id];
      if (!groupMap[p.fixture_id]) {
        groupMap[p.fixture_id] = {
          fixture_id: p.fixture_id,
          home_team:  m?.home_team ?? `Partido #${p.fixture_id}`,
          away_team:  m?.away_team ?? '',
          match_date: m?.match_date ?? '',
          home_logo:  m?.home_logo ?? null,
          away_logo:  m?.away_logo ?? null,
          preds:      [],
          expanded:   false,
        };
      }
      groupMap[p.fixture_id].preds.push({ ...p, nombre: nombreMap[p.cliente_id] ?? p.cliente_id });
    }

    setGroups(Object.values(groupMap).sort((a, b) => a.match_date.localeCompare(b.match_date)));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Realtime
  useEffect(() => {
    const ch = supabase.channel('predictions-admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const toggleExpand = (fixtureId: number) => {
    setGroups(prev => prev.map(g => g.fixture_id === fixtureId ? { ...g, expanded: !g.expanded } : g));
  };

  const filtered = useMemo(() => {
    let arr = [...groups];
    if (filter === 'pending')   arr = arr.filter(g => g.preds.some(p => p.status === 'pending'));
    if (filter === 'evaluated') arr = arr.filter(g => g.preds.every(p => p.status !== 'pending'));
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(g =>
        g.home_team.toLowerCase().includes(q) ||
        g.away_team.toLowerCase().includes(q) ||
        g.preds.some(p => (p.nombre ?? '').toLowerCase().includes(q))
      );
    }
    return arr;
  }, [groups, filter, query]);

  const bg      = isDark ? '#0D0D0D' : '#F5F7FA';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : '#fff';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return (
    <ScrollView style={[s.root, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[CELESTE_DARK, DEEP_BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.circleL} />
        <FadeSlide>
          <View style={s.headerRow}>
            <Pressable onPress={() => router.push('/(admin)')} style={s.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Pronósticos</Text>
              <Text style={s.sub}>{groups.reduce((a, g) => a + g.preds.length, 0)} pronósticos totales</Text>
            </View>
            <Pressable onPress={fetchData} style={s.backBtn}>
              <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
            </Pressable>
          </View>
        </FadeSlide>
      </LinearGradient>

      <View style={s.content}>
        {/* Búsqueda */}
        <FadeSlide delay={30}>
          <View style={[s.searchBox, { backgroundColor: cardBg, borderColor: border }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.muted} />
            <TextInput
              value={query} onChangeText={setQuery}
              placeholder="Buscar partido o usuario..."
              placeholderTextColor={theme.colors.muted}
              style={[s.searchInput, { color: theme.colors.text }]}
            />
          </View>
        </FadeSlide>

        {/* Filtros */}
        <FadeSlide delay={50}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
            {[
              { v: 'all',       l: 'Todos',      c: CELESTE_DARK },
              { v: 'pending',   l: 'Pendientes', c: '#F59E0B' },
              { v: 'evaluated', l: 'Evaluados',  c: '#22C55E' },
            ].map(f => {
              const active = filter === f.v;
              return (
                <Pressable key={f.v} onPress={() => setFilter(f.v as any)}
                  style={[s.filterBtn, { borderColor: active ? f.c : border, backgroundColor: active ? `${f.c}18` : 'transparent' }]}>
                  <Text style={[s.filterTxt, { color: active ? f.c : theme.colors.muted }]}>{f.l}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </FadeSlide>

        {loading ? (
          <View style={{ alignItems: 'center', padding: 48 }}>
            <ActivityIndicator size="large" color={CELESTE_DARK} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={{ fontSize: 40 }}>🎯</Text>
            <Text style={[s.emptyTxt, { color: theme.colors.muted }]}>No hay pronósticos todavía</Text>
          </View>
        ) : (
          filtered.map((group, gi) => {
            const homeCode = group.home_team.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
            const awayCode = group.away_team.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
            const dateStr  = group.match_date
              ? new Date(group.match_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
              : '';
            const hasPending = group.preds.some(p => p.status === 'pending');

            return (
              <FadeSlide key={group.fixture_id} delay={gi * 25}>
                <View style={[s.groupCard, { backgroundColor: cardBg, borderColor: border }]}>
                  {/* Header del grupo */}
                  <Pressable onPress={() => toggleExpand(group.fixture_id)} style={s.groupHeader}>
                    <View style={s.teamsRow}>
                      <TeamImg logo={group.home_logo} code={homeCode} size={28} />
                      <Text style={[s.matchName, { color: theme.colors.text }]}>
                        {group.home_team} vs {group.away_team}
                      </Text>
                      <TeamImg logo={group.away_logo} code={awayCode} size={28} />
                    </View>
                    <View style={s.groupMeta}>
                      <Text style={[s.groupDate, { color: theme.colors.muted }]}>{dateStr}</Text>
                      <View style={[s.countBadge, { backgroundColor: hasPending ? '#F59E0B18' : '#22C55E18' }]}>
                        <Text style={[s.countText, { color: hasPending ? '#F59E0B' : '#22C55E' }]}>
                          {group.preds.length} pronósticos
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={group.expanded ? 'chevron-up' : 'chevron-down'}
                        size={18} color={theme.colors.muted}
                      />
                    </View>
                  </Pressable>

                  {/* Predicciones expandidas */}
                  {group.expanded && (
                    <View style={[s.predsContainer, { borderTopColor: border }]}>
                      {group.preds.map(p => {
                        const statusColor = p.status === 'correct' ? '#22C55E' : p.status === 'partial' ? '#F59E0B' : p.status === 'incorrect' ? '#ef4444' : theme.colors.muted;
                        const statusLabel = p.status === 'correct' ? '✓ Exacto' : p.status === 'partial' ? '~ Ganador' : p.status === 'incorrect' ? '✗ Error' : 'Pendiente';
                        const pickLabel   = p.pick_winner === 'home' ? group.home_team : p.pick_winner === 'away' ? group.away_team : 'Empate';
                        return (
                          <View key={p.id} style={[s.predRow, { borderBottomColor: border }]}>
                            <View style={[s.predAvatar, { backgroundColor: `${CELESTE_DARK}18` }]}>
                              <Text style={[s.predAvatarText, { color: CELESTE_DARK }]}>
                                {(p.nombre ?? p.cliente_id).substring(0, 2).toUpperCase()}
                              </Text>
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                              <Text style={[s.predName, { color: theme.colors.text }]}>{p.nombre ?? p.cliente_id}</Text>
                              <Text style={[s.predPick, { color: theme.colors.muted }]}>
                                {pickLabel} · {p.score_home ?? '-'} – {p.score_away ?? '-'}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 2 }}>
                              <Text style={[s.predStatus, { color: statusColor }]}>{statusLabel}</Text>
                              {p.points_earned > 0 && (
                                <Text style={[s.predPoints, { color: CELESTE_DARK }]}>+{p.points_earned} pts</Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </FadeSlide>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, overflow: 'hidden', position: 'relative' },
  circleL:     { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: 'rgba(110,198,255,0.20)', top: -60, right: -40 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title:       { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub:         { color: 'rgba(255,255,255,0.68)', fontSize: 12, marginTop: 2 },
  content:     { padding: 16, gap: 12, paddingBottom: 60 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
  searchInput: { flex: 1, height: 46, fontSize: 14 },
  filtersRow:  { gap: 8, paddingVertical: 2 },
  filterBtn:   { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, marginRight: 4 },
  filterTxt:   { fontSize: 12, fontWeight: '700' },
  emptyCard:   { alignItems: 'center', paddingVertical: 48, gap: 12, borderRadius: 20, borderWidth: 1 },
  emptyTxt:    { fontSize: 14, fontWeight: '600' },
  groupCard:   { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  groupHeader: { padding: 14, gap: 8 },
  teamsRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  matchName:   { flex: 1, fontSize: 14, fontWeight: '700' },
  groupMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupDate:   { fontSize: 12, fontWeight: '500' },
  countBadge:  { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  countText:   { fontSize: 12, fontWeight: '700' },
  predsContainer: { borderTopWidth: 1 },
  predRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1 },
  predAvatar:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  predAvatarText: { fontSize: 12, fontWeight: '800' },
  predName:    { fontSize: 13, fontWeight: '700' },
  predPick:    { fontSize: 12, fontWeight: '500' },
  predStatus:  { fontSize: 12, fontWeight: '700' },
  predPoints:  { fontSize: 12, fontWeight: '700' },
});
