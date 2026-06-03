import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';

type User = {
  id: string;
  name: string;
  email: string;
  predictions: number;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
};

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Juan García',
    email: 'juan@example.com',
    predictions: 45,
    joinDate: '2024-01-15',
    status: 'active',
  },
  {
    id: '2',
    name: 'María López',
    email: 'maria@example.com',
    predictions: 32,
    joinDate: '2024-02-20',
    status: 'active',
  },
  {
    id: '3',
    name: 'Carlos Rodríguez',
    email: 'carlos@example.com',
    predictions: 0,
    joinDate: '2024-03-10',
    status: 'inactive',
  },
  {
    id: '4',
    name: 'Ana Martínez',
    email: 'ana@example.com',
    predictions: 28,
    joinDate: '2024-01-05',
    status: 'suspended',
  },
];

export function UsersManagementScreen() {
  const { theme } = useAppTheme();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredUsers = users.filter((user) => {
    if (selectedFilter === 'all') return true;
    return user.status === selectedFilter;
  });

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'inactive':
        return theme.colors.warning;
      case 'suspended':
        return theme.colors.error;
    }
  };

  const getStatusLabel = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'suspended':
        return 'Suspendido';
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
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
            {item.name}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
            {item.email}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="chart-line"
            size={16}
            color={theme.colors.primary}
          />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            {item.predictions} predicciones
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="calendar"
            size={16}
            color={theme.colors.primary}
          />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            {item.joinDate}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.primaryLight },
          ]}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={16}
            color={theme.colors.primary}
          />
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>
            Editar
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.surfaceAlt },
          ]}
        >
          <MaterialCommunityIcons
            name="delete"
            size={16}
            color={theme.colors.error}
          />
          <Text style={[styles.actionText, { color: theme.colors.error }]}>
            Eliminar
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header */}
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
              {filteredUsers.length} usuarios
            </Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {(['all', 'active', 'inactive'] as const).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    selectedFilter === filter
                      ? theme.colors.primary
                      : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      selectedFilter === filter
                        ? '#fff'
                        : theme.colors.text,
                  },
                ]}
              >
                {filter === 'all' ? 'Todos' : filter === 'active' ? 'Activos' : 'Inactivos'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Users List */}
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          gap={spacing.md}
        />
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
  title: {
    fontSize: 20,
    fontWeight: typography.bold as any,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: typography.regular as any,
    marginTop: spacing.xs,
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
  userEmail: {
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
  userStats: {
    gap: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statText: {
    fontSize: 12,
    fontWeight: typography.regular as any,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
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
});
