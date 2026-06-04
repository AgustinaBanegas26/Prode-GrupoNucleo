import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { AdminScreenHeader } from '../../../components/AdminScreenHeader';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { radius, shadows, spacing, typography } from '../../../theme/theme';
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

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NewsItem>(makeEmptyNews() as unknown as NewsItem);

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.updatedAt - a.updatedAt),
    [items],
  );

  const openCreate = () => {
    setForm(makeEmptyNews() as unknown as NewsItem);
    setModalVisible(true);
  };

  const openEdit = (n: NewsItem) => {
    setForm({ ...n });
    setModalVisible(true);
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (res.canceled) return;
    const uri = res.assets?.[0]?.uri;
    if (uri) setForm((s) => ({ ...s, imageUrl: uri }));
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert('Error', 'Completá Título y Descripción.');
      return;
    }
    if (!form.imageUrl) {
      Alert.alert('Error', 'Seleccioná una imagen.');
      return;
    }
    const existed = items.some((n) => n.id === form.id);
    setSaving(true);
    try {
      upsert({
        id: form.id,
        title: form.title.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl,
        date: form.date,
        status: form.status,
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
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        shadows.sm,
      ]}
    >
      {/* Preview image */}
      <View style={styles.preview}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
            <MaterialCommunityIcons name="image-outline" size={32} color={theme.colors.muted} />
          </View>
        )}
        {item.status !== 'published' && (
          <View style={[styles.previewMask, { backgroundColor: theme.colors.overlay }]} />
        )}
        <View style={[styles.statusPill, { backgroundColor: item.status === 'published' ? theme.colors.success : theme.colors.warning }]}>
          <Text style={styles.statusPillText}>{item.status === 'published' ? 'Publicada' : 'Borrador'}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.body}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.cardMeta, { color: theme.colors.textSecondary }]}>
          {formatDate(item.date)}
        </Text>
        <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => openEdit(item)}
            style={[styles.actionBtn, { backgroundColor: theme.colors.primaryLight }]}
          >
            <MaterialCommunityIcons name="pencil" size={15} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>Editar</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              toggleStatus(item.id);
              log({ action: 'toggle', module: 'news', title: 'Estado noticia', detail: item.title });
            }}
            style={[
              styles.actionBtn,
              {
                backgroundColor:
                  item.status === 'published'
                    ? 'rgba(255,152,0,0.12)'
                    : 'rgba(76,175,80,0.12)',
              },
            ]}
          >
            <MaterialCommunityIcons
              name={item.status === 'published' ? 'eye-off' : 'eye'}
              size={15}
              color={item.status === 'published' ? theme.colors.warning : theme.colors.success}
            />
            <Text
              style={[
                styles.actionText,
                { color: item.status === 'published' ? theme.colors.warning : theme.colors.success },
              ]}
            >
              {item.status === 'published' ? 'Despublicar' : 'Publicar'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => confirmDelete(item)}
            style={[styles.actionBtn, { backgroundColor: 'rgba(244,67,54,0.10)' }]}
          >
            <MaterialCommunityIcons name="delete" size={15} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.error }]}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <AdminScreenHeader
        title="Noticias"
        subtitle={`${items.length} artículos · ${items.filter((n) => n.status === 'published').length} publicados`}
        rightElement={
          <Pressable
            onPress={openCreate}
            style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Nueva noticia"
          >
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Nueva</Text>
          </Pressable>
        }
      />

      <FlatList
        data={sorted}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name="newspaper-variant-outline"
              size={48}
              color={theme.colors.muted}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Sin noticias aún</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>
              Creá la primera noticia para que aparezca en la app.
            </Text>
            <Pressable
              onPress={openCreate}
              style={[styles.emptyBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.emptyBtnText}>Crear primera noticia</Text>
            </Pressable>
          </View>
        }
      />

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {items.some((n) => n.id === form.id) ? 'Editar noticia' : 'Nueva noticia'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} accessibilityLabel="Cerrar">
                <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <TextField
                label="Título"
                value={form.title}
                onChangeText={(v) => setForm((s) => ({ ...s, title: v }))}
              />
              <TextField
                label="Descripción"
                value={form.description}
                onChangeText={(v) => setForm((s) => ({ ...s, description: v }))}
              />

              {/* Image picker */}
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                Imagen
              </Text>
              <Pressable
                onPress={pickImage}
                style={[
                  styles.pickerBtn,
                  { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Seleccionar imagen"
              >
                <MaterialCommunityIcons name="image-plus" size={18} color={theme.colors.primary} />
                <Text style={[styles.pickerBtnText, { color: theme.colors.text }]}>
                  {form.imageUrl ? 'Cambiar imagen' : 'Seleccionar imagen del dispositivo'}
                </Text>
              </Pressable>
              {form.imageUrl ? (
                <View
                  style={[styles.imagePreview, { borderColor: theme.colors.border }]}
                >
                  <Image
                    source={{ uri: form.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              {/* Status */}
              <View style={styles.selectRow}>
                {(['draft', 'published'] as const).map((st) => (
                  <Pressable
                    key={st}
                    onPress={() => setForm((s) => ({ ...s, status: st }))}
                    style={[
                      styles.selectPill,
                      {
                        backgroundColor:
                          form.status === st ? theme.colors.primary : theme.colors.surfaceAlt,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectPillText,
                        { color: form.status === st ? '#fff' : theme.colors.text },
                      ]}
                    >
                      {st === 'published' ? 'Publicar ahora' : 'Guardar borrador'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={saving ? 'Guardando...' : 'Guardar noticia'}
                onPress={handleSave}
                disabled={saving}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { padding: spacing.lg, paddingBottom: 100, gap: spacing.md },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  card: { borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1 },
  preview: { height: 160, position: 'relative' },
  previewMask: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  statusPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  body: { padding: spacing.lg, gap: spacing.sm },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardMeta: { fontSize: 11 },
  cardDesc: { fontSize: 12, lineHeight: 18 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 4,
  },
  actionText: { fontSize: 12, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySubtitle: { fontSize: 13, textAlign: 'center' },
  emptyBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    marginTop: spacing.sm,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalBody: { paddingHorizontal: spacing.lg },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: spacing.md },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  pickerBtnText: { fontSize: 13, fontWeight: '600' },
  imagePreview: {
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  selectRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.sm },
  selectPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  selectPillText: { fontSize: 12, fontWeight: '700' },
  modalFooter: { padding: spacing.lg },
});
