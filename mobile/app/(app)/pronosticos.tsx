import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AppHeader, PredictionCard } from '../../src/components';
import { Screen } from '../../src/components/Screen';
import { predictions } from '../../src/features/mockData';

export default function PredictionsScreen() {
  const router = useRouter();

  return (
    <Screen style={styles.screen}>
      <AppHeader />
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Pronósticos</Text>
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PredictionCard
              {...item}
              onPress={() => router.push('/(app)/fixture')}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 18,
  },
  listContent: {
    paddingBottom: 40,
  },
});
