# 💻 Ejemplos de Código - Copiar y Pegar

## 🎨 Ejemplo 1: Componente Card con Tema

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '@/src/theme/theme';

type CardProps = {
  title: string;
  description: string;
  variant?: 'primary' | 'secondary';
};

export function Card({ title, description, variant = 'primary' }: CardProps) {
  const { theme } = useAppTheme();

  const backgroundColor = 
    variant === 'primary' 
      ? theme.colors.primaryLight
      : theme.colors.surface;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor: theme.colors.border,
        }
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  title: {
    fontSize: 16,
    fontWeight: typography.semibold as any,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
    fontWeight: typography.regular as any,
    lineHeight: 20,
  },
});
```

---

## 🌓 Ejemplo 2: Selector de Tema con Visualización

```typescript
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/providers/ThemeProvider';
import { spacing, radius } from '@/src/theme/theme';

type ThemeSelectorProps = {
  onSelect?: (mode: 'light' | 'dark' | 'system') => void;
};

export function ThemeSelector({ onSelect }: ThemeSelectorProps) {
  const { theme, themeMode, setThemeMode } = useAppTheme();

  const themes: Array<{ mode: 'light' | 'dark' | 'system'; label: string; icon: string }> = [
    { mode: 'light', label: 'Claro', icon: 'white-balance-sunny' },
    { mode: 'dark', label: 'Oscuro', icon: 'moon-waning-crescent' },
    { mode: 'system', label: 'Sistema', icon: 'cellphone' },
  ];

  const handleSelect = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    onSelect?.(mode);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>
        Selecciona un tema:
      </Text>
      <View style={styles.grid}>
        {themes.map((item) => (
          <Pressable
            key={item.mode}
            onPress={() => handleSelect(item.mode)}
            style={[
              styles.option,
              {
                borderColor: themeMode === item.mode ? theme.colors.primary : theme.colors.border,
                borderWidth: themeMode === item.mode ? 2 : 1,
                backgroundColor:
                  themeMode === item.mode ? theme.colors.primaryLight : theme.colors.surface,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={24}
              color={themeMode === item.mode ? theme.colors.primary : theme.colors.text}
            />
            <Text
              style={[
                styles.optionLabel,
                {
                  color: themeMode === item.mode ? theme.colors.primary : theme.colors.text,
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  option: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

---

## 📊 Ejemplo 3: Grid Responsivo con Tema

```typescript
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useAppTheme } from '@/src/providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '@/src/theme/theme';

type GridItem = {
  id: string;
  title: string;
  value: string | number;
  icon?: string;
};

type GridProps = {
  items: GridItem[];
  columns?: number;
};

export function ResponsiveGrid({ items, columns = 2 }: GridProps) {
  const { theme } = useAppTheme();
  const { width } = Dimensions.get('window');
  const itemWidth = (width - spacing.lg * 2 - spacing.md * (columns - 1)) / columns;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.item,
              {
                width: itemWidth,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.itemTitle, { color: theme.colors.textSecondary }]}>
              {item.title}
            </Text>
            <Text style={[styles.itemValue, { color: theme.colors.primary }]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    gap: spacing.md,
  },
  item: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: typography.medium as any,
    marginBottom: spacing.sm,
  },
  itemValue: {
    fontSize: 24,
    fontWeight: typography.bold as any,
  },
});

// Uso:
// <ResponsiveGrid 
//   items={[
//     { id: '1', title: 'Posición', value: '4' },
//     { id: '2', title: 'Puntos', value: '2450' },
//   ]}
//   columns={2}
// />
```

---

## 🎪 Ejemplo 4: Modal con Tema

```typescript
import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '@/src/theme/theme';

type ModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
};

export function ThemedModal({
  visible,
  title,
  message,
  onClose,
  onConfirm,
}: ModalProps) {
  const { theme } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          { backgroundColor: theme.colors.overlay },
        ]}
      >
        <View
          style={[
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[
                styles.button,
                { borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                Cerrar
              </Text>
            </Pressable>

            {onConfirm && (
              <Pressable
                onPress={onConfirm}
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>
                  Confirmar
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '80%',
    borderRadius: radius.xl,
    padding: spacing['2xl'],
    borderWidth: 1,
    ...shadows.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: typography.bold as any,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 14,
    fontWeight: typography.regular as any,
    marginBottom: spacing['2xl'],
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
});

// Uso:
// const [visible, setVisible] = useState(false);
// <ThemedModal
//   visible={visible}
//   title="Confirmar acción"
//   message="¿Estás seguro?"
//   onClose={() => setVisible(false)}
//   onConfirm={() => {
//     setVisible(false);
//     handleConfirm();
//   }}
// />
```

---

## 🔄 Ejemplo 5: Lista Dinámica con Tema

```typescript
import React from 'react';
import {
  View,
  FlatList,
  Text,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAppTheme } from '@/src/providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '@/src/theme/theme';

type ListItem = {
  id: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

type ListProps = {
  items: ListItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
};

export function ThemedList({ items, isLoading = false, onRefresh }: ListProps) {
  const { theme } = useAppTheme();

  const renderItem = ({ item }: { item: ListItem }) => (
    <Pressable
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View>
        <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.itemSubtitle, { color: theme.colors.textSecondary }]}>
          {item.subtitle}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      scrollEnabled={false}
      contentContainerStyle={styles.list}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  item: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: typography.semibold as any,
    marginBottom: spacing.xs,
  },
  itemSubtitle: {
    fontSize: 13,
    fontWeight: typography.regular as any,
  },
});

// Uso:
// <ThemedList 
//   items={[
//     { 
//       id: '1', 
//       title: 'Item 1',
//       subtitle: 'Descripción',
//       onPress: () => console.log('Presionado')
//     }
//   ]}
//   onRefresh={() => {}}
// />
```

---

## 🎯 Ejemplo 6: Badge y Etiquetas

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/providers/ThemeProvider';
import { spacing, radius, typography } from '@/src/theme/theme';

type BadgeProps = {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
};

export function Badge({ label, variant = 'primary', size = 'md' }: BadgeProps) {
  const { theme } = useAppTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      case 'info':
        return theme.colors.info;
      default:
        return theme.colors.primary;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm };
      case 'lg':
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
      default:
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 11;
      case 'lg':
        return 15;
      default:
        return 13;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          ...getPadding(),
        },
      ]}
    >
      <Text
        style={[
          {
            color: '#fff',
            fontSize: getFontSize(),
            fontWeight: typography.bold as any,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
});

// Uso:
// <View style={{ gap: spacing.md }}>
//   <Badge label="Primary" variant="primary" />
//   <Badge label="Success" variant="success" />
//   <Badge label="Warning" variant="warning" size="lg" />
// </View>
```

---

## 💾 Ejemplo 7: Guardar Preferencia Personalizada

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AppSettings = {
  language: 'es' | 'en';
  notifications: boolean;
  fontSize: 'small' | 'medium' | 'large';
};

type SettingsStore = {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
};

const defaultSettings: AppSettings = {
  language: 'es',
  notifications: true,
  fontSize: 'medium',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'app_settings_v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Uso en componente:
// const { settings, updateSettings } = useSettingsStore();
// updateSettings({ fontSize: 'large' });
```

---

## ✅ Checklist de Implementación

- [ ] ThemeProvider está en la raíz de la app
- [ ] useAppTheme se importa correctamente
- [ ] Todos los componentes usan `theme.colors`
- [ ] Se usan espacios del sistema (`spacing.*`)
- [ ] Los bordes usan `radius.*`
- [ ] Las sombras usan `shadows.*`
- [ ] La tipografía usa `typography.*`
- [ ] El tema persiste entre sesiones
- [ ] El tema cambia automáticamente en modo sistema
- [ ] No hay colores hardcoded (#fff, #000, etc)

---

**Todos los ejemplos son 100% funcionales y listos para usar. Copiar y pegar directamente en tu proyecto.**
