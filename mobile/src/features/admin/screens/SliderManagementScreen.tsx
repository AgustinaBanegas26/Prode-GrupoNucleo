import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { radius, shadows, spacing } from '../../../theme/theme';
import {
  type SliderSlide,
  useAllSliderSlides,
  useDeleteSliderImage,
  useDeleteSliderSlide,
  useReorderSliderSlides,
  useSliderRealtime,
  useToggleSliderSlideActive,
  useUpsertSliderSlide,
} from '../../content/api/sliderSlides';
import { useAdminActivityStore } from '../store/adminActivityStore';

const CELESTE      = '#6EC6FF';
const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE    = '#0F4C81';

function FadeSlide({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

// ── Tipo del form ─────────────────────────────────────────────
type SlideForm = {
  id?: string;
  title: string;
  description: string;
  showTitle: boolean;
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
    showTitle: true,
    buttonEnabled: false,
    buttonText: '',
    buttonInternalLink: '',
    buttonExternalLink: '',
    order,
    active: true,
  };
}

function confirmDestructive(title: string, message: string, onConfirm: () => void | Promise<void>) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      void Promise.resolve(onConfirm());
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => void Promise.resolve(onConfirm()) },
  ]);
}

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
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
          <Image
            key={item.imageUrl}
            source={{ uri: item.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
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
          <View style={[card.btnChip, { backgroundColor: 'rgba(61,165,245,0.12)' }]}>
            <Feather name="link" size={11} color={CELESTE_DARK} />
            <Text style={[card.btnChipText, { color: CELESTE_DARK }]} numberOfLines={1}>
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

        <View style={card.actionGroup}>
          <Pressable
            onPress={onEdit}
            style={[card.actionBtn, { backgroundColor: 'rgba(61,165,245,0.12)' }]}
            accessibilityLabel="Editar slide"
          >
            <Feather name="edit-2" size={14} color={CELESTE_DARK} />
            <Text style={[card.actionText, { color: CELESTE_DARK }]}>Editar</Text>
          </Pressable>

          <Pressable
            onPress={onDelete}
            style={[card.actionBtn, { backgroundColor: 'rgba(239,68,68,0.10)' }]}
            accessibilityLabel="Eliminar slide"
          >
            <Feather name="trash-2" size={14} color={theme.colors.error} />
            <Text style={[card.actionText, { color: theme.colors.error }]}>Eliminar</Text>
          </Pressable>
        </View>
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
  actionGroup:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  actionText:    { fontSize: 12, fontWeight: '700' },
});

