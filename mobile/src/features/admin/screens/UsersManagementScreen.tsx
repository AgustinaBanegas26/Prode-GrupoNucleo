import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, FlatList, Modal, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import type { AppUser } from '../../users/types';
import { makeEmptyUser, useUsersStore } from '../../users/store/usersStore';
import { useAdminActivityStore } from '../store/adminActivityStore';

export function UsersManagementScreen() {
  const { theme } = useAppTheme();
  const users = useUsersStore((s) => s.users);
  const refresh = useUsersStore((s) => s.refresh);
  const upsert = useUsersStore((s) => s.upsert);
  const remove = useUsersStore((s) => s.remove);
  const setActivo = useUsersStore((s) => s.setActivo);
  const resetPassword = useUsersStore((s) => s.resetPassword);
  const log = useAdminActivityStore((s) => s.log);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(makeEmptyUser());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const statusOk = statusFilter === 'all' ? true : statusFilter === 'active' ? u.activo : !u.activo;
      if (!statusOk) return false;
      if (!q) return true;
      const haystack = `${u.numeroEmpleado} ${u.nombre} ${u.apellido}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, statusFilter, users]);

  const openCreate = () => {
    setForm(makeEmptyUser());
    setModalVisible(true);
  };

  const openEdit = (u: AppUser) => {
    setForm({
      id: u.id,
      numeroEmpleado: u.numeroEmpleado,
      nombre: u.nombre,
      apellido: u.apellido,
      rol: u.rol,
      activo: u.activo,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.numeroEmpleado.trim() || !form.nombre.trim() || !form.apellido.trim()) {
      Alert.alert('Error', 'Completá Número de empleado, Nombre y Apellido.');
      return;
    }

    const existed = users.some((u) => u.id === form.id);
    setSaving(true);
    try {
      await upsert({
        ...form,
        numeroEmpleado: form.numeroEmpleado.trim(),
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
      });
      log({
        action: existed ? 'update' : 'create',
        module: 'users',
        title: existed ? 'Usuario actualizado' : 'Usuario creado',
        detail: `${form.nombre.trim()} ${form.apellido.trim()} · ${form.numeroEmpleado.trim()}`,
      });
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (u: AppUser) => {
    Alert.alert('Eliminar usuario', `${u.nombre} ${u.apellido}`, [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await remove(u.id);
          log({
            action: 'delete',
            module: 'users',
            title: 'Usuario eliminado',
            detail: `${u.nombre} ${u.apellido} · ${u.numeroEmpleado}`,
          });
        },
      },
    ]);
  };

  const handleBlockToggle = async (u: AppUser) => {
    const next = !u.activo;
    await setActivo(u.id, next);
    log({
      action: 'toggle',
      module: 'users',
      title: next ? 'Usuario desbloqueado' : 'Usuario bloqueado',
      detail: `${u.nombre} ${u.apellido} · ${u.numeroEmpleado}`,
    });
  };

  const handleResetPassword = async (u: AppUser) => {
    const next = await resetPassword(u.id);
    log({
      action: 'update',
      module: 'users',
      title: 'Contraseña restablecida',
      detail: `${u.nombre} ${u.apellido} · ${u.numeroEmpleado}`,
    });
    Alert.alert('Contraseña restablecida', `Nueva contraseña: ${next}`);
  };

  const getStatusBadge = (activo: boolean) => {
    if (activo) return { label: 'Activo', color: theme.colors.success };
    return { label: 'Bloqueado', color: theme.colors.error };
  };

  const renderUserItem = ({ item }: { item: AppUser }) => {
    const badge = getStatusBadge(item.activo);
    return (
      <View
        style={[
          styles.userCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {item.nombre} {item.apellido}
            </Text>
            <Text style={[styles.userMeta, { color: theme.colors.textSecondary }]}>
              N° empleado: {item.numeroEmpleado}
            </Text>
            <Text style={[styles.userMeta, { color: theme.colors.textSecondary }]}>
              Rol: {item.rol === 'admin' ? 'admin' : 'usuario'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
            <Text style={styles.statusText}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => openEdit(item)}
            style={[styles.actionButton, { backgroundColor: theme.colors.primaryLight }]}
          >
            <MaterialCommunityIcons name="pencil" size={16} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>Editar</Text>
          </Pressable>

          <Pressable
            onPress={() => handleResetPassword(item)}
            style={[styles.actionButton, { backgroundColor: theme.colors.surfaceAlt }]}
          >
            <MaterialCommunityIcons name="key" size={16} color={theme.colors.info} />
            <Text style={[styles.actionText, { color: theme.colors.info }]}>Reset</Text>
          </Pressable>

          <Pressable
            onPress={() => handleBlockToggle(item)}
            style={[styles.actionButton, { backgroundColor: theme.colors.surfaceAlt }]}
          >
            <MaterialCommunityIcons
                name={item.activo ? 'lock' : 'lock-open-variant'}
              size={16}
                color={item.activo ? theme.colors.warning : theme.colors.success}
            />
            <Text
              style={[
                styles.actionText,
                  { color: item.activo ? theme.colors.warning : theme.colors.success },
              ]}
            >
                {item.activo ? 'Bloq.' : 'Desbloq.'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => confirmDelete(item)}
            style={[styles.actionButton, { backgroundColor: theme.colors.surfaceAlt }]}
          >
            <MaterialCommunityIcons name="delete" size={16} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.error }]}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="account-multiple"
            size={32}
            color={theme.colors.primary}
          />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Gestión de Usuarios
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {filtered.length} usuarios
            </Text>
          </View>
          <Pressable
            onPress={openCreate}
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Nuevo</Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nombre, email o usuario"
              placeholderTextColor={theme.colors.placeholder}
              style={[styles.searchInput, { color: theme.colors.text }]}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.filters}>
          {(['all', 'active', 'blocked'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setStatusFilter(f)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: statusFilter === f ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: statusFilter === f ? '#fff' : theme.colors.text }]}>
                {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Bloq.'}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={filtered}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />

        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {users.some((u) => u.id === form.id) ? 'Editar usuario' : 'Crear usuario'}
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <TextField
                  label="Número de empleado"
                  value={form.numeroEmpleado}
                  onChangeText={(v) => setForm((s) => ({ ...s, numeroEmpleado: v }))}
                  keyboardType="number-pad"
                />
                <TextField label="Nombre" value={form.nombre} onChangeText={(v) => setForm((s) => ({ ...s, nombre: v }))} />
                <TextField label="Apellido" value={form.apellido} onChangeText={(v) => setForm((s) => ({ ...s, apellido: v }))} />

                <View style={styles.selectRow}>
                  {([true, false] as const).map((st) => (
                    <Pressable
                      key={st ? 'active' : 'blocked'}
                      onPress={() => setForm((s) => ({ ...s, activo: st }))}
                      style={[
                        styles.selectPill,
                        {
                          backgroundColor: form.activo === st ? theme.colors.primary : theme.colors.surfaceAlt,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.selectPillText, { color: form.activo === st ? '#fff' : theme.colors.text }]}>
                        {st ? 'Activo' : 'Bloqueado'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.selectRow}>
                  {(['usuario', 'admin'] as const).map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => setForm((s) => ({ ...s, rol: r }))}
                      style={[
                        styles.selectPill,
                        {
                          backgroundColor: form.rol === r ? theme.colors.primary : theme.colors.surfaceAlt,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.selectPillText, { color: form.rol === r ? '#fff' : theme.colors.text }]}>
                        {r === 'usuario' ? 'Usuario' : 'Admin'}
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
  header: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing['2xl'],
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: typography.semibold as any,
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
  listContent: {
    gap: spacing.md,
  },
  userCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
    ...shadows.sm,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  userName: {
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
  userMeta: {
    fontSize: 12,
    fontWeight: typography.regular as any,
  },
  statusBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  statusText: {
    fontSize: 11,
    fontWeight: typography.semibold as any,
    color: '#fff',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    minWidth: '48%',
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
});
