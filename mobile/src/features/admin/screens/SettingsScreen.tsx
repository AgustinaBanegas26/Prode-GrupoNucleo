import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { useBrandingStore } from '../../content/store/brandingStore';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { useAdminActivityStore } from '../store/adminActivityStore';

export function SettingsScreen() {
  const { theme } = useAppTheme();
  const config = useBrandingStore((s) => s.config);
  const setConfig = useBrandingStore((s) => s.setConfig);
  const reset = useBrandingStore((s) => s.reset);
  const log = useAdminActivityStore((s) => s.log);

  const [draft, setDraft] = useState(config);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    try {
      setConfig({
        logoUrl: draft.logoUrl.trim(),
        primaryColor: draft.primaryColor.trim() || '#CC2627',
        secondaryColor: draft.secondaryColor.trim() || '#5C5C5C',
        appTitle: draft.appTitle.trim(),
        homeHeadline: draft.homeHeadline.trim(),
        homeSubheadline: draft.homeSubheadline.trim(),
        bannersTitle: draft.bannersTitle.trim() || 'Novedades',
      });
      log({ action: 'update', module: 'branding', title: 'Configuración actualizada' });
      Alert.alert('OK', 'Configuración actualizada');
    } finally {
      setSaving(false);
    }
  };

  const confirmReset = () => {
    Alert.alert('Restablecer', '¿Volver a la configuración por defecto?', [
      { text: 'Cancelar' },
      {
        text: 'Restablecer',
        style: 'destructive',
        onPress: () => {
          reset();
          setDraft(useBrandingStore.getState().config);
          log({ action: 'update', module: 'branding', title: 'Configuración restablecida' });
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="cog" size={32} color={theme.colors.primary} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Configuración</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Branding y textos principales
            </Text>
          </View>
          <Pressable onPress={confirmReset} style={[styles.resetBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
            <MaterialCommunityIcons name="restore" size={18} color={theme.colors.warning} />
            <Text style={[styles.resetText, { color: theme.colors.warning }]}>Reset</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TextField
            label="Logo (URL)"
            value={draft.logoUrl}
            onChangeText={(v) => setDraft((s) => ({ ...s, logoUrl: v }))}
            autoCapitalize="none"
          />
          <TextField
            label="Color primario"
            value={draft.primaryColor}
            onChangeText={(v) => setDraft((s) => ({ ...s, primaryColor: v }))}
            autoCapitalize="none"
          />
          <TextField
            label="Color secundario"
            value={draft.secondaryColor}
            onChangeText={(v) => setDraft((s) => ({ ...s, secondaryColor: v }))}
            autoCapitalize="none"
          />
          <TextField
            label="Título app"
            value={draft.appTitle}
            onChangeText={(v) => setDraft((s) => ({ ...s, appTitle: v }))}
          />
          <TextField
            label="Título Home"
            value={draft.homeHeadline}
            onChangeText={(v) => setDraft((s) => ({ ...s, homeHeadline: v }))}
          />
          <TextField
            label="Subtítulo Home"
            value={draft.homeSubheadline}
            onChangeText={(v) => setDraft((s) => ({ ...s, homeSubheadline: v }))}
          />
          <TextField
            label="Título Banners"
            value={draft.bannersTitle}
            onChangeText={(v) => setDraft((s) => ({ ...s, bannersTitle: v }))}
          />
        </View>

        <Button title={saving ? 'Guardando...' : 'Guardar cambios'} onPress={handleSave} disabled={saving} style={{ backgroundColor: theme.colors.primary }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: typography.bold as any },
  subtitle: { fontSize: 12, fontWeight: typography.regular as any, marginTop: spacing.xs },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  resetText: { fontSize: 12, fontWeight: typography.semibold as any },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
});
