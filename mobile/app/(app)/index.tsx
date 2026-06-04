import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  AppHeader,
  SportMatchCard,
  ImageCarousel,
  DashboardSection,
  Container,
} from '../../src/components';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import type { CarouselItem } from '../../src/components/ImageCarousel';
import {
  homePosition,
  getUpcomingMatches,
} from '../../src/features/mockData';
import { useSliderStore } from '../../src/features/content/store/sliderStore';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';

export default function AppHomeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user, logout } = useAuth();
  const slides = useSliderStore((s) => s.slides);

  if (!user) {
    return null;
  }

  const carouselItems: CarouselItem[] = slides
    .filter((s) => s.status === 'active')
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      id: s.id,
      title: s.title,
      imageUrl: s.imageUrl,
      link: s.button.enabled ? s.button.internalLink ?? s.button.externalLink : undefined,
    }));

  const handleCarouselPress = (item: CarouselItem) => {
    if (item.link) {
      if (item.link.startsWith('http')) {
        Linking.openURL(item.link);
      } else {
        router.push(item.link as any);
      }
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Inicio' }} />
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Container>
          <View style={{ marginBottom: 20, gap: 8 }}>
            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>
              👋 Hola, {user.nombre}
            </Text>
            <View style={{ gap: 4 }}>
              <Text style={{ color: theme.colors.textSecondary }}>
                Rol: {user.role === 'admin' ? 'Administrador' : 'Cliente'}
              </Text>
              {user.role === 'admin' ? (
                <Text style={{ color: theme.colors.textSecondary }}>Usuario: {user.admin_id}</Text>
              ) : (
                <Text style={{ color: theme.colors.textSecondary }}>Número de Cliente: {user.cliente_id}</Text>
              )}
            </View>
            <Button title="Cerrar sesión" variant="secondary" onPress={async () => { await logout(); router.replace('/(auth)/login'); }} />
          </View>

          {/* Carousel */}
          <ImageCarousel items={carouselItems} onItemPress={handleCarouselPress} />

          {/* Mi Posición */}
          <DashboardSection
            title="🏆 Mi posición"
            icon="trophy"
            action={{
              label: 'Ver ranking',
              onPress: () => router.push('/(app)/posiciones'),
            }}
          >
            <View style={styles.positionGrid}>
              <View style={styles.positionCard}>
                <Text style={[styles.positionLabel, { color: theme.colors.textSecondary }]}>
                  Posición
                </Text>
                <Text style={[styles.positionValue, { color: theme.colors.primary }]}>
                  {homePosition.position}
                </Text>
              </View>
              <View style={styles.positionCard}>
                <Text style={[styles.positionLabel, { color: theme.colors.textSecondary }]}>
                  Puntos
                </Text>
                <Text style={[styles.positionValue, { color: theme.colors.text }]}>
                  {homePosition.points}
                </Text>
              </View>
              <View style={styles.positionCard}>
                <Text style={[styles.positionLabel, { color: theme.colors.textSecondary }]}>
                  Variación
                </Text>
                <Text style={[styles.variationValue, { color: theme.colors.success }]}>
                  +{homePosition.variation}
                </Text>
              </View>
            </View>
          </DashboardSection>

          {/* Próximos Partidos */}
          <DashboardSection
            title="⚽ Próximos partidos"
            icon="calendar"
            action={{
              label: 'Ver fixture',
              onPress: () => router.push('/(app)/fixture'),
            }}
          >
            {getUpcomingMatches(3).map((item) => (
              <SportMatchCard
                key={item.id}
                {...item}
                onPress={() =>
                  router.push({ pathname: '/(app)/details/detalle-partido', params: { matchId: item.id } })
                }
              />
            ))}
          </DashboardSection>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={[styles.quickActionsTitle, { color: theme.colors.text }]}>
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
                onPress={() => console.log('Notificaciones')}
              />
              <QuickActionButton
                icon="share-variant"
                label="Compartir"
                onPress={() => console.log('Compartir')}
              />
            </View>
          </View>
        </Container>
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
      style={[
        styles.actionButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={24}
        color={theme.colors.primary}
      />
      <Text
        style={[
          styles.actionLabel,
          {
            color: theme.colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  positionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  positionCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  positionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  positionValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '800',
  },
  variationValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '800',
  },
  matchList: {
    gap: 12,
  },
  quickActionsContainer: {
    marginTop: 24,
    marginBottom: 30,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

