import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

type UserAvatarProps = {
  name: string;
  uri?: string | null;
  size: number;
  isHighlighted?: boolean;
  highlightColor?: string;
  fallbackBg?: string;
  fallbackTextColor?: string;
  borderColor?: string;
  borderWidth?: number;
  style?: ViewStyle;
};

export function UserAvatar({
  name,
  uri,
  size,
  isHighlighted = false,
  highlightColor = '#3DA5F5',
  fallbackBg,
  fallbackTextColor,
  borderColor,
  borderWidth = 0,
  style,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = name.slice(0, 2).toUpperCase();
  const radius = size / 2;

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    borderWidth,
    borderColor,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fallbackBg ?? (isHighlighted ? highlightColor : 'rgba(0,0,0,0.06)'),
  };

  if (uri && !failed) {
    return (
      <View style={[containerStyle, style]}>
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <Text
        style={[
          styles.initials,
          {
            fontSize: size * 0.34,
            color: fallbackTextColor ?? (isHighlighted ? '#fff' : '#6B7280'),
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  initials: { fontWeight: '700' },
});
