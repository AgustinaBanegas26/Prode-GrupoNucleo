import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { AdminScreenHeader } from '../../../components/AdminScreenHeader';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { radius, shadows, spacing } from '../../../theme/theme';
import {
  type SliderSlide,
  useDeleteSliderSlide,
  useReorderSliderSlides,
  useSliderRealtime,
  useSliderSlides,
  useUpsertSliderSlide,
} from '../../content/api/sliderSlides';
import { useAdminActivityStore } from '../store/adminActivityStore';

// ── Tipo del form ─────────────────────────────────────────────
type SlideForm = {
  id?: string;
  title: string;
  description: string;
  imageUri?: string;
  imagePath?: string;
  imageUrl?: string;
  buttonEnabled: boolean;
  buttonText: string;
  buttonInternalLink: string;
  buttonExternalLink: string;
  order: number;
  active: boolean;
};

function emptyForm(order: number): SlideForm {
  return {
    title: '',
    description: '',
    buttonEnabled: false,
    buttonText: '',
    buttonInternalLink: '',
    buttonExternalLink: '',
    order,
    active: true,
  };
}

// ── Card de cada slide ────────────────────────────────────────
function SlideCard({
  item,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
}: {
  item: SliderSlide;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { theme } = useAppTheme();
  const primary = theme.colors.primary;
  const primaryLight = theme.colors.primaryLight;

  return (
    <View
      style={[
        card.container,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        shadows.sm,
      ]}
    >
      {/* Imagen */}
      <View style={card.imageWrapper}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, card.noImage, { backgroundColor: theme.colors.surfaceAlt }]}>
            <MaterialCommunityIcons name="image-outline" size={32} color={theme.colors.muted} />
            <Text style={[card.noImageText, { color: theme.colors.muted }]}>Sin imagen</Text>
          </View>
        )}

        {/* Badge estado */}
        <View style={[card.badge, { backgroundColor: item.active ? '#22C55E' : '#9CA3AF' }]}>
          <Text style={card.badgeText}>{item.active ? 'ACTIVO' : 'INACTIVO'}</Text>
        </View>

        {/* Badge orden */}
        <View style={[card.orderBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
          <Text style={card.orderText}>#{item.order}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={card.body}>
        <Text style={[card.title, { color: theme.colors.text }]} numberOfLines={1}>
          {item.title || 'Sin título'}
        </Text>
        {item.description ? (
          <Text style={[card.desc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
        {item.button.enabled && item.button.text ? (
          <View style={[card.btnChip, { backgroundColor: primaryLight }]}>
            <Feather name="link" size={11} color={primary} />
            <Text style={[card.btnChipText, { color: primary }]} numberOfLines={1}>
              Botón: {item.button.text}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Acciones */}
      <View style={[card.actions, { borderTopColor: theme.colors.divider }]}>
        {/* Reordenar */}
        <View style={card.orderBtns}>
          <Pressable
            onPress={onMoveUp}
            disabled={isFirst}
            style={[card.iconBtn, { backgroundColor: theme.colors.surfaceAlt, opacity: isFirst ? 0.35 : 1 }]}
            accessibilityLabel="Mover arriba"
          >
            <Feather name="chevron-up" size={16} color={theme.colors.text} />
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={isLast}
            style={[card.iconBtn, { backgroundColor: theme.colors.surfaceAlt, opacity: isLast ? 0.35 : 1 }]}
            accessibilityLabel="Mover abajo"
          >
            <Feather name="chevron-down" size={16} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Toggle activo */}
        <Pressable
          onPress={onToggleActive}
          style={[card.toggleBtn, { backgroundColor: item.active ? 'rgba(34,197,94,0.12)' : 'rgba(156,163,175,0.12)' }]}
          accessibilityLabel={item.active ? 'Desactivar' : 'Activar'}
        >
          <MaterialCommunityIcons
            name={item.active ? 'eye' : 'eye-off'}
            size={14}
            color={item.active ? '#22C55E' : '#9CA3AF'}
          />
          <Text style={[card.toggleText, { color: item.active ? '#22C55E' : '#9CA3AF' }]}>
            {item.active ? 'Activo' : 'Inactivo'}
          </Text>
        </Pressable>

        {/* Editar */}
        <Pressable
          onPress={onEdit}
          style={[card.actionBtn, { backgroundColor: primaryLight }]}
          accessibilityLabel="Editar slide"
        >
          <Feather name="edit-2" size={14} color={primary} />
          <Text style={[card.actionText, { color: primary }]}>Editar</Text>
        </Pressable>

        {/* Eliminar */}
        <Pressable
          onPress={onDelete}
          style={[card.actionBtn, { backgroundColor: theme.colors.surfaceAlt }]}
          accessibilityLabel="Eliminar slide"
        >
          <Feather name="trash-2" size={14} color={theme.colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  container:     { borderRadius: radius['2xl'], borderWidth: 1, overflow: 'hidden' },
  imageWrapper:  { height: 180, position: 'relative', backgroundColor: '#1a1a1a' },
  noImage:       { alignItems: 'center', justifyContent: 'center', gap: 6 },
  noImageText:   { fontSize: 12, fontWeight: '500' },
  badge:         { position: 'absolute', top: 10, left: 10, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:     { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  orderBadge:    { position: 'absolute', top: 10, right: 10, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  orderText:     { color: '#fff', fontSize: 11, fontWeight: '700' },
  body:          { padding: spacing.md, gap: 4 },
  title:         { fontSize: 14, fontWeight: '700' },
  desc:          { fontSize: 12 },
  btnChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginTop: 2 },
  btnChipText:   { fontSize: 11, fontWeight: '600' },
  actions:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1 },
  orderBtns:     { flexDirection: 'row', gap: 4 },
  iconBtn:       { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  toggleText:    { fontSize: 12, fontWeight: '700' },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginLeft: 'auto' },
  actionText:    { fontSize: 12, fontWeight: '700' },
});

// ── Pantalla principal ─────────────────────────────────────────
export function SliderManagementScreen() {
  const { theme } = useAppTheme();
  const primary = theme.colors.primary;
  const primaryLight = theme.colors.primaryLight;
  const { data: slides = [], isLoading } = useSliderSlides();
  useSliderRealtime();
  const upsertMutation  = useUpsertSliderSlide();
  const deleteMutation  = useDeleteSliderSlide();
  const reorderMutation = useReorderSliderSlides();
  const log = useAdminActivityStore((s) => s.log);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [form, setForm]                 = useState<SlideForm>(emptyForm(1));

  const sorted = useMemo(() => [...slides].sort((a, b) => a.order - b.order), [slides]);

  const openCreate = () => {
    setForm(emptyForm(sorted.length + 1));
    setModalVisible(true);
  };

  const openEdit = (s: SliderSlide) => {
    setForm({
      id: s.id,
      title: s.title,
      description: s.description ?? '',
      imagePath: s.imagePath,
      imageUrl: s.imageUrl,
      buttonEnabled: s.button.enabled,
      buttonText: s.button.text ?? '',
      buttonInternalLink: s.button.internalLink ?? '',
      buttonExternalLink: s.button.externalLink ?? '',
      order: s.order,
      active: s.active,
    });
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
      quality: 0.92,
    });
    if (res.canceled) return;
    const uri = res.assets?.[0]?.uri;
    if (!uri) return;
    setForm((s) => ({ ...s, imageUri: uri, imageUrl: uri }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'El título es obligatorio.');
      return;
    }
    if (!form.imageUri && !form.imagePath) {
      Alert.alert('Error', 'Seleccioná una imagen antes de guardar.');
      return;
    }
    if (form.buttonEnabled && !form.buttonText.trim()) {
      Alert.alert('Error', 'Agregá el texto del botón o desactivalo.');
      return;
    }

    const existed = !!form.id;
    setSaving(true);
    try {
      await upsertMutation.mutateAsync({
        id: form.id,
        title: form.title.trim(),
        description: form.description.trim(),
        active: form.active,
        order: form.order,
        button: {
          enabled: form.buttonEnabled,
          text: form.buttonText.trim(),
          internalLink: form.buttonInternalLink.trim() || undefined,
          externalLink: form.buttonExternalLink.trim() || undefined,
        },
        imageUri: form.imageUri,
        imagePath: form.imagePath,
      });

      log({
        action: existed ? 'update' : 'create',
        module: 'slider',
        title: existed ? 'Slide actualizado' : 'Slide creado',
        detail: form.title.trim(),
      });
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error al guardar', e instanceof Error ? e.message : 'Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (s: SliderSlide) => {
    Alert.alert('Eliminar slide', `¿Eliminar "${s.title}"?`, [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id: s.id, imagePath: s.imagePath });
            log({ action: 'delete', module: 'slider', title: 'Slide eliminado', detail: s.title });
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar.');
          }
        },
      },
    ]);
  };

  const move = (id: string, dir: 'up' | 'down') => {
    const ids = sorted.map((s) => s.id);
    const idx = ids.indexOf(id);
    if (idx < 0 || (dir === 'up' && idx === 0) || (dir === 'down' && idx === ids.length - 1)) return;
    const next = [...ids];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    reorderMutation.mutate(next);
  };

  const toggleActive = (s: SliderSlide) => {
    upsertMutation.mutate({
      id: s.id,
      title: s.title,
      description: s.description,
      active: !s.active,
      order: s.order,
      button: s.button,
      imagePath: s.imagePath,
    });
  };

  const addBtn = (
    <Pressable
      onPress={openCreate}
      style={[scr.addBtn, { backgroundColor: primary }]}
      accessibilityRole="button"
      accessibilityLabel="Agregar slide"
    >
      <Feather name="plus" size={16} color="#fff" />
      <Text style={scr.addBtnText}>Agregar</Text>
    </Pressable>
  );

  return (
    <View style={[scr.root, { backgroundColor: theme.colors.background }]}>
      <AdminScreenHeader
        title="Slider"
        subtitle={`${sorted.length} slide${sorted.length !== 1 ? 's' : ''} · se muestra en Inicio`}
        rightElement={addBtn}
      />

      <FlatList
        data={sorted}
        keyExtractor={(s) => s.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scr.listContent}
        ListEmptyComponent={
          <View style={scr.emptyBox}>
            <View style={[scr.emptyIcon, { backgroundColor: primaryLight }]}>
              <MaterialCommunityIcons name="view-carousel-outline" size={52} color={primary} />
            </View>
            <Text style={[scr.emptyTitle, { color: theme.colors.text }]}>
              Sin slides todavía
            </Text>
            <Text style={[scr.emptySubtitle, { color: theme.colors.muted }]}>
              Las imágenes que agregues aparecerán automáticamente en la pantalla Inicio de todos los usuarios.
            </Text>
            <Pressable
              onPress={openCreate}
              style={[scr.emptyBtn, { backgroundColor: primary }]}
              accessibilityRole="button"
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={scr.emptyBtnText}>Agregar primer slide</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => (
          <SlideCard
            item={item}
            isFirst={index === 0}
            isLast={index === sorted.length - 1}
            onEdit={() => openEdit(item)}
            onDelete={() => confirmDelete(item)}
            onToggleActive={() => toggleActive(item)}
            onMoveUp={() => move(item.id, 'up')}
            onMoveDown={() => move(item.id, 'down')}
          />
        )}
      />

      {/* ── Modal crear / editar ───────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[modal.backdrop, { backgroundColor: theme.colors.overlay }]}>
          <View style={[modal.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>

            {/* Header */}
            <View style={modal.header}>
              <Text style={[modal.headerTitle, { color: theme.colors.text }]}>
                {form.id ? 'Editar slide' : 'Nuevo slide'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} accessibilityLabel="Cerrar">
                <Feather name="x" size={22} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={modal.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              {/* Selector de imagen */}
              <Text style={[modal.label, { color: theme.colors.textSecondary }]}>Imagen *</Text>
              <Pressable
                onPress={pickImage}
                style={[
                  modal.imagePickerBtn,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: (form.imageUri || form.imageUrl) ? primary : theme.colors.border,
                    borderStyle: (form.imageUri || form.imageUrl) ? 'solid' : 'dashed',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Seleccionar imagen"
              >
                {form.imageUri || form.imageUrl ? (
                  <>
                    <Image
                      source={{ uri: form.imageUri ?? form.imageUrl }}
                      style={modal.imagePreview}
                      resizeMode="cover"
                    />
                    <View style={modal.changeOverlay}>
                      <Feather name="camera" size={20} color="#fff" />
                      <Text style={modal.changeText}>Cambiar imagen</Text>
                    </View>
                  </>
                ) : (
                  <View style={modal.imagePlaceholder}>
                    <Feather name="image" size={32} color={theme.colors.muted} />
                    <Text style={[modal.imagePlaceholderText, { color: theme.colors.textSecondary }]}>
                      Tocar para seleccionar imagen
                    </Text>
                    <Text style={[modal.imagePlaceholderHint, { color: theme.colors.muted }]}>
                      La imagen se mostrará en el carrusel del Inicio
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Título */}
              <Text style={[modal.label, { color: theme.colors.textSecondary }]}>Título *</Text>
              <TextInput
                value={form.title}
                onChangeText={(v) => setForm((s) => ({ ...s, title: v }))}
                placeholder="Ej: Copa Mundial FIFA 2026"
                placeholderTextColor={theme.colors.placeholder}
                style={[modal.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
              />

              {/* Descripción */}
              <Text style={[modal.label, { color: theme.colors.textSecondary }]}>Descripción</Text>
              <TextInput
                value={form.description}
                onChangeText={(v) => setForm((s) => ({ ...s, description: v }))}
                placeholder="Descripción opcional"
                placeholderTextColor={theme.colors.placeholder}
                style={[modal.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
              />

              {/* Toggle activo */}
              <View style={modal.switchRow}>
                <View>
                  <Text style={[modal.switchLabel, { color: theme.colors.text }]}>Visible en Inicio</Text>
                  <Text style={[modal.switchHint, { color: theme.colors.muted }]}>
                    {form.active ? 'Se muestra a los usuarios' : 'Oculto para los usuarios'}
                  </Text>
                </View>
                <Switch
                  value={form.active}
                  onValueChange={(v) => setForm((s) => ({ ...s, active: v }))}
                  trackColor={{ false: theme.colors.border, true: '#22C55E' }}
                  thumbColor="#fff"
                />
              </View>

              {/* Toggle botón */}
              <View style={modal.switchRow}>
                <View>
                  <Text style={[modal.switchLabel, { color: theme.colors.text }]}>Agregar botón</Text>
                  <Text style={[modal.switchHint, { color: theme.colors.muted }]}>
                    Muestra un botón de acción en el slide
                  </Text>
                </View>
                <Switch
                  value={form.buttonEnabled}
                  onValueChange={(v) => setForm((s) => ({ ...s, buttonEnabled: v }))}
                  trackColor={{ false: theme.colors.border, true: primary }}
                  thumbColor="#fff"
                />
              </View>

              {/* Campos de botón */}
              {form.buttonEnabled && (
                <View style={[modal.buttonSection, { borderLeftColor: primaryLight }]}>
                  <Text style={[modal.label, { color: theme.colors.textSecondary }]}>Texto del botón</Text>
                  <TextInput
                    value={form.buttonText}
                    onChangeText={(v) => setForm((s) => ({ ...s, buttonText: v }))}
                    placeholder="Ej: Ver fixture"
                    placeholderTextColor={theme.colors.placeholder}
                    style={[modal.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                  />
                  <Text style={[modal.label, { color: theme.colors.textSecondary }]}>Link interno (ruta)</Text>
                  <TextInput
                    value={form.buttonInternalLink}
                    onChangeText={(v) => setForm((s) => ({ ...s, buttonInternalLink: v }))}
                    placeholder="/(app)/fixture"
                    placeholderTextColor={theme.colors.placeholder}
                    autoCapitalize="none"
                    style={[modal.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                  />
                  <Text style={[modal.label, { color: theme.colors.textSecondary }]}>Link externo (URL)</Text>
                  <TextInput
                    value={form.buttonExternalLink}
                    onChangeText={(v) => setForm((s) => ({ ...s, buttonExternalLink: v }))}
                    placeholder="https://..."
                    placeholderTextColor={theme.colors.placeholder}
                    autoCapitalize="none"
                    keyboardType="url"
                    style={[modal.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                  />
                </View>
              )}

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[modal.footer, { borderTopColor: theme.colors.divider }]}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[modal.cancelBtn, { borderColor: theme.colors.border }]}
              >
                <Text style={[modal.cancelText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={[modal.saveBtn, { backgroundColor: primary, opacity: saving ? 0.75 : 1 }]}
              >
                {saving ? (
                  <Text style={modal.saveBtnText}>Guardando...</Text>
                ) : (
                  <>
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={modal.saveBtnText}>
                      {form.id ? 'Guardar cambios' : 'Crear slide'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const scr = StyleSheet.create({
  root: { flex: 1 },
  listContent: { padding: spacing.lg, paddingBottom: 100, gap: spacing.md },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingTop: 48, paddingHorizontal: spacing['2xl'], gap: spacing.lg },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.xl, marginTop: spacing.sm },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

const modal = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  card: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, maxHeight: '94%', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  body: { paddingHorizontal: spacing.lg },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: spacing.md, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { borderWidth: 1, borderRadius: radius.lg, height: 48, paddingHorizontal: spacing.md, fontSize: 14 },
  imagePickerBtn: { height: 180, borderRadius: radius.xl, borderWidth: 1.5, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  imagePreview: { ...StyleSheet.absoluteFillObject },
  changeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  changeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  imagePlaceholder: { alignItems: 'center', gap: 8, padding: spacing.xl },
  imagePlaceholderText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  imagePlaceholderHint: { fontSize: 12, textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, paddingVertical: spacing.sm },
  switchLabel: { fontSize: 14, fontWeight: '600' },
  switchHint: { fontSize: 11, marginTop: 2 },
  buttonSection: { gap: 4, marginTop: spacing.sm, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: 'transparent' },
  footer: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderTopWidth: 1 },
  cancelBtn: { flex: 1, height: 48, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700' },
  saveBtn: { flex: 2, height: 48, borderRadius: radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
