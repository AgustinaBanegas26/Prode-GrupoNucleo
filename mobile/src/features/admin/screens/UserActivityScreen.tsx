import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  Alert,
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
import { useAdminActivityStore, type AdminActivityAction, type AdminActivityModule } from '../store/adminActivityStore';

const VERDE  = '#22C55E';
const DORADO = '#F59E0B';

const formatDateTime = (ts: number) => new Date(ts).toLocaleString('es-AR');

function FadeSlide({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function iconFor(action: AdminActivityAction): string {
  const map: Record<AdminActivityAction, string> = {
    create: 'plus-circle', update: 'pencil-circle', delete: 'delete-circle',
    toggle: 'eye-circle', export: 'file-export', login: 'login', logout: 'logout',
  };
  return map[action] ?? 'circle';
}

function accentFor(action: AdminActivityAction, isDark: boolean): string {
  if (action === 'create') return isDark ? VERDE      : '#16a34a';
  if (action === 'delete') return '#ef4444';
  if (action === 'update') return isDark ? '#38bdf8'  : '#0284c7';
  if (action === 'toggle') return isDark ? DORADO     : '#d97706';
  if (action === 'export') return '#a78bfa';
  return isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
}

function labelForModule(m: AdminActivityModule): string {
  const map: Record<AdminActivityModule, string> = {
    auth: 'Auth', users: 'Usuarios', images: 'Imágenes', slider: 'Slider',
    news: 'Noticias', rewards: 'Premios', rankings: 'Rankings',
    reports: 'Reportes', participation: 'Participación', branding: 'Branding',
    matches: 'Partidos', notifications: 'Notificaciones',
  };
  return map[m] ?? m;
}

const FILTER_MODULES = ['all', 'auth', 'users', 'rankings', 'participation', 'reports'] as const;
type FilterModule = typeof FILTER_MODULES[number];

export function UserActivityScreen() {
  const { theme } = useAppTheme();
  const isDark = theme.isDark;
  const router = useRouter();
  const items  = useAdminActivityStore((s) => s.items);
  const clear  = useAdminActivityStore((s) => s.clear);

  const [query,        setQuery]        = useState('');
  const [moduleFilter, setModuleFilter] = useState<FilterModule>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const moduleOk = moduleFilter === 'all' ? true : it.module === moduleFilter;
      if (!moduleOk) return false;
      if (!q) return true;
      return `${it.title} ${it.detail ?? ''} ${it.action} ${it.module}`.toLowerCase().includes(q);
    });
  }, [items, moduleFilter, query]);

  const confirmClear = () => {
    Alert.alert('Limpiar historial', '¿Eliminar todos los eventos?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: clear },
    ]);
  };

  const bg          = isDark ? '#0a0f0a' : '#eff6ff';
  const hFrom       = isDark ? '#1e3a5f' : '#1d4ed8';
  const hTo         = isDark ? '#0a0f0a' : '#eff6ff';
  const searchBg    = isDark ? 'rgba(255,255,255,0.06)' : '#fff';
  const searchBorder= isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const textPrimary = isDark ? '#fff' : '#111';
  const textSub     = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const placeColor  = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  const magnify     = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
  const cardBg      = isDark ? 'rgba(255,255,255,0.04)' : '#fff';
  const cardBorder  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const accentBlue  = isDark ? '#38bdf8' : '#0284c7';

  return (
    <ScrollView style={[s.root, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[hFrom, hTo]} style={s.header}>
        <View style={s.circleL} />
        <FadeSlide delay={0}>
          <View style={s.headerRow}>
            <Pressable onPress={() => router.push('/(admin)')} style={s.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <LinearGradient colors={['#1e3a5f', '#0f2040']} style={s.iconGrad}>
              <MaterialCommunityIcons name="history" size={22} color="#38bdf8" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Actividad</Text>
              <Text style={s.sub}>{filtered.length} eventos registrados</Text>
            </View>
            <Pressable onPress={confirmClear} style={s.clearBtn}>
              <MaterialCommunityIcons name="delete-sweep" size={18} color="#ef4444" />
              <Text style={s.clearTxt}>Limpiar</Text>
            </Pressable>
          </View>
        </FadeSlide>
      </LinearGradient>

      <View style={s.content}>
        {/* Búsqueda */}
        <FadeSlide delay={40}>
          <View style={[s.searchBox, { backgroundColor: searchBg, borderColor: searchBorder }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={magnify} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar en historial"
              placeholderTextColor={placeColor}
              style={[s.searchInput, { color: textPrimary }]}
              autoCapitalize="none"
            />
          </View>
        </FadeSlide>

        {/* Filtros */}
        <FadeSlide delay={80}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
            {FILTER_MODULES.map((m) => {
              const active = moduleFilter === m;
              return (
                <Pressable key={m} onPress={() => setModuleFilter(m)}
                  style={[s.filterBtn, {
                    borderColor: active ? accentBlue : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'),
                    backgroundColor: active ? (isDark ? 'rgba(56,189,248,0.15)' : 'rgba(2,132,199,0.10)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  }]}>
                  <Text style={[s.filterTxt, { color: active ? accentBlue : textSub }]}>
                    {m === 'all' ? 'Todos' : labelForModule(m as AdminActivityModule)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </FadeSlide>

        {/* Lista */}
        <View style={s.list}>
          {filtered.length === 0 ? (
            <FadeSlide delay={120}>
              <View style={[s.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={{ fontSize: 36 }}>📋</Text>
                <Text style={[s.emptyTxt, { color: textSub }]}>Sin eventos para mostrar</Text>
              </View>
            </FadeSlide>
          ) : (
            filtered.map((it, idx) => {
              const accent = accentFor(it.action, isDark);
              return (
                <FadeSlide key={it.id} delay={idx * 25}>
                  <View style={[s.eventCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <View style={s.eventGrad}>
                      <View style={[s.eventIcon, { backgroundColor: accent + '20' }]}>
                        <MaterialCommunityIcons name={iconFor(it.action) as any} size={20} color={accent} />
                      </View>
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={[s.eventTitle, { color: textPrimary }]} numberOfLines={1}>{it.title}</Text>
                        <View style={s.eventMeta}>
                          <View style={[s.modulePill, { backgroundColor: accent + '18' }]}>
                            <Text style={[s.moduleTxt, { color: accent }]}>{labelForModule(it.module)}</Text>
                          </View>
                          <Text style={[s.eventTime, { color: textSub }]}>{formatDateTime(it.createdAt)}</Text>
                        </View>
                        {it.detail ? (
                          <Text style={[s.eventDetail, { color: textSub }]} numberOfLines={1}>{it.detail}</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </FadeSlide>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  header:   { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  circleL:  { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: 'rgba(56,189,248,0.20)', top: -60, right: -40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  iconGrad:  { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  title:     { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub:       { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  clearBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 11 },
  clearTxt:  { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  content:   { padding: 16, gap: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
  searchInput: { flex: 1, height: 46, fontSize: 14 },
  filtersRow:  { gap: 8, paddingVertical: 2 },
  filterBtn:   { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1 },
  filterTxt:   { fontSize: 12, fontWeight: '700' },
  list:        { gap: 8, paddingBottom: 40 },
  emptyCard:   { alignItems: 'center', paddingVertical: 48, gap: 12, borderRadius: 20, borderWidth: 1 },
  emptyTxt:    { fontSize: 14, fontWeight: '600' },
  eventCard:   { borderRadius: 16, borderWidth: 1 },
  eventGrad:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  eventIcon:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  eventTitle:  { fontSize: 13, fontWeight: '700' },
  eventMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modulePill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  moduleTxt:   { fontSize: 10, fontWeight: '700' },
  eventTime:   { fontSize: 11, fontWeight: '500' },
  eventDetail: { fontSize: 11, fontWeight: '500' },
});
