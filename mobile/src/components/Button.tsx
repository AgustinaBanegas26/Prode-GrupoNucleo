import React from 'react';
import { ActivityIndicator, Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary';
};

export function Button({
  title,
  onPress,
  disabled,
  loading,
  style,
  variant = 'primary',
}: Props) {
  const { theme } = useAppTheme();

  const isDisabled = Boolean(disabled || loading);
  const backgroundColor =
    variant === 'primary' ? theme.colors.primary : theme.isDark ? '#1F2937' : theme.colors.surface;
  const borderColor = variant === 'secondary' ? theme.colors.border : backgroundColor;
  const textColor =
    variant === 'primary' ? theme.colors.surface : theme.isDark ? theme.colors.text : theme.colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        {
          height: 48,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          backgroundColor,
          borderWidth: 1,
          borderColor,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      )}
    </Pressable>
  );
}

