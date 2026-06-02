import { Image, Text, View } from 'react-native';

import { Screen } from '../src/components/Screen';
import { useAppTheme } from '../src/providers/ThemeProvider';

export default function HomeScreen() {
  const { theme } = useAppTheme();

  const logoSource = theme.isDark
    ? require('../images/icononucleo-light.png')
    : require('../images/icononucleo.png');

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <Image source={logoSource} style={{ width: 180, height: 180 }} resizeMode="contain" />
        <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '700' }}>
          Prode Grupo Núcleo
        </Text>
      </View>
    </Screen>
  );
}
