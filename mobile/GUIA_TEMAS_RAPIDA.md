# 🎨 Guía Rápida: Sistema de Temas Mejorado

## 📚 Archivos Principales

### **1. src/theme/theme.ts** - Sistema de Diseño Completo
```typescript
// Acceso a colores, espaciamiento, bordes, sombras
import { colors, spacing, radius, shadows, typography } from '@/src/theme/theme';

// Paleta Primary con 10 variantes
colors.primary[50]   // Más claro
colors.primary[500]  // Color base
colors.primary[900]  // Más oscuro

// Espaciamiento (8px scale)
spacing.xs  // 4px
spacing.sm  // 8px
spacing.md  // 12px
spacing.lg  // 16px
spacing.xl  // 20px
spacing['2xl']  // 24px

// Bordes
radius.sm      // 6px
radius.md      // 12px
radius.lg      // 16px
radius.full    // 9999px

// Sombras (iOS + Android)
shadows.sm   // Suave
shadows.md   // Normal
shadows.lg   // Grande
shadows.xl   // Extra grande

// Tipografía
typography.regular      // 400
typography.medium       // 500
typography.semibold     // 600
typography.bold         // 700
```

---

### **2. src/providers/ThemeProvider.tsx** - Gestor de Temas
```typescript
import { useAppTheme } from '@/src/providers/ThemeProvider';

export function MyComponent() {
  const {
    theme,           // Objeto de tema completo
    isDark,          // Boolean: true si está en modo oscuro
    colorScheme,     // 'light' | 'dark'
    themeMode,       // 'light' | 'dark' | 'system'
    setThemeMode,    // (mode: ThemeMode) => void
    fontsLoaded      // Boolean: true si Poppins está cargada
  } = useAppTheme();

  return (
    <View style={{ backgroundColor: theme.colors.surface }} />
  );
}
```

---

### **3. src/components/ThemeToggle.tsx** - Cambiar Tema
```typescript
import { ThemeToggle } from '@/src/components';

// Uso simple en AppHeader
<ThemeToggle onPress={() => console.log('Tema cambiado')} />

// Cicla automáticamente:
// 1. Claro (☀️)
// 2. Oscuro (🌙)
// 3. Sistema (📱)
// 4. Claro (☀️) ...
```

---

### **4. src/components/ImageCarousel.tsx** - Carrusel Dinámico
```typescript
import { ImageCarousel } from '@/src/components';

const banners = [
  {
    id: '1',
    title: 'Banner 1',
    imageUrl: 'https://...',
    link: '/fixture'
  },
  {
    id: '2',
    title: 'Banner 2',
    imageUrl: 'https://...',
    link: '/posiciones'
  }
];

<ImageCarousel 
  items={banners}
  onItemPress={(item) => router.push(item.link)}
  autoplayInterval={5000}
/>
```

---

### **5. src/components/DashboardSection.tsx** - Secciones Agrupadas
```typescript
import { DashboardSection } from '@/src/components';

<DashboardSection
  title="Mi posición"
  icon="trophy"  // MaterialCommunityIcons
  action={{
    label: 'Ver ranking',
    onPress: () => router.push('/posiciones')
  }}
>
  {/* Contenido aquí */}
</DashboardSection>
```

---

## 🎯 Ejemplos de Uso

### **Ejemplo 1: Componente con Tema**
```typescript
import { useAppTheme } from '@/src/providers/ThemeProvider';
import { spacing, radius, shadows } from '@/src/theme/theme';
import { View, Text, StyleSheet } from 'react-native';

export function Card() {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }
      ]}
    >
      <Text style={{ color: theme.colors.text }}>
        Contenido dinámico
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    ...shadows.md,
  },
});
```

### **Ejemplo 2: Cambiar Tema Dinámicamente**
```typescript
import { useAppTheme } from '@/src/providers/ThemeProvider';
import { Button } from '@/src/components';

export function ThemeSwitcher() {
  const { themeMode, setThemeMode, isDark } = useAppTheme();

  return (
    <Button
      title={`Cambiar a ${isDark ? 'claro' : 'oscuro'}`}
      onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
    />
  );
}
```

