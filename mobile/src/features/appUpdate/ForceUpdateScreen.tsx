/**
 * ForceUpdateScreen
 *
 * Pantalla de bloqueo total cuando forceUpdate=true.
 * El usuario NO puede continuar hasta actualizar.
 */

import React from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { RemoteAppVersion } from './useAppVersion';

interface Props {
  remoteVersion: RemoteAppVersion;
}

export function ForceUpdateScreen({ remoteVersion }: Props) {
  const handleUpdate = () => {
    if (remoteVersion.apkUrl) {
      Linking.openURL(remoteVersion.apkUrl).catch(() => {});
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
        {/* Ícono */}
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="cellphone-arrow-down" size={56} color="#CC2627" />
        </View>

        {/* Título */}
        <Text style={styles.title}>Actualización requerida</Text>
        <Text style={styles.subtitle}>
          Debes actualizar la app para continuar.
        </Text>

        {/* Info de versión */}
        <View style={styles.versionCard}>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Nueva versión</Text>
            <Text style={styles.versionValue}>{remoteVersion.version}</Text>
          </View>
          {remoteVersion.changelog ? (
            <View style={styles.changelogBox}>
              <Text style={styles.changelogLabel}>Novedades</Text>
              <Text style={styles.changelogText}>{remoteVersion.changelog}</Text>
            </View>
          ) : null}
        </View>

        {/* Botón */}
        {remoteVersion.apkUrl ? (
          <Pressable
            onPress={handleUpdate}
            style={({ pressed }) => [styles.updateBtn, { opacity: pressed ? 0.85 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Descargar actualización"
          >
            <MaterialCommunityIcons name="download" size={20} color="#fff" />
            <Text style={styles.updateBtnText}>Actualizar ahora</Text>
          </Pressable>
        ) : (
          <View style={styles.noUrlBox}>
            <Text style={styles.noUrlText}>
              Contactá al administrador para obtener la última versión.
            </Text>
          </View>
        )}

        <Text style={styles.footer}>
          Prode Grupo Núcleo · Mundial 2026
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
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(204,38,39,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204,38,39,0.35)',
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
    marginTop: -12,
  },
  versionCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    gap: 12,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '600',
  },
  versionValue: {
    color: '#CC2627',
    fontSize: 16,
    fontWeight: '800',
  },
  changelogBox: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
  },
  changelogLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  changelogText: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 13,
    lineHeight: 20,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#CC2627',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 36,
    shadowColor: '#CC2627',
    shadowOffset: { width: 0, height: 6 },
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
  noUrlBox: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  noUrlText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    textAlign: 'center',
    position: 'absolute',
    bottom: 32,
  },
});
