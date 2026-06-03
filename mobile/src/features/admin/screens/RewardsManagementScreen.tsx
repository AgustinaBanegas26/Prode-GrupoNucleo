import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, FlatList, Alert, Modal, Image, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { makeEmptyReward, type Reward, useRewardsStore } from '../../content/store/rewardsStore';
import { useAdminActivityStore } from '../store/adminActivityStore';

export function RewardsManagementScreen() {
  const { theme } = useAppTheme();
  const rewards = useRewardsStore((s) => s.rewards);
  const upsert = useRewardsStore((s) => s.upsert);
  const remove = useRewardsStore((s) => s.remove);
  const toggleStatus = useRewardsStore((s) => s.toggleStatus);
  const log = useAdminActivityStore((s) => s.log);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(makeEmptyReward());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rewards
      .filter((r) => (statusFilter === 'all' ? true : r.status === statusFilter))
      .filter((r) => (!q ? true : `${r.name} ${r.description}`.toLowerCase().includes(q)))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [query, rewards, statusFilter]);

  const totals = useMemo(() => {
    const active = rewards.filter((r) => r.status === 'active').length;
    const inactive = rewards.length - active;
    const quantity = rewards.reduce((acc, r) => acc + (Number.isFinite(r.quantity) ? r.quantity : 0), 0);
    return { total: rewards.length, active, inactive, quantity };
  }, [rewards]);

  const openCreate = () => {
    setForm(makeEmptyReward());
    setModalVisible(true);
  };

  const openEdit = (r: Reward) => {
    setForm({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.imageUrl,
      quantity: r.quantity,
      status: r.status,
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.description.trim()) {
      Alert.alert('Error', 'Completá Nombre y Descripción.');
      return;
    }
    if (!form.imageUrl.trim()) {
      Alert.alert('Error', 'Completá Imagen (URL).');
      return;
    }
    if (!Number.isFinite(form.quantity) || form.quantity < 0) {
      Alert.alert('Error', 'Cantidad inválida.');
      return;
    }

    const existed = rewards.some((r) => r.id === form.id);
    setSaving(true);
    try {
      upsert({
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        quantity: Math.floor(form.quantity),
      });
      log({
        action: existed ? 'update' : 'create',
        module: 'rewards',
        title: existed ? 'Premio actualizado' : 'Premio creado',
        detail: `${form.name.trim()} · Cantidad ${Math.floor(form.quantity)}`,
      });
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (r: Reward) => {
    Alert.alert('Eliminar premio', r.name, [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          remove(r.id);
          log({ action: 'delete', module: 'rewards', title: 'Premio eliminado', detail: r.name });
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Reward }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: item.status === 'active' ? theme.colors.warning : theme.colors.border,
        },
      ]}
    >
      <View style={styles.preview}>
        <View style={[styles.previewImage, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} />
        </View>
        {item.status !== 'active' && <View style={[styles.previewMask, { backgroundColor: theme.colors.overlay }]} />}
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.cardMeta, { color: theme.colors.textSecondary }]}>
              Cantidad: {item.quantity} · {item.status === 'active' ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              toggleStatus(item.id);
              log({
                action: 'toggle',
                module: 'rewards',
                title: 'Estado de premio',
                detail: `${item.name} · ${item.status === 'active' ? 'Activo → Inactivo' : 'Inactivo → Activo'}`,
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
          <MaterialCommunityIcons name="gift-outline" size={32} color={theme.colors.warning} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Premios</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {filtered.length} items · Stock total {totals.quantity}
            </Text>
          </View>
          <Pressable onPress={openCreate} style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Nuevo</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>{totals.total}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Premios</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>{totals.active}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Activos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statValue, { color: theme.colors.info }]}>{totals.inactive}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Inactivos</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nombre o descripción"
              placeholderTextColor={theme.colors.placeholder}
              style={[styles.searchInput, { color: theme.colors.text }]}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.filters}>
          {(['all', 'active', 'inactive'] as const).map((st) => (
            <Pressable
              key={st}
              onPress={() => setStatusFilter(st)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: statusFilter === st ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: statusFilter === st ? '#fff' : theme.colors.text }]}>
                {st === 'all' ? 'Todos' : st === 'active' ? 'Activos' : 'Inactivos'}
              </Text>
            </Pressable>
          ))}
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
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Premio</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <TextField label="Nombre" value={form.name} onChangeText={(v) => setForm((s) => ({ ...s, name: v }))} />
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
                <TextField
                  label="Cantidad"
                  value={`${form.quantity}`}
                  onChangeText={(v) => setForm((s) => ({ ...s, quantity: Number(v.replace(/[^\d]/g, '')) || 0 }))}
                  keyboardType="number-pad"
                />

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
  screenHeader: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg, alignItems: 'flex-start' },
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
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: typography.bold as any,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: typography.medium as any,
    textAlign: 'center',
  },
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
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  filterButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, alignItems: 'center' },
  filterText: { fontSize: 12, fontWeight: typography.semibold as any },
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
