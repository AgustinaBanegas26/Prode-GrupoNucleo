import { Tabs } from 'expo-router';

import { FloatingTabBar } from '../../src/components/FloatingTabBar';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Ocultamos el tab bar nativo, usamos el flotante
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    />
  );
}
