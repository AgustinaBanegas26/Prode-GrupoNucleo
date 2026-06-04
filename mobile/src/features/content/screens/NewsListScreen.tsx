import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassHeader } from '../../../components/GlassHeader';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useAuth } from '../../../providers/AuthProvider';
import { radius, shadows, spacing } from '../../../theme/theme';
import { usePublishedNews, useNewsRealtime, type NewsRow } from '../api/news';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

export function NewsListScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selected, setSelected] = useState<NewsRow | null>(null);

  // Activa realtime
  useNewsRealtime();

  const { data: published, isLoading, isError } = usePublishedNews();

  const fullName = user?.nombre ?? 'Usuario';
  const initials = fullName.slice(0, 2).toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <GlassHeader userName={fullName} userInitials={initials} position={0} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
      >
        {/* Page title */}
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Noticias</Text>
          {published && published.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.countBadgeText}>{published.length}</Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : isError ? (
          <View style={styles.centerState}>
            <Feather name="alert-circle" size={40} color={theme.colors.muted} />
            <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>
              Error al cargar noticias.
            </Text>
          </View>
        ) : !published || published.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="inbox" size={44} color={theme.colors.muted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Sin noticias por ahora</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>
              Volvé a revisar más tarde.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {/* Featured — primera noticia grande */}
            {published[0] && (
              <Pressable
                onPress={() => setSelected(published[0])}
                style={({ pressed }) => [
                  styles.featuredCard,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: pressed ? 0.93 : 1 },
                  shadows.lg,
                ]}
                accessibilityRole="button"
                accessibilityLabel={published[0].title}
              >
                <View style={styles.featuredImage}>
                  {published[0].image_url ? (
                    <Image source={{ uri: published[0].image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : null}
                  <View style={styles.featuredOverlay} />
                  <View style={styles.featuredBadge}>
                    <Feather name="star" size={10} color="#fff" />
                    <Text style={styles.featuredBadgeText}>DESTACADO</Text>
                  </View>
                </View>
                <View style={styles.featuredBody}>
                  <Text style={[styles.featuredDate, { color: theme.colors.muted }]}>
                    {formatDate(published[0].created_at)}
                  </Text>
                  <Text style={[styles.featuredTitle, { color: theme.colors.text }]} numberOfLines={2}>
                    {published[0].title}
                  </Text>
                  <Text style={[styles.featuredDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {published[0].description}
                  </Text>
                  <View style={styles.readMore}>
                    <Text style={[styles.readMoreText, { color: theme.colors.primary }]}>Leer más</Text>
                    <Feather name="arrow-right" size={13} color={theme.colors.primary} />
                  </View>
                </View>
              </Pressable>
            )}

            {/* Resto de noticias */}
            {published.slice(1).map((n) => (
              <Pressable
                key={n.id}
                onPress={() => setSelected(n)}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: pressed ? 0.92 : 1 },
                  shadows.sm,
                ]}
                accessibilityRole="button"
                accessibilityLabel={n.title}
              >
                <View style={styles.cardImage}>
                  {n.image_url ? (
                    <Image source={{ uri: n.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : null}
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardDate, { color: theme.colors.muted }]}>{formatDate(n.created_at)}</Text>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>{n.title}</Text>
                  <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>{n.description}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {selected?.image_url ? (
              <View style={styles.modalImage}>
                <Image source={{ uri: selected.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <Pressable
                  style={[styles.modalCloseBtn, { top: insets.top + 12 }]}
                  onPress={() => setSelected(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                >
                  <Feather name="x" size={18} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel="Cerrar">
                  <Feather name="x" size={22} color={theme.colors.textSecondary} />
                </Pressable>
              </View>
            )}
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={[styles.modalDate, { color: theme.colors.muted }]}>
                {selected ? formatDate(selected.created_at) : ''}
              </Text>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {selected?.title ?? ''}
              </Text>
              <Text style={[styles.modalDesc, { color: theme.colors.textSecondary }]}>
                {selected?.description ?? ''}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  pageTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  countBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  centerState: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySubtitle: { fontSize: 13 },
  list: { gap: spacing.md },
  featuredCard: { borderRadius: radius['2xl'], borderWidth: 1, overflow: 'hidden', marginBottom: spacing.sm },
  featuredImage: { height: 200, position: 'relative' },
  featuredOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.35)' },
  featuredBadge: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#CC2627', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  featuredBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  featuredBody: { padding: spacing.xl, gap: spacing.sm },
  featuredDate: { fontSize: 11, fontWeight: '600' },
  featuredTitle: { fontSize: 18, fontWeight: '800', lineHeight: 24 },
  featuredDesc: { fontSize: 13, lineHeight: 19 },
  readMore: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  readMoreText: { fontSize: 13, fontWeight: '700' },
  card: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  cardImage: { width: 100, height: 100, backgroundColor: '#1a1a1a' },
  cardBody: { flex: 1, padding: spacing.md, gap: 4 },
  cardDate: { fontSize: 11, fontWeight: '500' },
  cardTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  cardDesc: { fontSize: 12, lineHeight: 17 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, maxHeight: '90%', overflow: 'hidden' },
  modalImage: { height: 220, position: 'relative' },
  modalCloseBtn: { position: 'absolute', right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.lg },
  modalBody: { padding: spacing.xl, gap: spacing.sm, paddingBottom: 48 },
  modalDate: { fontSize: 12, fontWeight: '600' },
  modalTitle: { fontSize: 20, fontWeight: '800', lineHeight: 26 },
  modalDesc: { fontSize: 14, lineHeight: 22, marginTop: spacing.sm },
});
