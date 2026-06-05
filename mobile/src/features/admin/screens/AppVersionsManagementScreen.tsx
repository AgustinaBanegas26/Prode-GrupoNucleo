import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { useAuth } from '../../../providers/AuthProvider';
import { adminApiFetch } from '../../../lib/backendApi';
import { supabase } from '../../../lib/supabase';
import { radius, shadows, spacing } from '../../../theme/theme';

type AppVersionRow = {
  id: string;
  version: string;
  version_code: number;
  apk_url: string;
  force_update: boolean;
  changelog: string;
  is_active: boolean;
  created_at: string;
};

export function AppVersionsManagementScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const token = user?.adminToken;

  const [version, setVersion] = useState('');
  const [versionCode, setVersionCode] = useState('');
  const [apkUrl, setApkUrl] = useState('');
  const [changelog, setChangelog] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: versions, isLoading, refetch } = useQuery({
    queryKey: ['admin_app_versions'],
    queryFn: async () => {
      if (token) {
        const res = await adminApiFetch<{ versions: AppVersionRow[] }>(
          '/admin/app/versions',
          token,
        );
        return res.versions;
      }
      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AppVersionRow[];
    },
  });

  const handleCreate = async () => {
    if (!version.trim() || !versionCode.trim() || !apkUrl.trim()) {
      Alert.alert('Error', 'Completá versión, versionCode y apkUrl');
      return;
    }
    setSaving(true);
    try {
      if (token) {
        await adminApiFetch('/admin/app/version', token, {
          method: 'POST',
          body: JSON.stringify({
            version: version.trim(),
            versionCode: Number(versionCode),
            apkUrl: apkUrl.trim(),
            forceUpdate,
            changelog: changelog.trim(),
            active: true,
          }),
        });
      } else {
        const { error } = await supabase.from('app_versions').insert({
          version: version.trim(),
          version_code: Number(versionCode),
          apk_url: apkUrl.trim(),
          force_update: forceUpdate,
          changelog: changelog.trim(),
          is_active: true,
        });
        if (error) throw error;
      }
      setVersion('');
      setVersionCode('');
      setApkUrl('');
      setChangelog('');
      await refetch();
      Alert.alert('✓', 'Versión publicada');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: AppVersionRow) => {
    try {
      if (token) {
        await adminApiFetch(`/admin/app/version/${row.id}`, token, {
          method: 'PUT',
          body: JSON.stringify({ active: !row.is_active }),
        });
      } else {
        const { error } = await supabase
          .from('app_versions')
          .update({ is_active: !row.is_active })
          .eq('id', row.id);
        if (error) throw error;
      }
      await refetch();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar');
    }
  };

  const active = versions?.find((v) => v.is_active);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => router.push('/(admin)')} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Versiones APK</Text>
          <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
            Activa: {active?.version ?? '—'} (code {active?.version_code ?? '—'})
          </Text>
        </View>
      </View>

      <FlatList
        data={versions ?? []}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListHeaderComponent={
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, shadows.md]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>NUEVA VERSIÓN</Text>
            <TextInput value={version} onChangeText={setVersion} placeholder="1.2.0" placeholderTextColor={theme.colors.placeholder} style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]} />
            <TextInput value={versionCode} onChangeText={setVersionCode} placeholder="versionCode (int)" keyboardType="number-pad" placeholderTextColor={theme.colors.placeholder} style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]} />
            <TextInput value={apkUrl} onChangeText={setApkUrl} placeholder="URL APK (Supabase Storage)" autoCapitalize="none" placeholderTextColor={theme.colors.placeholder} style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]} />
            <TextInput value={changelog} onChangeText={setChangelog} placeholder="Changelog" multiline placeholderTextColor={theme.colors.placeholder} style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, minHeight: 60 }]} />
            <View style={styles.row}>
              <Text style={{ color: theme.colors.text }}>Actualización forzada</Text>
              <Switch value={forceUpdate} onValueChange={setForceUpdate} />
            </View>
            <Pressable onPress={handleCreate} disabled={saving} style={[styles.btn, { backgroundColor: theme.colors.primary, opacity: saving ? 0.6 : 1 }]}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Publicar versión</Text>}
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.rowCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.verTitle, { color: theme.colors.text }]}>{item.version} ({item.version_code})</Text>
              <Text style={{ color: theme.colors.muted, fontSize: 12 }} numberOfLines={2}>{item.changelog || '—'}</Text>
            </View>
            <Switch value={item.is_active} onValueChange={() => toggleActive(item)} />
          </View>
        )}
        ListEmptyComponent={isLoading ? <ActivityIndicator style={{ marginTop: 24 }} /> : <Text style={{ color: theme.colors.muted, textAlign: 'center' }}>Sin versiones</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2 },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: 8, marginBottom: spacing.md },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700' },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radius.md, padding: 12 },
  verTitle: { fontSize: 15, fontWeight: '700' },
});
