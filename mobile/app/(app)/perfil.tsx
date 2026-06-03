import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader, ProfileStatsCard } from '../../src/components';
import { Screen } from '../../src/components/Screen';
import { profileMenu, profileStats } from '../../src/features/mockData';
import { useAuth } from '../../src/providers/AuthProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const name = user ? user.nombre : 'Usuario';
  const email = user ? (user.role === 'admin' ? `Admin: ${user.usuario}` : `Cliente: ${user.cliente_id}`) : '';

  return (
    <Screen style={styles.screen}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarLabel}>
            {user?.nombre ? user.nombre.substring(0, 2).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>

        <ProfileStatsCard {...profileStats} />

        <View style={styles.menuCard}>
          {profileMenu.map((item) => (
            <Pressable key={item.id} style={styles.menuItem}>
              <Text style={styles.menuText}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.menuItem, styles.logoutButton]}
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
          >
            <Text style={[styles.menuText, styles.logoutText]}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}


const styles = StyleSheet.create({
  screen: {
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },
  avatarBox: {
    width: 110,
    height: 110,
    borderRadius: 36,
    backgroundColor: '#CC2627',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatarLabel: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D0D0D',
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: '#5C5C5C',
    textAlign: 'center',
    marginTop: 6,
  },
  menuCard: {
    marginTop: 24,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D0D0D',
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#CC2627',
  },
});
