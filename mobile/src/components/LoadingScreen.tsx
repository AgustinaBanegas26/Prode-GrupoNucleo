import React from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';

import { Screen } from './Screen';
import { useAppTheme } from '../providers/ThemeProvider';

export function LoadingScreen({ title = 'Cargando...' }: { title?: string }) {
  const { theme } = useAppTheme();

  const logoSource = theme.isDark
        ? require('../../images/icononucleo.png')
        : require('../../images/icononucleo-light.png')

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <Image source={logoSource} style={{ width: 120, height: 120 }} resizeMode="contain" />
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>{title}</Text>
      </View>
    </Screen>
  );
}

