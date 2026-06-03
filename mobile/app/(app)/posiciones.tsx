import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader, RankingCard } from '../../src/components';
import { Screen } from '../../src/components/Screen';
import { rankingData } from '../../src/features/mockData';

export default function RankingsScreen() {
  const [selectedTab, setSelectedTab] = useState<'General' | 'Semanal'>('General');

  return (
    <Screen style={styles.screen}>
      <AppHeader />
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Posiciones</Text>
        <View style={styles.tabBar}>
          {['General', 'Semanal'].map((tab) => (
            <Text
              key={tab}
              onPress={() => setSelectedTab(tab as 'General' | 'Semanal')}
              style={[styles.tabItem, selectedTab === tab && styles.tabItemActive]}
            >
              {tab}
            </Text>
          ))}
        </View>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>#</Text>
          <Text style={[styles.tableHeaderText, styles.userColumn]}>Usuario</Text>
          <Text style={styles.tableHeaderText}>Pts</Text>
          <Text style={styles.tableHeaderText}>PJ</Text>
          <Text style={styles.tableHeaderText}>DG</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {rankingData.map((item) => (
            <RankingCard key={item.id} item={item} />
          ))}
        </ScrollView>
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
  tabBar: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#11182710',
    color: '#5C5C5C',
    fontWeight: '700',
    marginRight: 12,
  },
  tabItemActive: {
    backgroundColor: '#CC2627',
    color: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingLeft: 10,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#5C5C5C',
  },
  userColumn: {
    flex: 3,
  },
  listContent: {
    paddingBottom: 40,
  },
});
