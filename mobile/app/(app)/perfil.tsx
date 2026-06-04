import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProfileStatsCard } from '../../src/components';
import { Screen } from '../../src/components/Screen';
import { profileStats } from '../../src/features/mockData';
import { useAuth } from '../../src/providers/AuthProvider';
import { useAppTheme } from '../../src/providers/ThemeProvider';

const MENU_ITEMS = [
  { id: 'm1', label: 'Mis Pronósticos', icon: 'trophy-outline',       route: '/(app)/pronosticos' },
  { id: 'm2', label: 'Fixture',         icon: 'calendar-outline',     route: '/(app)/fixture'     },
  { id: 'm3', label: 'Ranking',         icon: 'bar-chart-outline',    route: '/(app)/posiciones'  },
  { id: 'm4', label: 'Noticias',        icon: 'newspaper-outline',    route: '/(app)/noticias'    },
];

export default function ProfileScreen() {
  const router    = useRouter();
  const { theme } = useAppTheme();
  const { user, logout } = useAuth();

  const name    = user?.nombre ?? 'Usuario';
  const initials = name.substring(0, 2).toUpperCase();
  const subtitle = user
    ? user.role === 'admin'
      ? `Administrador · ${user.admin_id ?? ''}`
      : `Cliente · #${user.cliente_id ?? ''}`
    : '';

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────────── */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>

        {/* ── Stats ────────────────────────────────────── */}
        <View style={[styles.section, { marginTop: -20 }]}>
          <ProfileStatsCard {...profileStats} />
        </View>

        {/* ── Menu ─────────────────────────────────────── */}
        <View style={[styles.section, styles.menuCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {MENU_ITEMS.map((item, i) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [
                styles.menuItem,
                { borderBottomColor: theme.colors.divider, opacity: pressed ? 0.7 : 1 },
                i === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={[styles.menuIconBox, { backgroundColor: theme.isDark ? 'rgba(204,38,39,0.12)' : 'rgba(204,38,39,0.08)' }]}>
                <Ionicons name={item.icon as any} size={18} color={theme.colors.primary} />
              </View>
              <Text style={[styles.menuText, { color: theme.colors.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
            </Pressable>
          ))}
        </View>

        {/* ── Logout ───────────────────────────────────── */}
        <View style={styles.section}>
          <Pressable
            onPress={async () => { await logout(); router.replace('/(auth)/login'); }}
            style={({ pressed }) => [
              styles.logoutBtn,
              { borderColor: theme.colors.primary, backgroundColor: theme.isDark ? 'rgba(204,38,39,0.08)' : 'rgba(204,38,39,0.05)', opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.logoutText, { color: theme.colors.primary }]}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },

  headerCard: {
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 8,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText:   { color: '#fff', fontSize: 28, fontWeight: '800' },
  nameText:     { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitleText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' },

  section:   { paddingHorizontal: 16, marginTop: 16 },
  menuCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    borderBottomWidth: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
});
