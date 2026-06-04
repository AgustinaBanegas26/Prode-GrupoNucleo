# 🚩 Implementación de Banderas - Prode Mundial 2026

## ✅ ESTADO: COMPLETO

Todas las banderas de países están implementadas como emojis Unicode a lo largo de toda la aplicación móvil.

---

## 📍 Ubicación de la Función Principal

**Archivo:** `mobile/src/theme/theme.ts`

```typescript
export function getFlagEmoji(teamCode: string): string {
  return FLAG_EMOJIS[teamCode?.toUpperCase()] ?? FLAG_EMOJIS.DEFAULT;
}
```

### Países Soportados (48 equipos del Mundial 2026)

```typescript
export const FLAG_EMOJIS: Record<string, string> = {
  ARG: '🇦🇷', BRA: '🇧🇷', FRA: '🇫🇷', GER: '🇩🇪', DEU: '🇩🇪',
  ESP: '🇪🇸', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', POR: '🇵🇹', NED: '🇳🇱', URU: '🇺🇾',
  USA: '🇺🇸', MEX: '🇲🇽', CAN: '🇨🇦', QAT: '🇶🇦', ECU: '🇪🇨',
  SEN: '🇸🇳', MAR: '🇲🇦', RSA: '🇿🇦', KOR: '🇰🇷', CZE: '🇨🇿',
  BIH: '🇧🇦', SUI: '🇨🇭', HAI: '🇭🇹', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', AUS: '🇦🇺',
  TUR: '🇹🇷', CUW: '🇨🇼', JPN: '🇯🇵', CIV: '🇨🇮', SWE: '🇸🇪',
  TUN: '🇹🇳', BEL: '🇧🇪', EGY: '🇪🇬', KSA: '🇸🇦', IRN: '🇮🇷',
  NZL: '🇳🇿', CPV: '🇨🇻', IRQ: '🇮🇶', NOR: '🇳🇴', ALG: '🇩🇿',
  AUT: '🇦🇹', JOR: '🇯🇴', CGO: '🇨🇬', CRO: '🇭🇷', GHA: '🇬🇭',
  PAN: '🇵🇦', UZB: '🇺🇿', COL: '🇨🇴', PAR: '🇵🇾', ITA: '🇮🇹',
  DEFAULT: '🏳️',
};
```

---

## 📱 Pantallas Implementadas

### ✅ 1. Home / Inicio (`index.tsx`)
- **Sección:** Próximos Partidos
- **Ubicación:** Card de cada partido
- **Implementación:**
  ```tsx
  <Text style={upS.flag}>{getFlagEmoji(match.homeCode)}</Text>
  <Text style={upS.flag}>{getFlagEmoji(match.awayCode)}</Text>
  ```
- **Tamaño emoji:** 36px

---

### ✅ 2. Pronósticos (`pronosticos.tsx`)
- **Sección:** Cards de predicción
- **Ubicación:** Dentro de cada MatchCard (pendientes y completados)
- **Implementación:**
  ```tsx
  <Text style={card.flagEmoji}>{getFlagEmoji(homeCode)}</Text>
  <Text style={card.flagEmoji}>{getFlagEmoji(awayCode)}</Text>
  ```
- **Tamaño emoji:** 40px
- **Diseño:** Banderas cuadradas redondeadas dentro de un `flagBox` gris

---

### ✅ 3. Fixture (`fixture.tsx`)
- **Sección:** Lista completa de partidos
- **Ubicación:** Dentro de cada MatchRow
- **Implementación:**
  ```tsx
  <Text style={styles.flagEmoji}>{getFlagEmoji(match.homeCode)}</Text>
  <Text style={styles.flagEmoji}>{getFlagEmoji(match.awayCode)}</Text>
  ```
- **Tamaño emoji:** 36px
- **Fallback:** Si existe logo de API (`match.homeLogo`), se muestra primero; sino, bandera emoji

---

### ✅ 4. Perfil (`perfil.tsx`)
- **Sección:** Próximo Partido (card destacada)
- **Ubicación:** Dentro de la tarjeta "Próximo Partido"
- **Implementación:**
  ```tsx
  <Text style={nmS.flag}>{getFlagEmoji(nextMatch.homeCode)}</Text>
  <Text style={nmS.flag}>{getFlagEmoji(nextMatch.awayCode)}</Text>
  ```
- **Tamaño emoji:** 28px

---

### ✅ 5. Detalle de Partido (`detalle-partido.tsx`)
- **Sección:** Header del partido
- **Ubicación:** Banderas grandes en la parte superior
- **Implementación:**
  ```tsx
  <Text style={styles.teamFlag}>{getFlagEmoji(match.homeCode)}</Text>
  <Text style={styles.teamFlag}>{getFlagEmoji(match.awayCode)}</Text>
  ```
- **Tamaño emoji:** 64px
- **Cambio realizado:** ❌ Antes mostraba `{match.homeCode}` → ✅ Ahora muestra emoji

---

### ✅ 6. Ranking / Posiciones (`posiciones.tsx`)
- **Estado:** No muestra banderas (solo ranking de usuarios)
- **Nota:** Esta pantalla lista usuarios, no partidos, por lo que no aplica

---

