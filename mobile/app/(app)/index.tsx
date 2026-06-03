import { useRouter } from 'expo-router';
import { FlatList, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  GlassHeader,
  HeroStatsBanner,
  SportMatchCard,
  QuickRankingPodium,
  DashboardSection,
} from '../../src/components';
import { Screen } from '../../src/components/Screen';
import {
  homePosition,
  upcomingMatches,
  rankingData,
} from '../../src/features/mockData';
import { useSliderStore } from '../../src/features/content/store/sliderStore';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuthStore } from '../../src/store/authStore';
import { spacing } from '../../src/theme/theme';

export default function AppHomeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const slides = useSliderStore((s) => s.slides);
  const session = useAuthStore((s) => s.session);

  const userName = session?.user
    ? `${session.user.nombre} ${session.user.apellido}`
    : 'Usuario';
  const userInitials = session?.user
    ? `${session.user.nombre[0] ?? ''}${session.user.apellido[0] ?? ''}`
    : 'U';

  // Tomar la primera imagen del slider como fondo del hero
  const heroImage = slides
    .filter((s) => s.status === 'active')
    .sort((a, b) => a.order - b.order)[0]?.imageUrl;

  const top3 = rankingData.slice(0, 3);

  return (
    <Screen>
      <GlassHeader
        userName={userName}
        userInitials={userInitials.toUpperCase()}
        position={homePosition.position}
        hasUnreadNotifications
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero principal */}
        <View style={styles.heroContainer}>
          <HeroStatsBanner
            backgroundImageUrl={heroImage}
            position={homePosition.position}
            points={homePosition.points}
            variation={homePosition.variation}
            variationDirection="up"
            remainingMatches={2}
            tournamentName="Mundial 2026"
            onViewRankingPress={() => router.push('/(app)/posiciones')}
          />
        </View>

        {/* Próximos Partidos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Próximos partidos
            </Text>
            <Pressable
              onPress={() => router.push('/(app)/fixture')}
              accessibilityRole="button"
              accessibilityLabel="Ver fixture completo"
            >
              <Text style={[styles.sectionLink, { color: theme.colors.primary }]}>
                Ver fixture →
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={upcomingMatches.slice(0, 2)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SportMatchCard
                homeTeam={item.homeTeam}
                awayTeam={item.awayTeam}
                homeCode={item.homeCode}
                awayCode={item.awayCode}
                date={item.date}
                time={item.time}
                group={item.group}
                phase={item.phase}
                matchStatus="upcoming"
                onPress={() =>
                  router.push({
                    pathname: '/(app)/details/detalle-partido',
                    params: { matchId: item.id },
                  })
                }
              />
            )}
            scrollEnabled={false}
            contentContainerStyle={styles.matchList}
          />
        </View>

        {/* Top 3 Podio */}
        <View style={styles.podiumSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Ranking rápido
            </Text>
          </View>
          <QuickRankingPodium
            top3={top3}
            onViewAllPress={() => router.push('/(app)/posiciones')}
          />
        </View>

        {/* Accesos rápidos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Accesos rápidos
          </Text>
          <View style={styles.actionsGrid}>
            <QuickActionButton
              icon="chart-line"
              label="Pronósticos"
              onPress={() => router.push('/(app)/pronosticos')}
            />
            <QuickActionButton
              icon="account"
              label="Mi perfil"
              onPress={() => router.push('/(app)/perfil')}
            />
            <QuickActionButton
              icon="bell"
              label="Notificaciones"
              onPress={() => {}}
            />
            <QuickActionButton
              icon="share-variant"
              label="Compartir"
              onPress={() => {}}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function QuickActionButton({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MaterialCommunityIcons name={icon as any} size={26} color={theme.colors.primary} />
      <Text style={[styles.actionLabel, { color: theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 110,
  },
  heroContainer: {
    paddingTop: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  podiumSection: {
    marginBottom: spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  matchList: {
    gap: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    width: '47%',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
