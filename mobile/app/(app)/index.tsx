import { useRouter } from 'expo-router';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import {
  AppHeader,
  MatchCard,
  ImageCarousel,
  DashboardSection,
  Container,
} from '../../src/components';
import { Screen } from '../../src/components/Screen';
import {
  homePosition,
  upcomingMatches,
} from '../../src/features/mockData';
import { useAppTheme } from '../../src/providers/ThemeProvider';

// Mock carousel data - will be replaced with API data
const carouselItems = [
  {
    id: '1',
    title: '¡Comienza el Mundial Innova 2024!',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=300&fit=crop',
    link: '/fixture',
  },
  {
    id: '2',
    title: 'Últimas noticias del torneo',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=300&fit=crop',
    link: '/noticias',
  },
  {
    id: '3',
    title: 'Clasificaciones actualizadas',
    imageUrl: 'https://images.unsplash.com/photo-1540747913ee8bbf0e19bb8a8368d7932c1449af0?w=600&h=300&fit=crop',
    link: '/posiciones',
  },
];

export default function AppHomeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const handleCarouselPress = (item: (typeof carouselItems)[0]) => {
    if (item.link) {
      router.push(item.link as any);
    }
  };

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Container>
          {/* Carousel */}
          <ImageCarousel items={carouselItems} onItemPress={handleCarouselPress} />

          {/* Mi Posición */}
          <DashboardSection
            title="Mi posición"
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
            title="Próximos partidos"
            icon="calendar"
            action={{
              label: 'Ver fixture',
              onPress: () => router.push('/(app)/fixture'),
            }}
          >
            <FlatList
              data={upcomingMatches.slice(0, 2)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MatchCard
                  {...item}
                  onPress={() =>
                    router.push({ pathname: '/(app)/details/detalle-partido', params: { matchId: item.id } })
                  }
                />
              )}
              scrollEnabled={false}
              contentContainerStyle={styles.matchList}
            />
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

