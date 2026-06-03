import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, FlatList, Alert, Modal, Image, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { makeEmptyNews, type NewsItem, useNewsStore } from '../../content/store/newsStore';
import { useAdminActivityStore } from '../store/adminActivityStore';

const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

export function NewsManagementScreen() {
  const { theme } = useAppTheme();
  const items = useNewsStore((s) => s.items);
  const upsert = useNewsStore((s) => s.upsert);
  const remove = useNewsStore((s) => s.remove);
  const toggleStatus = useNewsStore((s) => s.toggleStatus);
  const log = useAdminActivityStore((s) => s.log);

  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(makeEmptyNews());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((n) => (!q ? true : `${n.title} ${n.description}`.toLowerCase().includes(q)))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [items, query]);

  const openCreate = () => {
    setForm(makeEmptyNews());
    setModalVisible(true);
  };

  const openEdit = (n: NewsItem) => {
    setForm({
      id: n.id,
      title: n.title,
      imageUrl: n.imageUrl,
      description: n.description,
      date: n.date,
      status: n.status,
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert('Error', 'Completá Título y Descripción.');
      return;
    }
    if (!form.imageUrl.trim()) {
      Alert.alert('Error', 'Completá Imagen (URL).');
      return;
    }

    const existed = items.some((n) => n.id === form.id);
    setSaving(true);
    try {
      upsert({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
      });
      log({
        action: existed ? 'update' : 'create',
        module: 'news',
        title: existed ? 'Noticia actualizada' : 'Noticia creada',
        detail: form.title.trim(),
      });
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (n: NewsItem) => {
    Alert.alert('Eliminar noticia', n.title, [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          remove(n.id);
          log({ action: 'delete', module: 'news', title: 'Noticia eliminada', detail: n.title });
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: NewsItem }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.preview}>
        <View style={[styles.previewImage, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} />
        </View>
        {item.status !== 'published' && <View style={[styles.previewMask, { backgroundColor: theme.colors.overlay }]} />}
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.cardMeta, { color: theme.colors.textSecondary }]}>
              {formatDate(item.date)} · {item.status === 'published' ? 'Publicada' : 'Borrador'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              toggleStatus(item.id);
              log({
                action: 'toggle',
                module: 'news',
                title: 'Estado de noticia',
                detail: `${item.title} · ${item.status === 'published' ? 'Publicada → Borrador' : 'Borrador → Publicada'}`,
              });
            }}
            style={[
              styles.iconBtn,
              { backgroundColor: item.status === 'published' ? theme.colors.success : theme.colors.warning },
            ]}
          >
            <MaterialCommunityIcons name={item.status === 'published' ? 'eye' : 'eye-off'} size={16} color="#fff" />
          </Pressable>
        </View>

        <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.actionsRow}>
          <Pressable onPress={() => openEdit(item)} style={[styles.actionBtn, { backgroundColor: theme.colors.primaryLight }]}>
            <MaterialCommunityIcons name="pencil" size={16} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>Editar</Text>
          </Pressable>
          <Pressable onPress={() => confirmDelete(item)} style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
            <MaterialCommunityIcons name="delete" size={16} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.error }]}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.screenHeader}>
          <MaterialCommunityIcons name="newspaper-variant" size={32} color={theme.colors.primary} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Noticias</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{filtered.length} items</Text>
          </View>
          <Pressable onPress={openCreate} style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Nueva</Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por título o contenido"
              placeholderTextColor={theme.colors.placeholder}
              style={[styles.searchInput, { color: theme.colors.text }]}
              autoCapitalize="none"
            />
          </View>
        </View>

        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
        />

        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Noticia</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <TextField label="Título" value={form.title} onChangeText={(v) => setForm((s) => ({ ...s, title: v }))} />
                <TextField
                  label="Imagen (URL)"
                  value={form.imageUrl}
                  onChangeText={(v) => setForm((s) => ({ ...s, imageUrl: v }))}
                  autoCapitalize="none"
                />
                <TextField
                  label="Descripción"
                  value={form.description}
                  onChangeText={(v) => setForm((s) => ({ ...s, description: v }))}
                />

                <View style={styles.selectRow}>
                  {(['draft', 'published'] as const).map((st) => (
                    <Pressable
                      key={st}
                      onPress={() => setForm((s) => ({ ...s, status: st }))}
                      style={[
                        styles.selectPill,
                        {
                          backgroundColor: form.status === st ? theme.colors.primary : theme.colors.surfaceAlt,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.selectPillText, { color: form.status === st ? '#fff' : theme.colors.text }]}>
                        {st === 'published' ? 'Publicada' : 'Borrador'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Button title={saving ? 'Guardando...' : 'Guardar'} onPress={handleSave} disabled={saving} style={{ backgroundColor: theme.colors.primary }} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  screenHeader: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: typography.bold as any },
  subtitle: { fontSize: 12, fontWeight: typography.regular as any, marginTop: spacing.xs },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: typography.semibold as any },
  searchRow: { marginBottom: spacing.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    fontWeight: typography.regular as any,
  },
  list: { gap: spacing.md, paddingBottom: spacing.lg },
  card: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, ...shadows.md },
  preview: { height: 160, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  previewMask: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  body: { padding: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'flex-start' },
  titleCol: { flex: 1, gap: spacing.xs },
  iconBtn: { width: 32, height: 32, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: typography.semibold as any },
  cardMeta: { fontSize: 12, fontWeight: typography.regular as any },
  cardDesc: { fontSize: 12, fontWeight: typography.regular as any, lineHeight: 18 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  actionText: { fontSize: 12, fontWeight: typography.semibold as any },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalCard: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  modalTitle: { fontSize: 16, fontWeight: typography.bold as any },
  modalBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  modalFooter: { padding: spacing.lg },
  selectRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  selectPill: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1 },
  selectPillText: { fontSize: 12, fontWeight: typography.semibold as any },
});
