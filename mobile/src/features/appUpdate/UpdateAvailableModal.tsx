/**
 * UpdateAvailableModal
 *
 * Modal no bloqueante cuando hay una nueva versión disponible
 * pero forceUpdate=false. El usuario puede actualizar o posponer.
 */

import React from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../providers/ThemeProvider';
import { radius, shadows, spacing } from '../../theme/theme';
import type { RemoteAppVersion } from './useAppVersion';

interface Props {
  remoteVersion: RemoteAppVersion;
  onDismiss: () => void;
}

export function UpdateAvailableModal({ remoteVersion, onDismiss }: Props) {
  const { theme } = useAppTheme();

  const handleUpdate = () => {
    if (remoteVersion.apkUrl) {
      Linking.openURL(remoteVersion.apkUrl).catch(() => {});
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            shadows.xl,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(204,38,39,0.12)' }]}>
              <MaterialCommunityIcons name="cellphone-arrow-down" size={28} color="#CC2627" />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Nueva versión disponible
              </Text>
              <Text style={[styles.versionBadge, { color: '#CC2627' }]}>
                v{remoteVersion.version}
              </Text>
            </View>
          </View>

          {/* Changelog */}
          {remoteVersion.changelog ? (
            <View
              style={[
                styles.changelogBox,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.04)',
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.changelogLabel, { color: theme.colors.muted }]}>
                NOVEDADES
              </Text>
              <Text style={[styles.changelogText, { color: theme.colors.textSecondary }]}>
                {remoteVersion.changelog}
              </Text>
            </View>
          ) : null}

          {/* Botones */}
          <View style={styles.actions}>
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [
                styles.btnSecondary,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Actualizar más tarde"
            >
              <Text style={[styles.btnSecondaryText, { color: theme.colors.textSecondary }]}>
                Más tarde
              </Text>
            </Pressable>

            <Pressable
              onPress={handleUpdate}
              style={({ pressed }) => [
                styles.btnPrimary,
                { opacity: pressed ? 0.85 : 1 },
                shadows.glow,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Actualizar ahora"
            >
              <MaterialCommunityIcons name="download" size={16} color="#fff" />
              <Text style={styles.btnPrimaryText}>Actualizar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  card: {
    width: '100%',
    borderRadius: radius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  versionBadge: {
    fontSize: 13,
    fontWeight: '700',
  },
  changelogBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  changelogLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  changelogText: {
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  btnSecondary: {
    flex: 1,
    height: 46,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnPrimary: {
    flex: 1,
    height: 46,
    borderRadius: radius.xl,
    backgroundColor: '#CC2627',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
