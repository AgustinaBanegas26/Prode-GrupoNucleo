import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, FlatList, Alert, Modal, Image, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import {
  makeEmptyImageAsset,
  type ImageAsset,
  type ImageAssetPlacement,
  useImageAssetsStore,
} from '../../content/store/imageAssetsStore';

const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

export function ImageManagementScreen() {
  const { theme } = useAppTheme();
  const assets = useImageAssetsStore((s) => s.assets);
  const upsert = useImageAssetsStore((s) => s.upsert);
  const remove = useImageAssetsStore((s) => s.remove);
  const toggleStatus = useImageAssetsStore((s) => s.toggleStatus);

  const [query, setQuery] = useState('');
  const [placementFilter, setPlacementFilter] = useState<ImageAssetPlacement | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(makeEmptyImageAsset());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets
      .filter((a) => (placementFilter === 'all' ? true : a.placement === placementFilter))
      .filter((a) => {
        if (!q) return true;
        return `${a.title} ${a.link ?? ''}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [assets, placementFilter, query]);

  const openCreate = () => {
    setForm(makeEmptyImageAsset());
    setModalVisible(true);
  };

  const openEdit = (a: ImageAsset) => {
    setForm({
      id: a.id,
      title: a.title,
      imageUrl: a.imageUrl,
      link: a.link ?? '',
      placement: a.placement,
      status: a.status,
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.imageUrl.trim()) {
      Alert.alert('Error', 'Completá Título e Imagen (URL).');
      return;
    }
    setSaving(true);
    try {
      upsert({
        ...form,
        title: form.title.trim(),
        imageUrl: form.imageUrl.trim(),
        link: form.link?.trim() ? form.link.trim() : undefined,
      });
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (a: ImageAsset) => {
    Alert.alert('Eliminar imagen', a.title, [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => remove(a.id),
      },
    ]);
  };

  const placementLabel = (p: ImageAssetPlacement) =>
    p === 'slider' ? 'Slider' : p === 'ads' ? 'Publicidades' : 'Banners';

  const renderImageItem = ({ item }: { item: ImageAsset }) => (
    <View
      style={[
        styles.imageCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: item.status === 'active' ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <View style={styles.imagePreview}>
        <View style={[styles.previewImage, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} />
        </View>
        {item.status !== 'active' && <View style={[styles.imageMask, { backgroundColor: theme.colors.overlay }]} />}
      </View>

      <View style={styles.imageInfo}>
        <View style={styles.infoHeader}>
          <View style={styles.titleSection}>
            <Text style={[styles.imageTitle, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={[styles.imageMeta, { color: theme.colors.textSecondary }]}>
              {placementLabel(item.placement)} · {formatDate(item.createdAt)}
            </Text>
            {item.link ? (
              <Text style={[styles.imageMeta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {item.link}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => toggleStatus(item.id)}
            style={[
              styles.toggleButton,
              { backgroundColor: item.status === 'active' ? theme.colors.success : theme.colors.warning },
            ]}
          >
            <MaterialCommunityIcons name={item.status === 'active' ? 'eye' : 'eye-off'} size={16} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => openEdit(item)} style={[styles.actionBtn, { backgroundColor: theme.colors.primaryLight }]}>
            <MaterialCommunityIcons name="pencil" size={16} color={theme.colors.primary} />
            <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>Editar</Text>
          </Pressable>

          <Pressable onPress={() => confirmDelete(item)} style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
            <MaterialCommunityIcons name="delete" size={16} color={theme.colors.error} />
            <Text style={[styles.actionBtnText, { color: theme.colors.error }]}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="image-multiple" size={32} color={theme.colors.primary} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Imágenes</Text>
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
              placeholder="Buscar por título o link"
              placeholderTextColor={theme.colors.placeholder}
              style={[styles.searchInput, { color: theme.colors.text }]}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.filters}>
          {(['all', 'slider', 'ads', 'banners'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPlacementFilter(p)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: placementFilter === p ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: placementFilter === p ? '#fff' : theme.colors.text }]}>
                {p === 'all' ? 'Todos' : p === 'slider' ? 'Slider' : p === 'ads' ? 'Ads' : 'Banners'}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={filtered}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.imagesList}
        />

        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Imagen</Text>
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
                  label="Link (opcional)"
                  value={form.link ?? ''}
                  onChangeText={(v) => setForm((s) => ({ ...s, link: v }))}
                  autoCapitalize="none"
                />

                <View style={styles.selectRow}>
                  {(['slider', 'ads', 'banners'] as const).map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setForm((s) => ({ ...s, placement: p }))}
                      style={[
                        styles.selectPill,
                        {
                          backgroundColor: form.placement === p ? theme.colors.primary : theme.colors.surfaceAlt,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.selectPillText, { color: form.placement === p ? '#fff' : theme.colors.text }]}>
                        {p === 'slider' ? 'Slider' : p === 'ads' ? 'Ads' : 'Banners'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.selectRow}>
                  {(['active', 'inactive'] as const).map((st) => (
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
                        {st === 'active' ? 'Activo' : 'Inactivo'}
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
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
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
  searchRow: {
    marginBottom: spacing.md,
  },
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
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 12,
    fontWeight: typography.semibold as any,
  },
  imagesList: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  imageCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.md,
  },
  imagePreview: {
    height: 180,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageInfo: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleSection: {
    flex: 1,
    gap: spacing.xs,
  },
  imageTitle: {
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
  imageMeta: {
    fontSize: 12,
    fontWeight: typography.regular as any,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
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
  actionBtnText: {
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
});

