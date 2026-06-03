import { Tabs } from 'expo-router';

import { BottomTabBar } from '../../src/components/BottomTabBar';
import { useAppTheme } from '../../src/providers/ThemeProvider';

export default function AppLayout() {
  const { theme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 80,
          paddingBottom: 8,
        },
      }}
      tabBar={(props) => <BottomTabBar {...props} />}
    />
  );
}

