import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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

const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE   = '#0F4C81';

type ActivityLog = {
  id: string;
  user_id: string;
  cliente_id: string | null;
  action: string;
  detail: string | null;
  created_at: string;
  // join con clientes
  nombre?: string;
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN:              '#22C55E',
  LOGOUT:             '#94a3b8',
  CHANGE_PASSWORD:    '#F59E0B',
  CREATE_PREDICTION:  '#3DA5F5',
  UPDATE_PREDICTION:  '#6366F1',
  CREATE_NEWS:        '#10B981',
  UPDATE_NEWS:        '#6366F1',
  DELETE_NEWS:        '#ef4444',
};

const ACTION_ICONS: Record<string, string> = {
  LOGIN:              'login',
  LOGOUT:             'logout',
  CHANGE_PASSWORD:    'lock-reset',
  CREATE_PREDICTION:  'plus-circle',
  UPDATE_PREDICTION:  'pencil-circle',
  CREATE_NEWS:        'newspaper-plus',
  UPDATE_NEWS:        'newspaper',
  DELETE_NEWS:        'delete',
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

export function UserActivityScreen() {
  const { theme } = useAppTheme();
  const isDark    = theme.isDark;
  const router    = useRouter();

  const [logs,    setLogs]    = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const [filter,  setFilter]  = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data) {
      // Schema real: id, cliente_id, action, metadata (jsonb), created_at
      const clienteIds = [...new Set(data.map((d: any) => d.cliente_id).filter(Boolean))];
      let nombreMap: Record<string, string> = {};
      if (clienteIds.length > 0) {
        const { data: clientes } = await supabase
          .from('clientes')
          .select('cliente_id, nombre')
          .in('cliente_id', clienteIds);
        for (const c of clientes ?? []) {
          nombreMap[c.cliente_id] = c.nombre;
        }
      }
      setLogs(data.map((d: any) => ({
        id:         d.id,
        user_id:    d.cliente_id ?? '',
        cliente_id: d.cliente_id ?? null,
        action:     d.action,
        detail:     d.metadata?.detail ?? null,
        created_at: d.created_at,
        nombre:     nombreMap[d.cliente_id] ?? d.cliente_id ?? 'Admin',
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('activity-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, fetchLogs)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const actions = useMemo(() => {
    const all = [...new Set(logs.map(l => l.action))];
    return ['all', ...all];
  }, [logs]);

  const filtered = useMemo(() => {
    let arr = [...logs];
    if (filter !== 'all') arr = arr.filter(l => l.action === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(l =>
        (l.nombre ?? '').toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.detail ?? '').toLowerCase().includes(q)
      );
    }
    return arr;
  }, [logs, filter, query]);

  const bg         = isDark ? '#0D0D0D' : '#F5F7FA';
  const cardBg     = isDark ? 'rgba(255,255,255,0.04)' : '#fff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  return (
    <ScrollView style={[s.root, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[CELESTE_DARK, DEEP_BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.circleL} />
        <FadeSlide delay={0}>
          <View style={s.headerRow}>
            <Pressable onPress={() => router.push('/(admin)')} style={s.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Actividad</Text>
              <Text style={s.sub}>{filtered.length} eventos registrados</Text>
            </View>
            <Pressable onPress={fetchLogs} style={s.backBtn}>
              <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
            </Pressable>
          </View>
        </FadeSlide>
      </LinearGradient>

      <View style={s.content}>
        <FadeSlide delay={40}>
          <View style={[s.searchBox, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
          }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.muted} />
            <TextInput
              value={query} onChangeText={setQuery}
              placeholder="Buscar en actividad..."
              placeholderTextColor={theme.colors.muted}
              style={[s.searchInput, { color: theme.colors.text }]}
            />
          </View>
        </FadeSlide>

        <FadeSlide delay={70}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
            {actions.slice(0, 8).map(a => {
              const active = filter === a;
              const color  = ACTION_COLORS[a] ?? CELESTE_DARK;
              return (
                <Pressable key={a} onPress={() => setFilter(a)}
                  style={[s.filterBtn, {
                    borderColor: active ? color : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
                    backgroundColor: active ? `${color}18` : 'transparent',
                  }]}>
                  <Text style={[s.filterTxt, { color: active ? color : theme.colors.muted }]}>
                    {a === 'all' ? 'Todos' : a.replace(/_/g, ' ')}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </FadeSlide>

        {loading ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color={CELESTE_DARK} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={{ fontSize: 36 }}>📋</Text>
            <Text style={[s.emptyTxt, { color: theme.colors.muted }]}>Sin actividad registrada</Text>
          </View>
        ) : (
          filtered.map((log, idx) => {
            const color  = ACTION_COLORS[log.action] ?? theme.colors.muted;
            const icon   = ACTION_ICONS[log.action] ?? 'circle-outline';
            const dateStr = new Date(log.created_at).toLocaleString('es-AR', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            });
            return (
              <FadeSlide key={log.id} delay={idx * 20}>
                <View style={[s.eventCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={[s.eventIcon, { backgroundColor: `${color}18` }]}>
                    <MaterialCommunityIcons name={icon as any} size={20} color={color} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[s.eventAction, { color: theme.colors.text }]}>
                      {log.action.replace(/_/g, ' ')}
                    </Text>
                    <Text style={[s.eventUser, { color: color }]}>{log.nombre}</Text>
                    {log.detail ? (
                      <Text style={[s.eventDetail, { color: theme.colors.muted }]} numberOfLines={1}>{log.detail}</Text>
                    ) : null}
                    <Text style={[s.eventTime, { color: theme.colors.muted }]}>{dateStr}</Text>
                  </View>
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
  root:       { flex: 1 },
  header:     { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  circleL:    { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: 'rgba(110,198,255,0.20)', top: -60, right: -40 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title:      { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub:        { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  content:    { padding: 16, gap: 12 },
  searchBox:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
  searchInput:{ flex: 1, height: 46, fontSize: 14 },
  filtersRow: { gap: 8, paddingVertical: 2 },
  filterBtn:  { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, marginRight: 4 },
  filterTxt:  { fontSize: 12, fontWeight: '700' },
  emptyCard:  { alignItems: 'center', paddingVertical: 48, gap: 12, borderRadius: 20, borderWidth: 1 },
  emptyTxt:   { fontSize: 14, fontWeight: '600' },
  eventCard:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  eventIcon:  { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  eventAction:{ fontSize: 13, fontWeight: '700' },
  eventUser:  { fontSize: 12, fontWeight: '600' },
  eventDetail:{ fontSize: 11, fontWeight: '500' },
  eventTime:  { fontSize: 11, fontWeight: '500' },
});