### ✅ 7. Componente SportMatchCard (`SportMatchCard.tsx`)
- **Uso:** Componente reutilizable para mostrar partidos
- **Implementación:**
  ```tsx
  const homeFlag = getFlagEmoji(homeCode);
  const awayFlag = getFlagEmoji(awayCode);
  
  <Text style={styles.flagEmoji}>{homeFlag}</Text>
  <Text style={styles.flagEmoji}>{awayFlag}</Text>
  ```
- **Tamaño emoji:** 28px

---

## 🔧 Componentes de Administración

### ⚠️ Admin: Gestión de Partidos (`MatchesManagementScreen.tsx`)
- **Estado:** Muestra bandera + código de país
- **Implementación:**
  ```tsx
  <Text style={styles.teamFlag}>{homeFlag}</Text>
  <Text style={styles.teamCode}>{item.homeCode || '---'}</Text>
  ```
- **Justificación:** En el panel de administración, mostrar el código ISO junto a la bandera ayuda a los administradores a identificar correctamente los equipos

---

## 🎨 Estilo Visual

### Tamaños de Banderas por Contexto:
- **Mini (28px):** Perfil, SportMatchCard, Admin
- **Estándar (36px):** Home, Fixture  
- **Mediano (40px):** Pronósticos (dentro de cajas redondeadas)
- **Grande (64px):** Detalle de partido

### Diseño Premium:
- Emojis centrados
- Espaciado consistente
- Sin bordes decorativos (el emoji es suficiente)
- Alineación perfecta con nombres de equipos

---

## 📊 Datos Fuente

### Mock Data (`mockData.ts`)
Todos los partidos del fixture tienen propiedades:
```typescript
homeCode: string;  // Ej: "ARG", "BRA", "MEX"
awayCode: string;  // Ej: "URU", "FRA", "ESP"
```

### API de Partidos
Los datos que vienen desde Supabase o API-Football también incluyen `homeCode` y `awayCode`, que se mapean automáticamente al `getFlagEmoji()`.

---

## ✅ Verificación de Implementación

### Checklist de Pantallas:
- [x] Home - Próximos Partidos
- [x] Pronósticos - Pendientes
- [x] Pronósticos - Completados
- [x] Fixture - Todos los grupos (A-L)
- [x] Fixture - Todas las fases
- [x] Perfil - Próximo Partido
- [x] Detalle de Partido - Header
- [x] SportMatchCard - Componente reutilizable
- [x] Admin - Gestión de Partidos (con código ISO)

### Importación Correcta en Todos los Archivos:
```typescript
import { getFlagEmoji } from '../../src/theme/theme';
// o la ruta relativa correspondiente
```

---

## 🚀 Cómo Usar en Nuevos Componentes

Si necesitas agregar banderas en un componente nuevo:

```typescript
// 1. Importar la función
import { getFlagEmoji } from '@/theme/theme';

// 2. Usar en el componente
const MyMatchComponent = ({ homeCode, awayCode }) => {
  return (
    <View>
      <Text style={{ fontSize: 32 }}>
        {getFlagEmoji(homeCode)}
      </Text>
      <Text style={{ fontSize: 32 }}>
        {getFlagEmoji(awayCode)}
      </Text>
    </View>
  );
};
```

---

## 🛠️ Solución de Problemas

### ❌ Problema: "No se ven las banderas, solo cuadrados"
**Causa:** El dispositivo no soporta emojis Unicode o la fuente del sistema no incluye los flag emojis.

**Solución:**
1. Verificar que el dispositivo tiene iOS 9+ o Android 5.0+
2. Actualizar el sistema operativo
3. Los emuladores antiguos pueden no soportar emojis — probar en dispositivo real

### ❌ Problema: "Se muestra 🏳️ en vez de la bandera correcta"
**Causa:** El código ISO del país no está en el diccionario `FLAG_EMOJIS`.

**Solución:**
1. Verificar que `homeCode` o `awayCode` esté en mayúsculas (la función hace `.toUpperCase()` automáticamente)
2. Agregar el código faltante al diccionario en `theme.ts`:
   ```typescript
   ITN: '🇮🇹',  // Ejemplo: Italia
   ```

### ❌ Problema: "La bandera se ve muy pequeña/grande"
**Solución:**
Ajustar el `fontSize` en el estilo:
```typescript
flagEmoji: {
  fontSize: 40,  // Ajustar según necesidad
}
```

---

## 📝 Notas Técnicas

1. **Unicode:** Los emojis de banderas están basados en el estándar Unicode Regional Indicator Symbols.

2. **Compatibilidad:** Funciona en todos los dispositivos modernos (iOS, Android, Web).

3. **Performance:** Los emojis Unicode no requieren assets externos ni carga adicional.

4. **Accesibilidad:** Los screen readers interpretan correctamente los emojis de banderas.

5. **Fallback:** Si el código del país no existe, se muestra `🏳️` (bandera blanca) como fallback.

---

## 🎯 Resultado Final

✅ **TODAS las pantallas de usuario** muestran banderas emoji en lugar de códigos ISO de texto.

✅ **Panel de administración** muestra banderas + código para facilitar gestión.

✅ **Diseño premium** consistente con la identidad visual del Mundial 2026.

✅ **48 equipos** del Mundial 2026 soportados completamente.

---

**Fecha de implementación:** 2025-01-XX  
**Desarrollador:** Kiro AI  
**Estado:** ✅ Producción
