import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, Image, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { type NewsItem, useNewsStore } from '../store/newsStore';

const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

export function NewsListScreen() {
  const { theme } = useAppTheme();
  const items = useNewsStore((s) => s.items);
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const published = useMemo(
    () => items.filter((n) => n.status === 'published').sort((a, b) => b.date - a.date),
    [items],
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="newspaper-variant" size={28} color={theme.colors.primary} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Noticias</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {published.length} publicadas
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {published.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => setSelected(n)}
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <View style={styles.preview}>
                <View style={[styles.previewImage, { backgroundColor: theme.colors.surfaceAlt }]}>
                  <Image source={{ uri: n.imageUrl }} style={StyleSheet.absoluteFill} />
                </View>
              </View>
              <View style={styles.body}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
                  {n.title}
                </Text>
                <Text style={[styles.cardMeta, { color: theme.colors.textSecondary }]}>{formatDate(n.date)}</Text>
                <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]} numberOfLines={3}>
                  {n.description}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
          <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]} numberOfLines={2}>
                  {selected?.title ?? ''}
                </Text>
                <Pressable onPress={() => setSelected(null)}>
                  <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
                </Pressable>
              </View>
              <View style={styles.modalBody}>
                <Text style={[styles.modalMeta, { color: theme.colors.textSecondary }]}>
                  {selected ? formatDate(selected.date) : ''}
                </Text>
                <Text style={[styles.modalDesc, { color: theme.colors.text }]}>{selected?.description ?? ''}</Text>
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
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  list: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.sm,
  },
  preview: {
    height: 160,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: typography.regular as any,
  },
  cardDesc: {
    fontSize: 12,
    fontWeight: typography.regular as any,
    lineHeight: 18,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: typography.bold as any,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  modalMeta: {
    fontSize: 12,
    fontWeight: typography.medium as any,
  },
  modalDesc: {
    fontSize: 13,
    fontWeight: typography.regular as any,
    lineHeight: 20,
  },
});

