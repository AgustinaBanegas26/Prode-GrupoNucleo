import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../../providers/ThemeProvider';

const CELESTE_DARK = '#3DA5F5';
const DEEP_BLUE = '#0F4C81';

type AuthScreenShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthScreenShell({ title, subtitle, children, footer }: AuthScreenShellProps) {
  const { theme } = useAppTheme();

  const logoSource = useMemo(
    () =>
      theme.isDark
        ? require('../../../images/icononucleo.png')
        : require('../../../images/icononucleo-light.png'),
    [theme.isDark],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.isDark ? '#0D0D0D' : '#F5F7FA' }}>
      <LinearGradient
        colors={[CELESTE_DARK, DEEP_BLUE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.circleL} />
      <View style={styles.circleS} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image source={logoSource} style={styles.logo} resizeMode="contain" />
            <Text style={styles.heroTitle}>{title}</Text>
            {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.isDark ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.95)',
                borderColor: theme.isDark ? 'rgba(110,198,255,0.2)' : 'rgba(110,198,255,0.4)',
              },
            ]}
          >
            {children}
          </View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  circleL: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    top: -100,
    right: -100,
  },
  circleS: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    bottom: -50,
    left: -50,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
});
