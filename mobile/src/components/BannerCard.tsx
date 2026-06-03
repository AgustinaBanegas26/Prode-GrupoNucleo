import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { useAppTheme } from '../providers/ThemeProvider';

type Props = {
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
};

export function BannerCard({ title, description, actionLabel, onPress }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}> 
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Pressable style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      </View>
      <View style={styles.graphicContainer}>
        <View style={styles.iconWrapper}>
          <FontAwesome5 name="trophy" size={32} color="#fff" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 16,
    opacity: 0.92,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
  },
  buttonText: {
    color: '#CC2627',
    fontSize: 14,
    fontWeight: '700',
  },
  graphicContainer: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
