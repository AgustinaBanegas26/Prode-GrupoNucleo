import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

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
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  const borderColor = error
    ? theme.colors.primary
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 50,
          borderRadius: 12,
          borderWidth: focused ? 1.5 : 1,
          borderColor,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !visible}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            color: theme.colors.text,
            fontSize: 15,
            paddingVertical: 0,
            // web-only (RNWeb): remover outline del browser
            outlineStyle: 'none' as any,
          }}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={12}
            style={{ marginLeft: 8 }}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={focused ? theme.colors.primary : theme.colors.muted}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={{ color: theme.colors.primary, fontSize: 12, marginTop: 2 }}>{error}</Text>
      ) : null}
    </View>
  );
}
