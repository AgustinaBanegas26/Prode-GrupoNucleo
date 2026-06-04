import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';

type Strength = {
  label: string;
  percent: number;
  color: string;
};

type Props = {
  password: string;
};

function computeStrength(password: string, colors: { danger: string; warn: string; info: string; success: string }) {
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const checks = [hasMinLen, hasUpper, hasLower, hasNumber, hasSymbol];
  const score = checks.reduce((acc, ok) => (ok ? acc + 1 : acc), 0);

  if (!password.length) {
    return { label: 'Muy débil', percent: 0, color: colors.danger } satisfies Strength;
  }

  if (score <= 1) return { label: 'Muy débil', percent: 20, color: colors.danger } satisfies Strength;
  if (score === 2) return { label: 'Débil', percent: 40, color: colors.danger } satisfies Strength;
  if (score === 3) return { label: 'Media', percent: 60, color: colors.warn } satisfies Strength;
  if (score === 4) return { label: 'Fuerte', percent: 80, color: colors.info } satisfies Strength;
  return { label: 'Muy fuerte', percent: 100, color: colors.success } satisfies Strength;
}

export function PasswordStrengthBar({ password }: Props) {
  const { theme } = useAppTheme();

  const colors = useMemo(
    () => ({
      danger: theme.colors.primary,
      warn: theme.isDark ? '#F59E0B' : '#D97706',
      info: theme.isDark ? '#60A5FA' : '#2563EB',
      success: theme.isDark ? '#34D399' : '#059669',
    }),
    [theme.colors.primary, theme.isDark],
  );

  const strength = useMemo(() => computeStrength(password, colors), [password, colors]);
  const trackColor = theme.isDark ? '#111827' : theme.colors.border;

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          height: 10,
          borderRadius: 999,
          backgroundColor: trackColor,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${strength.percent}%`,
            backgroundColor: strength.color,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.colors.muted, fontSize: 12, fontWeight: '700' }}>{strength.label}</Text>
        <Text style={{ color: theme.colors.muted, fontSize: 12, fontWeight: '700' }}>{strength.percent}%</Text>
      </View>
    </View>
  );
}

