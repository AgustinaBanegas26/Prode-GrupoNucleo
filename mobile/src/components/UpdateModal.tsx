import React from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAppTheme } from '../providers/ThemeProvider';
import { radius, shadows, spacing } from '../theme/theme';
import type { AppVersionInfo } from '../hooks/useAppVersion';

interface UpdateModalProps {
  visible: boolean;
  remoteVersion: AppVersionInfo;
  onDismiss: () => void;
}

export function UpdateModal({ visible, remoteVersion, onDismiss }: UpdateModalProps) {
  const { theme } = useAppTheme();

  const handleUpdate = () => {
    if (remoteVersion.apkUrl) {
      Linking.openURL(remoteVersion.apkUrl);
    }
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
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
          {/* Icon */}
          <View style={[styles.iconBox, { backgroundColor: 'rgba(204,38,39,0.10)' }]}>
            <Feather name="download-cloud" size={32} color="#CC2627" />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            Nueva versión disponible
          </Text>

          <Text style={[styles.versionBadge, { color: '#CC2627' }]}>
            v{remoteVersion.version}
          </Text>

          {remoteVersion.changelog ? (
            <Text style={[styles.changelog, { color: theme.colors.textSecondary }]}>
              {remoteVersion.changelog}
            </Text>
          ) : null}

          {/* Buttons */}
          <Pressable
            onPress={handleUpdate}
            style={({ pressed }) => [
              styles.updateBtn,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Actualizar ahora"
          >
            <Feather name="download" size={16} color="#fff" />
            <Text style={styles.updateBtnText}>Actualizar ahora</Text>
          </Pressable>

          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.laterBtn,
              { borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Más tarde"
          >
            <Text style={[styles.laterBtnText, { color: theme.colors.textSecondary }]}>
              Más tarde
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    borderRadius: radius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  versionBadge: {
    fontSize: 15,
    fontWeight: '700',
  },
  changelog: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  updateBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#CC2627',
    borderRadius: radius.xl,
    height: 50,
    marginTop: spacing.sm,
    shadowColor: '#CC2627',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  updateBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  laterBtn: {
    width: '100%',
    height: 44,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
