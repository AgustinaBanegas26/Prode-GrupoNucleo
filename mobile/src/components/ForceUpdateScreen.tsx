import React from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import type { AppVersionInfo } from '../hooks/useAppVersion';

interface ForceUpdateScreenProps {
  remoteVersion: AppVersionInfo;
}

export function ForceUpdateScreen({ remoteVersion }: ForceUpdateScreenProps) {
  const handleUpdate = () => {
    if (remoteVersion.apkUrl) {
      Linking.openURL(remoteVersion.apkUrl);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0D0D0D', '#1A0000', '#2D0000']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconWrapper}>
          <Feather name="download-cloud" size={56} color="#CC2627" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Actualización requerida</Text>
        <Text style={styles.subtitle}>
          Para continuar usando la app necesitás instalar la versión más reciente.
        </Text>

        {/* Version info */}
        <View style={styles.versionCard}>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Nueva versión</Text>
            <Text style={styles.versionValue}>{remoteVersion.version}</Text>
          </View>
          {remoteVersion.changelog ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.changelogLabel}>Novedades</Text>
              <Text style={styles.changelog}>{remoteVersion.changelog}</Text>
            </>
          ) : null}
        </View>

        {/* CTA */}
        <Pressable
          onPress={handleUpdate}
          style={({ pressed }) => [styles.updateBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Descargar actualización"
        >
          <Feather name="download" size={18} color="#fff" />
          <Text style={styles.updateBtnText}>Descargar actualización</Text>
        </Pressable>

        <Text style={styles.hint}>
          La app no puede usarse hasta que se complete la actualización.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(204,38,39,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  versionCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  versionValue: {
    color: '#CC2627',
    fontSize: 16,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  changelogLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changelog: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  updateBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#CC2627',
    borderRadius: 16,
    height: 54,
    shadowColor: '#CC2627',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  updateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  hint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
