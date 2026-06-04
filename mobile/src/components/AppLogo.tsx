import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { useAppTheme } from '../providers/ThemeProvider';
import { useBrandingStore } from '../features/content/store/brandingStore';

const lightLogo = require('../../images/icononucleo-light.png');
const darkLogo = require('../../images/icononucleo.png');

export function AppLogo({ style }: { style?: StyleProp<ImageStyle> }) {
  const { resolvedScheme } = useAppTheme();
  const logoUrl = useBrandingStore((s) => s.config.logoUrl);

  return (
    <Image
      source={logoUrl ? { uri: logoUrl } : resolvedScheme === 'dark' ? darkLogo : lightLogo}
      style={[{ width: 100, height: 28, resizeMode: 'contain' }, style]}
    />
  );
}
