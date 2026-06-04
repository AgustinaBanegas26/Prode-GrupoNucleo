import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import {
  useRewards,
  useUpsertReward,
  useDeleteReward,
  useRewardsRealtime,
  type RewardRow,
} from '../../content/api/rewards';

type FormState = {
  id?: string;
  name: string;
  description: string;
  image_url: string;
  quantity: number;
  status: 'active' | 'inactive';
};

function makeEmptyForm(): FormState {
  return { name: '', description: '', image_url: '', quantity: 1, status: 'active' };
}

export function RewardsManagementScreen() {
  const { theme } = useAppTheme();

  useRewardsRealtime();

  const { data: rewards, isLoading } = useRewards();
  const upsertReward = useUpsertReward();
  const deleteReward = useDeleteReward();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(makeEmptyForm());

  const filtered = useMemo(() => {
    if (!rewards) return [];
    const q = query.trim().toLowerCase();
    return rewards
      .filter((r) => (statusFilter === 'all' ? true : r.status === statusFilter))
      .filter((r) => (!q ? true : `${r.name} ${r.description}`.toLowerCase().includes(q)));
  }, [query, rewards, statusFilter]);

  const totals = useMemo(() => {
    const all = rewards ?? [];
    return {
      total: all.length,
      active: all.filter((r) => r.status === 'active').length,
      inactive: all.filter((r) => r.status === 'inactive').length,
      quantity: all.reduce((acc, r) => acc + r.quantity, 0),
    };
  }, [rewards]);

  const openCreate = () => {
    setForm(makeEmptyForm());
    setModalVisible(true);
  };

  const openEdit = (r: RewardRow) => {
    setForm({ id: r.id, name: r.name, description: r.description, image_url: r.image_url ?? '', quantity: r.quantity, status: r.status });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      Alert.alert('Error', 'Completá Nombre y Descripción.');
      return;
    }
    try {
      await upsertReward.mutateAsync({
        id: form.id,
        name: form.name.trim(),
        description: form.description.trim(),
        image_url: form.image_url.trim() || null,
        quantity: Math.max(0, Math.floor(form.quantity)),
        status: form.status,
      });
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  };

  const confirmDelete = (r: RewardRow) => {
    Alert.alert('Eliminar premio', r.name, [
      { text: 'Cancelar' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await deleteReward.mutateAsync(r.id);
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar.');
          }
        },
      },
    ]);
  };

  const toggleStatus = async (r: RewardRow) => {
    try {
      await upsertReward.mutateAsync({ id: r.id, name: r.name, description: r.description, image_url: r.image_url, quantity: r.quantity, status: r.status === 'active' ? 'inactive' : 'active' });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  };

  const renderItem = ({ item }: { item: RewardRow }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: item.status === 'active' ? theme.colors.warning : theme.colors.border }, shadows.md]}>
      <View style={styles.preview}>
        <View style={[styles.previewImage, { backgroundColor: theme.colors.surfaceAlt }]}>
          {item.image_url ? <Image source={{ uri: item.image_url }} style={StyleSheet.absoluteFill} /> : null}
        </View>
        {item.status !== 'active' && <View style={[styles.previewMask, { backgroundColor: theme.colors.overlay }]} />}
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>{item.name}</Text>
            <Text style={[styles.cardMeta, { color: theme.colors.textSecondary }]}>
              Cantidad: {item.quantity} · {item.status === 'active' ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
          <Pressable onPress={() => toggleStatus(item)} style={[styles.iconBtn, { backgroundColor: item.status === 'active' ? theme.colors.success : theme.colors.warning }]}>
            <MaterialCommunityIcons name={item.status === 'active' ? 'eye' : 'eye-off'} size={16} color="#fff" />
          </Pressable>
        </View>

        <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]} numberOfLines={3}>{item.description}</Text>

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
        {/* Header */}
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

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[{ label: 'Premios', value: totals.total, color: theme.colors.warning }, { label: 'Activos', value: totals.active, color: theme.colors.success }, { label: 'Inactivos', value: totals.inactive, color: theme.colors.info }].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, shadows.sm]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.textSecondary} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Buscar..." placeholderTextColor={theme.colors.placeholder} style={[styles.searchInput, { color: theme.colors.text }]} autoCapitalize="none" />
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {(['all', 'active', 'inactive'] as const).map((st) => (
            <Pressable key={st} onPress={() => setStatusFilter(st)} style={[styles.filterButton, { backgroundColor: statusFilter === st ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.filterText, { color: statusFilter === st ? '#fff' : theme.colors.text }]}>
                {st === 'all' ? 'Todos' : st === 'active' ? 'Activos' : 'Inactivos'}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
        ) : (
          <FlatList data={filtered} renderItem={renderItem} keyExtractor={(item) => item.id} scrollEnabled={false} contentContainerStyle={styles.list} />
        )}

        {/* Modal */}
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
                <TextField label="Imagen (URL)" value={form.image_url} onChangeText={(v) => setForm((s) => ({ ...s, image_url: v }))} autoCapitalize="none" />
                <TextField label="Descripción" value={form.description} onChangeText={(v) => setForm((s) => ({ ...s, description: v }))} />
                <TextField label="Cantidad" value={`${form.quantity}`} onChangeText={(v) => setForm((s) => ({ ...s, quantity: Number(v.replace(/[^\d]/g, '')) || 0 }))} keyboardType="number-pad" />

                <View style={styles.selectRow}>
                  {(['active', 'inactive'] as const).map((st) => (
                    <Pressable key={st} onPress={() => setForm((s) => ({ ...s, status: st }))} style={[styles.selectPill, { backgroundColor: form.status === st ? theme.colors.primary : theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
                      <Text style={[styles.selectPillText, { color: form.status === st ? '#fff' : theme.colors.text }]}>
                        {st === 'active' ? 'Activo' : 'Inactivo'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Button title={upsertReward.isPending ? 'Guardando...' : 'Guardar'} onPress={handleSave} disabled={upsertReward.isPending} style={{ backgroundColor: theme.colors.primary }} />
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
  loadingBox: { alignItems: 'center', paddingTop: 40 },
  screenHeader: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg, alignItems: 'flex-start' },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: typography.bold as any },
  subtitle: { fontSize: 12, marginTop: spacing.xs },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.lg },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: typography.semibold as any },
  statsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: { flex: 1, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, alignItems: 'center', gap: spacing.sm },
  statValue: { fontSize: 18, fontWeight: typography.bold as any },
  statLabel: { fontSize: 11, textAlign: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  searchInput: { flex: 1, height: 48, paddingHorizontal: spacing.md, fontSize: 14 },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  filterButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, alignItems: 'center' },
  filterText: { fontSize: 12, fontWeight: typography.semibold as any },
  list: { gap: spacing.md, paddingBottom: spacing.lg },
  card: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1 },
  preview: { height: 160, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  previewMask: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  body: { padding: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'flex-start' },
  titleCol: { flex: 1, gap: spacing.xs },
  iconBtn: { width: 32, height: 32, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: typography.semibold as any },
  cardMeta: { fontSize: 12 },
  cardDesc: { fontSize: 12, lineHeight: 18 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, gap: spacing.xs },
  actionText: { fontSize: 12, fontWeight: typography.semibold as any },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalCard: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  modalTitle: { fontSize: 16, fontWeight: typography.bold as any },
  modalBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  modalFooter: { padding: spacing.lg },
  selectRow: { flexDirection: 'row', gap: spacing.sm },
  selectPill: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1 },
  selectPillText: { fontSize: 12, fontWeight: typography.semibold as any },
});