### **Ejemplo 3: Dashboard Completo**
```typescript
import { DashboardSection, Container } from '@/src/components';
import { FlatList, ScrollView } from 'react-native';

export function Dashboard() {
  return (
    <ScrollView>
      <Container>
        <DashboardSection
          title="Mi posición"
          icon="trophy"
          action={{
            label: 'Ver más',
            onPress: () => {}
          }}
        >
          {/* Contenido */}
        </DashboardSection>

        <DashboardSection
          title="Próximos partidos"
          icon="calendar"
        >
          <FlatList
            data={matches}
            renderItem={({ item }) => <MatchCard {...item} />}
            scrollEnabled={false}
          />
        </DashboardSection>
      </Container>
    </ScrollView>
  );
}
```

---

## 🎨 Paleta de Colores Disponibles

### **Tema Claro:**
| Elemento | Color | Uso |
|----------|-------|-----|
| Fondo | #F5F5F5 | Fondo principal |
| Superficie | #FFFFFF | Cards, panels |
| Texto Principal | #212121 | Títulos, body |
| Texto Secundario | #616161 | Subtítulos |
| Texto Terciario | #757575 | Labels |
| Primary | #CC2627 | Botones, accents |
| Border | #EEEEEE | Divisores |

### **Tema Oscuro:**
| Elemento | Color | Uso |
|----------|-------|-----|
| Fondo | #121212 | Fondo principal |
| Superficie | #1E1E1E | Cards, panels |
| Texto Principal | #FAFAFA | Títulos, body |
| Texto Secundario | #E0E0E0 | Subtítulos |
| Texto Terciario | #BDBDBD | Labels |
| Primary | #CC2627 | Botones, accents |
| Border | #2B2B2B | Divisores |

---

## 🔧 Troubleshooting

### **Problema: Tema no persiste**
```typescript
// Verificar que ThemeProvider está en la raíz
<ThemeProvider>
  <AuthGate>
    <Slot />
  </AuthGate>
</ThemeProvider>
```

### **Problema: Fuente Poppins no se aplica**
```typescript
// Verificar que fontsLoaded es true
const { fontsLoaded } = useAppTheme();
if (!fontsLoaded) return null;

// Esperar a que se cargue antes de renderizar
```

### **Problema: Colores no responden**
```typescript
// Asegurarse de usar siempre useAppTheme hook
const { theme } = useAppTheme();
// NO hacer: const isDark = useColorScheme() === 'dark';
```

---

## 📊 Estadísticas del Sistema

- **Colores Disponibles:** 50+ (primarios + semánticos)
- **Variantes Primary:** 10 tonos
- **Espaciamientos:** 9 valores
- **Bordes:** 5 estilos
- **Sombras:** 4 niveles
- **Tipografía:** 4 pesos

---

## ✨ Características Destacadas

- ✅ **Cambio de Tema Instantáneo**
  - Modo Claro
  - Modo Oscuro
  - Modo Sistema (automático)

- ✅ **Persistencia Automática**
  - Se guarda en AsyncStorage
  - Se restaura al iniciar app
  - Sin flash visual

- ✅ **Componentes Reactivos**
  - Todo UI responde dinámicamente
  - Sin necesidad de recargar

- ✅ **Design System Completo**
  - Colores escalables
  - Espaciamiento consistente
  - Tipografía unificada
  - Sombras profundas

- ✅ **Performance Optimizado**
  - useMemo en lugares estratégicos
  - useCallback para callbacks
  - Dependencies correctas
  - Sin re-renders innecesarios

---

## 🚀 Próximos Pasos

1. **Integrar API de Carousel**
   ```typescript
   // Reemplazar carouselItems mock con datos del backend
   const { data: banners } = useBannersQuery();
   ```

2. **Agregar Transiciones**
   ```typescript
   // Usar react-native-reanimated para animaciones suaves
   ```

3. **Personalización Adicional**
   ```typescript
   // Permitir que usuarios cambien colores primarios
   ```

---

## 📖 Documentación Completa

Ver archivo: `THEME_REFACTOR_DOCUMENTATION.md`

---

**Última actualización:** 2026-06-03
**Estado:** 🟢 Listo para producción