// ── Pantalla principal ─────────────────────────────────────────
export function SliderManagementScreen() {
  const { theme } = useAppTheme();
  const isDark = theme.isDark;
  const router = useRouter();
  const { data: slides = [], isLoading, isError, error, refetch } = useAllSliderSlides();
  useSliderRealtime();
  const upsertMutation       = useUpsertSliderSlide();
  const deleteMutation       = useDeleteSliderSlide();
  const deleteImageMutation  = useDeleteSliderImage();
  const reorderMutation      = useReorderSliderSlides();
  const toggleActiveMutation = useToggleSliderSlideActive();
  const log = useAdminActivityStore((s) => s.log);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [form, setForm]                 = useState<SlideForm>(emptyForm(1));

  const sorted = useMemo(() => [...slides].sort((a, b) => a.order - b.order), [slides]);

  const openCreate = () => {
    setUploadProgress(null);
    setForm(emptyForm(sorted.length + 1));
    setModalVisible(true);
  };

  const openEdit = (s: SliderSlide) => {
    setUploadProgress(null);
    setForm({
      id: s.id,
      title: s.title,
      description: s.description ?? '',
      showTitle: s.showTitle !== false,
      imageUri: undefined,
      imagePath: s.storedImagePath || s.imagePath,
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
    if (Platform.OS === 'web') {
      // En web: usar input type="file" nativo para evitar problemas CORS con blob URIs
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.onchange = async (e: any) => {
        const file: File = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setForm((s) => ({ ...s, imageUri: url, imageUrl: url }));
      };
      input.click();
      return;
    }
    // Móvil: usar ImagePicker
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
    if (form.showTitle && !form.title.trim()) {
      showAlert('Error', 'El título es obligatorio cuando se muestra en el banner.');
      return;
    }
    if (!form.imageUri && !form.imagePath) {
      showAlert('Error', 'Seleccioná una imagen antes de guardar.');
      return;
    }
    if (form.buttonEnabled && !form.buttonText.trim()) {
      showAlert('Error', 'Agregá el texto del botón o desactivalo.');
      return;
    }

    const existed = !!form.id;
    setSaving(true);
    setUploadProgress(form.imageUri ? 0 : null);
    try {
      const savePromise = upsertMutation.mutateAsync({
        id: form.id,
        title: form.title.trim(),
        description: form.description.trim(),
        showTitle: form.showTitle,
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
        onUploadProgress: form.imageUri ? setUploadProgress : undefined,
      });

      const timeoutMs = 90_000;
      await Promise.race([
        savePromise,
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Tiempo de espera agotado. Revisá la conexión e intentá de nuevo.')), timeoutMs);
        }),
      ]);

      log({
        action: existed ? 'update' : 'create',
        module: 'slider',
        title: existed ? 'Slide actualizado' : 'Slide creado',
        detail: form.title.trim(),
      });
      setModalVisible(false);
      void refetch();
    } catch (e) {
      showAlert('Error al guardar', e instanceof Error ? e.message : 'Intentá de nuevo.');
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteImage = () => {
    if (!form.id || !form.imagePath) {
      setForm((s) => ({ ...s, imageUri: undefined, imageUrl: undefined, imagePath: undefined }));
      return;
    }

    confirmDestructive(
      'Eliminar imagen',
      '¿Querés eliminar la imagen de este slide?',
      async () => {
        try {
          await deleteImageMutation.mutateAsync({ id: form.id!, imagePath: form.imagePath! });
          setForm((s) => ({ ...s, imageUri: undefined, imageUrl: undefined, imagePath: undefined }));
          log({ action: 'update', module: 'slider', title: 'Imagen eliminada', detail: form.title });
          void refetch();
        } catch (e) {
          showAlert('Error', e instanceof Error ? e.message : 'No se pudo eliminar la imagen.');
        }
      },
    );
  };

  const confirmDelete = (s: SliderSlide) => {
    confirmDestructive(
      'Eliminar slide',
      `¿Eliminar "${s.title}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await deleteMutation.mutateAsync({ id: s.id, imagePath: s.imagePath });
          log({ action: 'delete', module: 'slider', title: 'Slide eliminado', detail: s.title });
          void refetch();
        } catch (e) {
          showAlert('Error', e instanceof Error ? e.message : 'No se pudo eliminar.');
        }
      },
    );
  };

  const move = (id: string, dir: 'up' | 'down') => {
    const ids = sorted.map((s) => s.id);
    const idx = ids.indexOf(id);
    if (idx < 0 || (dir === 'up' && idx === 0) || (dir === 'down' && idx === ids.length - 1)) return;
    const next = [...ids];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    reorderMutation.mutate(next, {
      onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo reordenar.'),
    });
  };

  const toggleActive = (s: SliderSlide) => {
    toggleActiveMutation.mutate(
      { id: s.id, active: !s.active },
      {
        onSuccess: () => {
          log({
            action: 'update',
            module: 'slider',
            title: s.active ? 'Slide desactivado' : 'Slide activado',
            detail: s.title,
          });
        },
        onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cambiar el estado.'),
      },
    );
  };

  const bg = isDark ? '#0D0D0D' : '#F5F7FA';

  return (
    <View style={[scr.root, { backgroundColor: bg }]}>
      <LinearGradient colors={[CELESTE_DARK, DEEP_BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={scr.header}>
        <View style={scr.circleL} />
        <FadeSlide>
          <View style={scr.headerRow}>
            <Pressable onPress={() => router.push('/(admin)')} style={scr.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={scr.title}>Slider</Text>
              <Text style={scr.sub}>
                {sorted.length} slide{sorted.length !== 1 ? 's' : ''} · se muestra en Inicio
              </Text>
            </View>
            <Pressable onPress={openCreate} style={scr.addBtn} accessibilityLabel="Agregar slide">
              <Feather name="plus" size={18} color="#fff" />
            </Pressable>
          </View>
        </FadeSlide>
      </LinearGradient>

      <FlatList
        data={sorted}
        keyExtractor={(s) => s.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scr.listContent}
        refreshing={isLoading}
        onRefresh={() => refetch()}
        ListHeaderComponent={
          isError ? (
            <Pressable onPress={() => refetch()} style={[scr.errorBox, { backgroundColor: theme.colors.surfaceAlt }]}>
              <Text style={[scr.errorText, { color: theme.colors.error }]}>
                {error instanceof Error ? error.message : 'Error al cargar slides'}
              </Text>
              <Text style={[scr.errorHint, { color: theme.colors.muted }]}>Tocá para reintentar</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <View style={scr.emptyBox}>
            <View style={[scr.emptyIcon, { backgroundColor: 'rgba(61,165,245,0.12)' }]}>
              <MaterialCommunityIcons name="view-carousel-outline" size={52} color={CELESTE_DARK} />
            </View>
            <Text style={[scr.emptyTitle, { color: theme.colors.text }]}>
              Sin slides todavía
            </Text>
            <Text style={[scr.emptySubtitle, { color: theme.colors.muted }]}>
              Las imágenes que agregues aparecerán automáticamente en la pantalla Inicio de todos los usuarios.
            </Text>
            <Pressable onPress={openCreate} style={scr.emptyBtn} accessibilityRole="button">
              <LinearGradient colors={[CELESTE, CELESTE_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
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
                disabled={saving}
                style={[
                  modal.imagePickerBtn,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: (form.imageUri || form.imageUrl) ? CELESTE_DARK : theme.colors.border,
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

              {(form.imageUri || form.imageUrl) && (
                <Pressable
                  onPress={handleDeleteImage}
                  disabled={saving || deleteImageMutation.isPending}
                  style={[modal.deleteImageBtn, { borderColor: theme.colors.error + '40' }]}
                >
                  <Feather name="trash-2" size={14} color={theme.colors.error} />
                  <Text style={[modal.deleteImageText, { color: theme.colors.error }]}>
                    {deleteImageMutation.isPending ? 'Eliminando...' : 'Eliminar imagen'}
                  </Text>
                </Pressable>
              )}

              {uploadProgress !== null && (
                <View style={modal.progressBox}>
                  <View style={[modal.progressTrack, { backgroundColor: theme.colors.border }]}>
                    <View
                      style={[
                        modal.progressFill,
                        { width: `${uploadProgress}%`, backgroundColor: CELESTE_DARK },
                      ]}
                    />
                  </View>
                  <Text style={[modal.progressText, { color: theme.colors.textSecondary }]}>
                    Subiendo imagen… {uploadProgress}%
                  </Text>
                </View>
              )}

              {/* Mostrar título */}
              <View style={modal.switchRow}>
                <View>
                  <Text style={[modal.switchLabel, { color: theme.colors.text }]}>Mostrar título y subtítulo</Text>
                  <Text style={[modal.switchHint, { color: theme.colors.muted }]}>
                    {form.showTitle ? 'Visible en el banner del Inicio' : 'Solo imagen, sin texto ni overlays'}
                  </Text>
                </View>
                <Switch
                  value={form.showTitle}
                  onValueChange={(v) => setForm((s) => ({ ...s, showTitle: v }))}
                  trackColor={{ false: theme.colors.border, true: CELESTE_DARK }}
                  thumbColor="#fff"
                />
              </View>

              {/* Título */}
              {form.showTitle ? (
                <>
                  <Text style={[modal.label, { color: theme.colors.textSecondary }]}>Título *</Text>
                  <TextInput
                    value={form.title}
                    onChangeText={(v) => setForm((s) => ({ ...s, title: v }))}
                    placeholder="Ej: Pronosticá el Mundial"
                    placeholderTextColor={theme.colors.placeholder}
                    style={[modal.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                  />

                  <Text style={[modal.label, { color: theme.colors.textSecondary }]}>Subtítulo</Text>
                  <TextInput
                    value={form.description}
                    onChangeText={(v) => setForm((s) => ({ ...s, description: v }))}
                    placeholder="Descripción opcional"
                    placeholderTextColor={theme.colors.placeholder}
                    style={[modal.input, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, color: theme.colors.text }]}
                  />
                </>
              ) : null}

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
                  trackColor={{ false: theme.colors.border, true: CELESTE_DARK }}
                  thumbColor="#fff"
                />
              </View>

              {/* Campos de botón */}
              {form.buttonEnabled && (
                <View style={modal.buttonSection}>
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
                style={[modal.saveBtn, { opacity: saving ? 0.75 : 1, overflow: 'hidden' }]}
              >
                <LinearGradient colors={[CELESTE_DARK, DEEP_BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                {saving ? (
                  <View style={modal.savingRow}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={modal.saveBtnText}>
                      {uploadProgress !== null ? `Subiendo ${uploadProgress}%` : 'Guardando...'}
                    </Text>
                  </View>
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
  header: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, overflow: 'hidden', position: 'relative' },
  circleL: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: 'rgba(110,198,255,0.20)', top: -60, right: -40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.68)', fontSize: 12, marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing.lg, paddingBottom: 100, gap: spacing.md },
  errorBox: { padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.md, alignItems: 'center', gap: 4 },
  errorText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  errorHint: { fontSize: 11 },
  emptyBox: { alignItems: 'center', paddingTop: 48, paddingHorizontal: spacing['2xl'], gap: spacing.lg },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.xl, marginTop: spacing.sm, overflow: 'hidden' },
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
  imagePreview: { ...StyleSheet.absoluteFill },
  changeOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  changeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  imagePlaceholder: { alignItems: 'center', gap: 8, padding: spacing.xl },
  imagePlaceholderText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  imagePlaceholderHint: { fontSize: 12, textAlign: 'center' },
  deleteImageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm, paddingVertical: spacing.sm, borderWidth: 1, borderRadius: radius.lg },
  deleteImageText: { fontSize: 13, fontWeight: '600' },
  progressBox: { marginTop: spacing.md, gap: 6 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, paddingVertical: spacing.sm },
  switchLabel: { fontSize: 14, fontWeight: '600' },
  switchHint: { fontSize: 11, marginTop: 2 },
  buttonSection: { gap: 4, marginTop: spacing.sm, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: CELESTE_DARK + '40' },
  footer: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderTopWidth: 1 },
  cancelBtn: { flex: 1, height: 48, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700' },
  saveBtn: { flex: 2, height: 48, borderRadius: radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  savingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
