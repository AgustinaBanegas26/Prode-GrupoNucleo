import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  secureTextEntry?: boolean;
  error?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'none',
  keyboardType = 'default',
  secureTextEntry,
  error,
}: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={{
          height: 48,
          borderRadius: 12,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: error ? theme.colors.primary : theme.colors.border,
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
        }}
      />
      {error ? <Text style={{ color: theme.colors.primary, fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
}

