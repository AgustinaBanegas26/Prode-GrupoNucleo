import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { radius, shadows, spacing } from '../../../theme/theme';
import {
  NotifAudience,
  useNotificationsStore,
} from '../../content/store/notificationsStore';
import { useAdminActivityStore } from '../store/adminActivityStore';

const AUDIENCE_CONFIG: { key: NotifAudience; label: string; icon: string; color: string }[] = [
  { key: 'global', label: 'Global', icon: 'globe', color: '#CC2627' },
  { key: 'group', label: 'Por grupo', icon: 'users', color: '#FF9800' },
  { key: 'individual', label: 'Individual', icon: 'user', color: '#2196F3' },
];

const AUDIENCE_LABELS: Record<NotifAudience, string> = {
  global: 'Global',
  group: 'Por grupo',
  individual: 'Individual',
};

const formatDate = (ts: number) =>
  new Date(ts).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function NotificationsManagementScreen() {
  const { theme } = useAppTheme();
  const notifications = useNotificationsStore((s) => s.notifications);
  const send = useNotificationsStore((s) => s.send);
  const remove = useNotificationsStore((s) => s.remove);
  const log = useAdminActivityStore((s) => s.log);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<NotifAudience>('global');
  const [targetGroup, setTargetGroup] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Completá título y mensaje.');
      return;
    }
    if (audience === 'group' && !targetGroup.trim()) {
      Alert.alert('Error', 'Especificá el grupo.');
      return;
    }
    if (audience === 'individual' && !targetUserId.trim()) {
      Alert.alert('Error', 'Especificá el ID del usuario.');
      return;
    }

    setSending(true);
    try {
      send({
        id: `${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        audience,
        targetGroup: audience === 'group' ? targetGroup.trim() : undefined,
        targetUserId: audience === 'individual' ? targetUserId.trim() : undefined,
      });
      log({
        action: 'create',
        module: 'notifications',
        title: 'Notificación enviada',
        detail: `${AUDIENCE_LABELS[audience]} · ${title.trim()}`,
      });
      setTitle('');
      setBody('');
      setTargetGroup('');
      setTargetUserId('');
      Alert.alert('✓', 'Notificación enviada correctamente.');
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = (id: string, t: string) => {
    Alert.alert('Eliminar', t, [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          remove(id);
          log({ action: 'delete', module: 'notifications', title: 'Notificación eliminada', detail: t });
        },
      },
    ]);
  };

  const isDark = theme.isDark;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Feather name="send" size={22} color={theme.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Notificaciones Push</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {notifications.length} enviadas
          </Text>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Compose card */}
            <View style={[styles.composeCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, shadows.md]}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>NUEVA NOTIFICACIÓN</Text>

              {/* Audience selector */}
              <View style={styles.audienceRow}>
                {AUDIENCE_CONFIG.map((a) => {
                  const active = a.key === audience;
                  return (
                    <Pressable
                      key={a.key}
                      onPress={() => setAudience(a.key)}
                      style={[
                        styles.audienceBtn,
                        { backgroundColor: active ? a.color : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'), borderColor: active ? a.color : 'transparent' },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                    >
                      <Feather name={a.icon as any} size={14} color={active ? '#fff' : theme.colors.textSecondary} />
                      <Text style={[styles.audienceText, { color: active ? '#fff' : theme.colors.textSecondary }]}>{a.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Target */}
              {audience === 'group' && (
                <>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Grupo destino</Text>
                  <TextInput
                    value={targetGroup}
                    onChangeText={setTargetGroup}
                    placeholder="Ej: Grupo A"
                    placeholderTextColor={theme.colors.placeholder}
                    style={[styles.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                  />
                </>
              )}
              {audience === 'individual' && (
                <>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>ID de usuario</Text>
                  <TextInput
                    value={targetUserId}
                    onChangeText={setTargetUserId}
                    placeholder="Ej: 0001"
                    placeholderTextColor={theme.colors.placeholder}
                    keyboardType="number-pad"
                    style={[styles.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                  />
                </>
              )}

              {/* Title */}
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Título</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ej: ¡Comienza el Mundial!"
                placeholderTextColor={theme.colors.placeholder}
                style={[styles.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
              />

              {/* Body */}
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Mensaje</Text>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Escribí el contenido de la notificación..."
                placeholderTextColor={theme.colors.placeholder}
                multiline
                numberOfLines={3}
                style={[styles.textArea, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
              />

              {/* Send button */}
              <Pressable
                onPress={handleSend}
                disabled={sending}
                style={({ pressed }) => [styles.sendBtn, { opacity: pressed || sending ? 0.8 : 1 }, shadows.glow]}
              >
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.sendBtnText}>{sending ? 'Enviando...' : 'Enviar notificación'}</Text>
              </Pressable>
            </View>

            {notifications.length > 0 && (
              <Text style={[styles.historyLabel, { color: theme.colors.textSecondary }]}>HISTORIAL</Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={[styles.notifItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, shadows.sm]}>
            <View style={styles.notifLeft}>
              <View style={[styles.notifIcon, { backgroundColor: AUDIENCE_CONFIG.find((a) => a.key === item.audience)?.color ?? '#CC2627' }]}>
                <Feather name={(AUDIENCE_CONFIG.find((a) => a.key === item.audience)?.icon ?? 'bell') as any} size={14} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, { color: theme.colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.notifBody, { color: theme.colors.textSecondary }]} numberOfLines={2}>{item.body}</Text>
                <Text style={[styles.notifMeta, { color: theme.colors.muted }]}>
                  {AUDIENCE_LABELS[item.audience]}
                  {item.targetGroup ? ` · ${item.targetGroup}` : ''}
                  {item.targetUserId ? ` · Usuario ${item.targetUserId}` : ''}
                  {' · '}{formatDate(item.sentAt)}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => confirmDelete(item.id, item.title)}
              style={styles.deleteBtn}
              accessibilityLabel="Eliminar notificación"
            >
              <Feather name="trash-2" size={16} color={theme.colors.error} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Feather name="bell-off" size={40} color={theme.colors.muted} />
            <Text style={[styles.emptyText, { color: theme.colors.muted }]}>Aún no se enviaron notificaciones</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  listContent: { padding: spacing.lg, paddingBottom: 100, gap: spacing.md },
  composeCard: { borderRadius: radius['2xl'], borderWidth: 1, padding: spacing.xl, gap: spacing.sm, marginBottom: spacing.lg },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: spacing.sm },
  audienceRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  audienceBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: radius.full, borderWidth: 1 },
  audienceText: { fontSize: 12, fontWeight: '700' },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: spacing.sm },
  input: { borderWidth: 1, borderRadius: radius.lg, height: 48, paddingHorizontal: spacing.md, fontSize: 14 },
  textArea: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, fontSize: 14, minHeight: 90, textAlignVertical: 'top' },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#CC2627', borderRadius: radius.xl, height: 50, marginTop: spacing.md },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  historyLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: spacing.sm },
  notifItem: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.lg, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  notifLeft: { flex: 1, flexDirection: 'row', gap: spacing.md },
  notifIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  notifBody: { fontSize: 12, lineHeight: 17, marginBottom: 4 },
  notifMeta: { fontSize: 11 },
  deleteBtn: { padding: 4 },
  emptyBox: { alignItems: 'center', paddingTop: 40, gap: spacing.md },
  emptyText: { fontSize: 13, fontWeight: '600' },
});
