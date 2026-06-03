import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';
import { spacing } from '../theme/theme';

type ContainerProps = {
  children: React.ReactNode;
  style?: any;
};

export function Container({ children, style }: ContainerProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
});
