import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, FlatList, Alert, Modal, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { makeEmptySlide, type Slide, useSliderStore } from '../../content/store/sliderStore';
import { useAdminActivityStore } from '../store/adminActivityStore';

export function SliderManagementScreen() {
  const { theme } = useAppTheme();
  const slides = useSliderStore((s) => s.slides);
  const upsert = useSliderStore((s) => s.upsert);
  const remove = useSliderStore((s) => s.remove);
  const toggleStatus = useSliderStore((s) => s.toggleStatus);
  const reorder = useSliderStore((s) => s.reorder);
  const log = useAdminActivityStore((s) => s.log);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(makeEmptySlide());

  const sorted = useMemo(() => [...slides].sort((a, b) => a.order - b.order), [slides]);

  const openCreate = () => {
    setForm(makeEmptySlide());
    setModalVisible(true);
  };

  const openEdit = (s: Slide) => {
    setForm({
      id: s.id,
      title: s.title,
      description: s.description,
      imageUrl: s.imageUrl,
      button: {
        enabled: s.button.enabled,
        text: s.button.text,
        internalLink: s.button.internalLink ?? '',
        externalLink: s.button.externalLink ?? '',
      },
      order: s.order,
      status: s.status,
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.imageUrl.trim()) {
      Alert.alert('Error', 'Completá Título e Imagen (URL).');
      return;
    }

    if (form.button.enabled && !form.button.text.trim()) {
      Alert.alert('Error', 'Si el botón está activo, completá el texto del botón.');
      return;
    }

    const existed = slides.some((s) => s.id === form.id);
    setSaving(true);
    try {
      const internal = form.button.internalLink?.trim() || undefined;
      const external = form.button.externalLink?.trim() || undefined;
      upsert({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        button: {
          enabled: form.button.enabled,
          text: form.button.text.trim(),
          internalLink: internal,
          externalLink: external,
        },
      });
      log({
        action: existed ? 'update' : 'create',
        module: 'slider',
        title: existed ? 'Slide actualizado' : 'Slide creado',
        detail: form.title.trim(),
      });
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (s: Slide) => {
    Alert.alert('Eliminar slide', s.title, [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          remove(s.id);
          log({ action: 'delete', module: 'slider', title: 'Slide eliminado', detail: s.title });
        },
      },
    ]);
  };

  const move = (id: string, dir: 'up' | 'down') => {
    const ids = sorted.map((s) => s.id);
    const idx = ids.indexOf(id);
    if (idx < 0) return;
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === ids.length - 1) return;
    const next = [...ids];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    reorder(next);
    log({ action: 'update', module: 'slider', title: 'Orden del slider actualizado' });
  };

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.preview}>
        <View style={[styles.previewImage, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} />
        </View>
        {item.status !== 'active' && <View style={[styles.previewMask, { backgroundColor: theme.colors.overlay }]} />}
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={[styles.cardMeta, { color: theme.colors.textSecondary }]}>Orden #{item.order}</Text>
            {item.button.enabled ? (
              <Text style={[styles.cardMeta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                Botón: {item.button.text}
              </Text>
            ) : null}
          </View>

          <View style={styles.headerActions}>
            <Pressable onPress={() => move(item.id, 'up')} style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
              <MaterialCommunityIcons name="chevron-up" size={18} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={() => move(item.id, 'down')} style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
              <MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.text} />
            </Pressable>
            <Pressable
              onPress={() => {
                toggleStatus(item.id);
                log({
                  action: 'toggle',
                  module: 'slider',
                  title: 'Estado de slide',
                  detail: `${item.title} · ${item.status === 'active' ? 'Activo → Inactivo' : 'Inactivo → Activo'}`,
                });
              }}
              style={[
                styles.iconBtn,
                { backgroundColor: item.status === 'active' ? theme.colors.success : theme.colors.warning },
              ]}
            >
              <MaterialCommunityIcons name={item.status === 'active' ? 'eye' : 'eye-off'} size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

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
          <MaterialCommunityIcons name="view-carousel" size={32} color={theme.colors.primary} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Slider</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{sorted.length} slides</Text>
          </View>
          <Pressable onPress={openCreate} style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Agregar</Text>
          </Pressable>
        </View>

        <FlatList
          data={sorted}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
        />

        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Slide</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <TextField label="Título" value={form.title} onChangeText={(v) => setForm((s) => ({ ...s, title: v }))} />
                <TextField
                  label="Descripción"
                  value={form.description}
                  onChangeText={(v) => setForm((s) => ({ ...s, description: v }))}
                />
                <TextField
                  label="Imagen (URL)"
                  value={form.imageUrl}
                  onChangeText={(v) => setForm((s) => ({ ...s, imageUrl: v }))}
                  autoCapitalize="none"
                />

                <View style={styles.selectRow}>
                  <Pressable
                    onPress={() => setForm((s) => ({ ...s, status: s.status === 'active' ? 'inactive' : 'active' }))}
                    style={[
                      styles.selectPill,
                      {
                        backgroundColor: form.status === 'active' ? theme.colors.success : theme.colors.warning,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.selectPillText, { color: '#fff' }]}>
                      {form.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setForm((s) => ({ ...s, button: { ...s.button, enabled: !s.button.enabled } }))}
                    style={[
                      styles.selectPill,
                      {
                        backgroundColor: form.button.enabled ? theme.colors.primary : theme.colors.surfaceAlt,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.selectPillText, { color: form.button.enabled ? '#fff' : theme.colors.text }]}>
                      Botón {form.button.enabled ? 'ON' : 'OFF'}
                    </Text>
                  </Pressable>
                </View>

                {form.button.enabled ? (
                  <View style={styles.buttonSection}>
                    <TextField
                      label="Texto del botón"
                      value={form.button.text}
                      onChangeText={(v) => setForm((s) => ({ ...s, button: { ...s.button, text: v } }))}
                    />
                    <TextField
                      label="Link interno (opcional)"
                      value={form.button.internalLink ?? ''}
                      onChangeText={(v) => setForm((s) => ({ ...s, button: { ...s.button, internalLink: v } }))}
                      autoCapitalize="none"
                    />
                    <TextField
                      label="Link externo (opcional)"
                      value={form.button.externalLink ?? ''}
                      onChangeText={(v) => setForm((s) => ({ ...s, button: { ...s.button, externalLink: v } }))}
                      autoCapitalize="none"
                    />
                  </View>
                ) : null}
              </View>

              <View style={styles.modalFooter}>
                <Button
                  title={saving ? 'Guardando...' : 'Guardar'}
                  onPress={handleSave}
                  disabled={saving}
                  style={{ backgroundColor: theme.colors.primary }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  screenHeader: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: typography.bold as any,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: typography.regular as any,
    marginTop: spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.md,
  },
  preview: {
    height: 180,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    gap: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: typography.regular as any,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  actionText: {
    fontSize: 12,
    fontWeight: typography.semibold as any,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: typography.bold as any,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  modalFooter: {
    padding: spacing.lg,
  },
  selectRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  selectPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  selectPillText: {
    fontSize: 12,
    fontWeight: typography.semibold as any,
  },
  buttonSection: {
    gap: spacing.md,
  },
});
