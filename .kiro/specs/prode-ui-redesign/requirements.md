# Documento de Requisitos: Rediseño Completo de UI — Prode del Mundial

## Introducción

Este documento especifica los requisitos funcionales y de interfaz para el rediseño completo de la UI de la aplicación móvil de Prode del Mundial, construida con React Native y Expo Router. El rediseño transforma la interfaz existente en una experiencia visual premium con glassmorphism, animaciones fluidas, jerarquía tipográfica fuerte y un sistema de diseño deportivo moderno (comparable a Sofascore, OneFootball o FIFA+). Se mantiene toda la lógica de negocio y los stores de datos existentes; únicamente se reemplazan los componentes visuales y los tokens de diseño.

## Glosario

- **Design_System**: El conjunto de tokens de diseño extendido en `theme.ts` que incluye colores, tipografía, espaciado, radios, sombras y valores de glassmorphism.
- **GlassHeader**: Componente de cabecera premium con efecto glassmorphism que reemplaza al `AppHeader` existente.
- **HeroStatsBanner**: Componente hero de la pantalla Home que muestra imagen de fondo del Mundial y estadísticas superpuestas del usuario.
- **PremiumStatsCard**: Tarjeta de estadísticas individuales del usuario con glassmorphism.
- **SportMatchCard**: Tarjeta de partido deportiva que muestra equipos, colores nacionales y pronóstico del usuario.
- **QuickRankingPodium**: Componente del podio Top 3 competitivo para la pantalla Home.
- **BadgeIndicator**: Indicador visual de logros o eventos del usuario (SUBISTE, BAJASTE, NUEVO LÍDER, TOP 10, RACHA).
- **FloatingTabBar**: Barra de navegación inferior flotante con efecto glass y bordes redondeados.
- **PremiumRankingCard**: Fila de ranking premium con avatar, indicador de variación y resaltado del usuario actual.
- **Theme**: Objeto de tema que encapsula tokens de diseño para los modos Light y Dark.
- **ThemeProvider**: Proveedor de contexto que distribuye el `Theme` a todos los componentes.
- **NationalColor**: Par de colores `{ primary, bg }` asociado al código ISO de un equipo nacional.
- **BadgeType**: Enumeración de tipos de badge: `SUBISTE`, `BAJASTE`, `NUEVO_LIDER`, `TOP_10`, `RACHA`.
- **AnimatedValue**: Instancia de `Animated.Value` de la API Animated de React Native.
- **StaggeredAnimation**: Secuencia de animaciones de entrada con delay incremental por elemento.
- **PressAnimation**: Micro-animación de escala al presionar un elemento táctil.
- **GlassEffect**: Efecto visual de fondo semitransparente con blur (BlurView) o fallback sólido.
- **HomeScreen**: Pantalla principal `app/(app)/index.tsx`.
- **FixtureScreen**: Pantalla de fixture `app/(app)/fixture.tsx`.
- **PosicionesScreen**: Pantalla de ranking `app/(app)/posiciones.tsx`.
- **PronosticosScreen**: Pantalla de pronósticos `app/(app)/pronosticos.tsx`.
- **PerfilScreen**: Pantalla de perfil `app/(app)/perfil.tsx`.
- **LoginScreen**: Pantalla de autenticación `app/(auth)/login.tsx`.
- **DetallePartidoScreen**: Pantalla de detalle de partido `app/(app)/details/detalle-partido.tsx`.

## Requisitos

### Requisito 1: Sistema de Tokens de Diseño Extendido

**User Story:** Como desarrollador, quiero un sistema de tokens de diseño extendido en `theme.ts`, para que todos los componentes premium usen valores consistentes sin colores hardcodeados.

#### Criterios de Aceptación

1. THE Design_System SHALL exponer tokens de glassmorphism con valores `glass.light` (`rgba(255,255,255,0.72)`), `glass.dark` (`rgba(30,30,30,0.72)`), `glass.border` (`rgba(255,255,255,0.18)`) y `glass.blur` (`20`).
2. THE Design_System SHALL exponer tokens de gradientes: `heroOverlay`, `primaryFade`, `rankBadge` y `darkHero` como arrays de colores compatibles con `expo-linear-gradient`.
3. THE Design_System SHALL exponer un mapa `national` con al menos los códigos ARG, BRA, FRA, DEU, ESP, ENG y POR, donde cada entrada contenga `primary` y `bg` con opacidad de `bg` ≤ 0.15.
4. THE Design_System SHALL exponer tokens de radio extendido: `radius['2xl']` igual a `24` y `radius['3xl']` igual a `32`.
5. THE Design_System SHALL exponer tokens de sombra premium: `shadows.glow` con `shadowColor` `#CC2627` y `shadows.float` con `shadowColor` `#000`.
6. WHEN un componente rediseñado se renderiza en modo Light, THE ThemeProvider SHALL proveer tokens de modo Light a ese componente.
7. WHEN un componente rediseñado se renderiza en modo Dark, THE ThemeProvider SHALL proveer tokens de modo Dark a ese componente.
8. IF un componente accede a un token no definido en el Design_System, THEN THE Design_System SHALL retornar el token de fallback correspondiente sin lanzar errores.

### Requisito 2: Componente GlassHeader

**User Story:** Como usuario autenticado, quiero ver un encabezado premium que me muestre mi nombre, saludo dinámico y mi posición en el torneo, para que sienta que la app es moderna y personalizada.

#### Criterios de Aceptación

1. WHEN la hora local está entre las 6:00 y las 11:59, THE GlassHeader SHALL mostrar el saludo "Buenos días".
2. WHEN la hora local está entre las 12:00 y las 19:59, THE GlassHeader SHALL mostrar el saludo "Buenas tardes".
3. WHEN la hora local es igual o mayor a las 20:00 o menor a las 6:00, THE GlassHeader SHALL mostrar el saludo "Buenas noches".
4. THE GlassHeader SHALL mostrar un avatar circular con las iniciales del usuario y un borde de color primario `#CC2627`.
5. WHEN `hasUnreadNotifications` es `true`, THE GlassHeader SHALL mostrar un badge rojo sobre el ícono de notificaciones.
6. WHEN `hasUnreadNotifications` es `false`, THE GlassHeader SHALL ocultar el badge de notificaciones.
7. THE GlassHeader SHALL mostrar la posición del usuario en el torneo con el formato "#N del torneo".
8. WHEN el GlassHeader se renderiza con soporte de BlurView, THE GlassHeader SHALL aplicar un fondo glass con blur de intensidad 20.
9. IF BlurView no está disponible en la plataforma, THEN THE GlassHeader SHALL aplicar un fondo sólido semitransparente (`rgba(255,255,255,0.92)` en Light / `rgba(20,20,20,0.94)` en Dark) como fallback.
10. THE GlassHeader SHALL tener una altura total de 72px más el safe area superior.

### Requisito 3: Componente HeroStatsBanner

**User Story:** Como usuario, quiero ver mis estadísticas del torneo (posición, puntos, variación) sobre una imagen hero del Mundial, para que la pantalla principal transmita emoción y competencia de forma inmediata.

#### Criterios de Aceptación

1. THE HeroStatsBanner SHALL tener una altura fija de 220px con border-radius de 24px.
2. WHEN `backgroundImageUrl` es una URL válida y cargable, THE HeroStatsBanner SHALL mostrar esa imagen como fondo.
3. IF `backgroundImageUrl` es `undefined`, vacío o la URL falla al cargar, THEN THE HeroStatsBanner SHALL activar un fondo de gradiente de fallback de `#1a0a0a` a `#CC2627`.
4. THE HeroStatsBanner SHALL superponer un gradiente de overlay de `rgba(0,0,0,0)` a `rgba(0,0,0,0.75)` de arriba a abajo sobre la imagen de fondo.
5. THE HeroStatsBanner SHALL mostrar los puntos del usuario, su posición en el ranking y el nombre del torneo.
6. WHEN `variationDirection` es `'up'`, THE HeroStatsBanner SHALL mostrar una flecha ↑ en color verde con el valor de variación.
7. WHEN `variationDirection` es `'down'`, THE HeroStatsBanner SHALL mostrar una flecha ↓ en color rojo con el valor de variación.
8. WHEN el HeroStatsBanner se monta, THE HeroStatsBanner SHALL ejecutar una animación de entrada fade+slide de 600ms de duración en el indicador de variación usando `useNativeDriver: true`.
9. THE HeroStatsBanner SHALL mostrar la cantidad de partidos restantes del torneo.
10. WHEN el usuario presiona el botón "Ver ranking", THE HeroStatsBanner SHALL invocar el callback `onViewRankingPress`.

### Requisito 4: Componente SportMatchCard

**User Story:** Como usuario, quiero ver los partidos del fixture con los colores de cada selección nacional y mi pronóstico integrado, para identificar rápidamente los equipos y el estado de mis predicciones.

#### Criterios de Aceptación

1. THE SportMatchCard SHALL mostrar el nombre, código ISO y emoji de bandera del equipo local y del visitante.
2. THE SportMatchCard SHALL aplicar el color nacional sutil (`NationalColor.bg`) como fondo en la mitad correspondiente de la tarjeta para cada equipo.
3. WHEN `matchStatus` es `'live'`, THE SportMatchCard SHALL mostrar un badge "EN VIVO" con animación pulsante.
4. WHEN `matchStatus` es `'upcoming'` o `'finished'`, THE SportMatchCard SHALL ocultar el badge "EN VIVO".
5. WHEN `userPrediction` está definido, THE SportMatchCard SHALL mostrar el pronóstico del usuario en la tarjeta.
6. WHEN el usuario presiona la SportMatchCard, THE SportMatchCard SHALL ejecutar una animación de escala de `1.0` a `0.97` en 150ms usando `useNativeDriver: true` y luego volver a `1.0`.
7. THE SportMatchCard SHALL mostrar la fecha, hora, grupo y fase del partido.
8. IF el código de equipo no está en el mapa `NATIONAL_COLORS`, THEN THE SportMatchCard SHALL aplicar el color `DEFAULT` (`rgba(92,92,92,0.10)`) como fondo de esa mitad.

### Requisito 5: Componente FloatingTabBar

**User Story:** Como usuario, quiero una barra de navegación inferior flotante con estilo glass y animaciones de tab, para que la navegación se sienta moderna y fluida.

#### Criterios de Aceptación

1. THE FloatingTabBar SHALL tener un border-radius de 28px (forma pill), altura de 64px más el safe area inferior, y un margen horizontal de 16px y posición 20px desde el borde inferior.
2. WHEN el tema es Light, THE FloatingTabBar SHALL aplicar un fondo glass de `rgba(255,255,255,0.85)` con blur de intensidad 20.
3. WHEN el tema es Dark, THE FloatingTabBar SHALL aplicar un fondo glass de `rgba(20,20,20,0.90)` con blur de intensidad 20.
4. IF BlurView no está disponible en la plataforma, THEN THE FloatingTabBar SHALL aplicar el color de fondo sólido semitransparente correspondiente al tema activo como fallback.
5. THE FloatingTabBar SHALL mostrar los tabs: Inicio, Fixture, Ranking, Pronósticos y Perfil con sus respectivos íconos Feather.
6. WHEN el usuario selecciona un tab, THE FloatingTabBar SHALL ejecutar una animación spring de escala `1.0 → 1.12 → 1.0` en 200ms sobre el ícono del tab usando `useNativeDriver: true`.
7. THE FloatingTabBar SHALL mostrar un indicador (píldora) animado debajo del ícono activo con color primario `#CC2627`.
8. THE FloatingTabBar SHALL tener un borde superior de `rgba(255,255,255,0.3)` en modo Light y `rgba(255,255,255,0.08)` en modo Dark.

### Requisito 6: Componente BadgeIndicator

**User Story:** Como usuario, quiero ver badges visuales animados que indiquen mis logros (SUBISTE, BAJASTE, NUEVO LÍDER, TOP 10, RACHA), para reconocer rápidamente mi progreso en el torneo.

#### Criterios de Aceptación

1. THE BadgeIndicator SHALL soportar los tipos `SUBISTE`, `BAJASTE`, `NUEVO_LIDER`, `TOP_10` y `RACHA`, cada uno con su etiqueta, color e ícono específicos según `BADGE_CONFIG`.
2. WHEN `animated` es `true` y el BadgeIndicator se monta, THE BadgeIndicator SHALL ejecutar una animación de entrada fade-in con escala de `0.8 → 1.04 → 1.0` usando `useNativeDriver: true`.
3. WHEN `animated` es `false`, THE BadgeIndicator SHALL renderizarse sin animación de entrada.
4. THE BadgeIndicator SHALL mostrar el color de fondo correspondiente al tipo de badge: verde para SUBISTE, rojo para BAJASTE, amarillo para NUEVO_LIDER, primario para TOP_10 y naranja para RACHA.

### Requisito 7: Componente PremiumRankingCard

**User Story:** Como usuario, quiero ver el ranking con tarjetas que muestren avatar, puntos, variación de posición y un resaltado especial para mi fila, para identificar mi posición y progreso de un vistazo.

#### Criterios de Aceptación

1. THE PremiumRankingCard SHALL mostrar el número de posición, las iniciales del usuario en un avatar circular, el nombre del usuario y sus puntos.
2. WHEN `item.isCurrent` es `true`, THE PremiumRankingCard SHALL aplicar un borde de 2px con color `#CC2627` y un fondo de `rgba(204,38,39,0.06)` en modo Light o `rgba(204,38,39,0.10)` en modo Dark.
3. WHEN `item.isCurrent` es `true`, THE PremiumRankingCard SHALL aplicar una sombra glow de color `#CC2627`.
4. WHEN `item.variationDirection` es `'up'`, THE PremiumRankingCard SHALL mostrar el valor de variación con color verde y flecha ↑.
5. WHEN `item.variationDirection` es `'down'`, THE PremiumRankingCard SHALL mostrar el valor de variación con color rojo y flecha ↓.
6. WHEN `item.badge` está definido, THE PremiumRankingCard SHALL renderizar un `BadgeIndicator` del tipo correspondiente.

### Requisito 8: Animaciones y Micro-interacciones

**User Story:** Como usuario, quiero que la app tenga animaciones fluidas y responsivas en todas las interacciones táctiles y transiciones, para que la experiencia se sienta premium y de alto rendimiento.

#### Criterios de Aceptación

1. THE Design_System SHALL proveer una configuración de animación `AnimationConfig` con duraciones fast (150ms), normal (250ms), slow (350ms) y hero (600ms).
2. WHEN `useStaggeredAnimation(n, d)` es invocado, THE Design_System SHALL retornar un array de exactamente `n` instancias de `AnimatedValue`, donde el elemento en índice `i` recibe un delay de `i × d` milisegundos.
3. WHEN el hook `useStaggeredAnimation` se desmonta, THE Design_System SHALL detener y limpiar todas las animaciones activas.
4. WHEN `usePressAnimation` recibe `onPressIn`, THE Design_System SHALL animar la escala del elemento de `1.0` a `scaleTarget` en 150ms con spring.
5. WHEN `usePressAnimation` recibe `onPressOut`, THE Design_System SHALL animar la escala del elemento de `scaleTarget` a `1.0` exactamente, usando spring con `damping: 15` y `stiffness: 300`.
6. THE Design_System SHALL garantizar que todas las animaciones de transform y opacity usen `useNativeDriver: true`.
7. IF una animación intenta modificar una propiedad que no sea `transform` o `opacity` con `useNativeDriver: true`, THEN THE Design_System SHALL no usar `useNativeDriver: true` para esa animación específica.

### Requisito 9: Resolución de Colores Nacionales

**User Story:** Como desarrollador, quiero una función total y robusta de resolución de colores nacionales por código ISO, para que nunca haya errores de runtime cuando se recibe un código de equipo desconocido.

#### Criterios de Aceptación

1. WHEN `getNationalColor` recibe un código de equipo conocido (ARG, BRA, FRA, DEU, ESP, ENG, POR, ITA, NED, URU), THE Design_System SHALL retornar los colores específicos de ese equipo.
2. WHEN `getNationalColor` recibe un código de equipo desconocido o una cadena vacía, THE Design_System SHALL retornar los colores `DEFAULT` (`{ primary: '#5C5C5C', bg: 'rgba(92,92,92,0.10)' }`).
3. THE Design_System SHALL normalizar el código de entrada a mayúsculas antes de hacer la búsqueda, de forma que `'arg'`, `'Arg'` y `'ARG'` produzcan el mismo resultado.
4. THE Design_System SHALL garantizar que `getNationalColor` nunca lanza una excepción para ningún valor de entrada string.
5. THE Design_System SHALL garantizar que el valor de opacidad en `NationalColor.bg` sea siempre menor o igual a `0.15` para todos los equipos definidos.

### Requisito 10: Pantalla Home Rediseñada

**User Story:** Como usuario, quiero ver una pantalla principal visualmente impactante con hero de estadísticas, próximos partidos y podio de ranking, para que la app me motive a participar activamente en el prode.

#### Criterios de Aceptación

1. THE HomeScreen SHALL renderizar en orden vertical: GlassHeader, HeroStatsBanner, sección "Próximos Partidos" con dos SportMatchCards, QuickRankingPodium, sección de accesos rápidos y padding inferior de 100px.
2. THE HomeScreen SHALL aplicar un espaciado de 24px entre secciones.
3. THE QuickRankingPodium SHALL mostrar el Top 3 de participantes en formato de podio con posiciones 1, 2 y 3 visualmente diferenciadas.
4. WHEN la HomeScreen se renderiza, THE QuickRankingPodium SHALL ejecutar una animación escalonada de entrada con delay de 50ms entre cada elemento del podio.
5. WHEN el usuario presiona "Ver todos" en el podio, THE HomeScreen SHALL navegar a la PosicionesScreen.

### Requisito 11: Pantalla Fixture Rediseñada

**User Story:** Como usuario, quiero navegar por el fixture con tabs de fase visuales y tarjetas deportivas agrupadas por fecha, para encontrar los partidos de forma rápida e intuitiva.

#### Criterios de Aceptación

1. THE FixtureScreen SHALL mostrar un selector horizontal de tabs de fase con forma pill y border-radius de 20px.
2. WHEN un tab de fase está activo, THE FixtureScreen SHALL aplicar fondo `#CC2627`, texto blanco y sombra roja sutil a ese tab.
3. THE FixtureScreen SHALL agrupar las SportMatchCards por fecha, con un separador visual que muestre el texto de fecha centrado entre líneas.
4. THE FixtureScreen SHALL mostrar un título "Fixture" con tamaño 28px y fontWeight 800.

### Requisito 12: Pantalla Posiciones Rediseñada

**User Story:** Como usuario, quiero ver el ranking con una lista estilizada que resalte mi posición y muestre animaciones de entrada, para vivir la competencia del prode de forma emocionante.

#### Criterios de Aceptación

1. THE PosicionesScreen SHALL mostrar tabs "General" y "Semanal" para filtrar el ranking.
2. THE PosicionesScreen SHALL mostrar una cabecera de tabla con las columnas: posición, usuario, puntos, partidos jugados y diferencia.
3. WHEN la PosicionesScreen se renderiza, THE PosicionesScreen SHALL ejecutar una animación de entrada escalonada (stagger) con delay de 50ms entre cada PremiumRankingCard, entrando desde abajo.
4. THE PosicionesScreen SHALL mantener la fila del usuario actual visible (sticky) cuando ésta quede fuera de la vista del scroll.

### Requisito 13: Pantalla Pronósticos Rediseñada

**User Story:** Como usuario, quiero ver mis pronósticos organizados por estado con badges visuales claros, para gestionar fácilmente mis predicciones pendientes y guardadas.

#### Criterios de Aceptación

1. THE PronosticosScreen SHALL mostrar tabs "Pendientes", "Guardados" y "Todos" para filtrar los pronósticos.
2. THE PronosticosScreen SHALL mostrar un badge contador de pronósticos pendientes junto al título.
3. THE PronosticosScreen SHALL mostrar cada pronóstico con emojis de bandera de los equipos, un badge de estado y el resultado con tipografía grande.
4. WHEN un pronóstico tiene estado "Pendiente", THE PronosticosScreen SHALL mostrar el badge de estado en color naranja.
5. WHEN un pronóstico tiene estado "Guardado", THE PronosticosScreen SHALL mostrar el badge de estado en color verde.
6. WHEN un pronóstico tiene estado "Finalizado", THE PronosticosScreen SHALL mostrar el badge de estado en color gris.

### Requisito 14: Pantalla Perfil Rediseñada

**User Story:** Como usuario, quiero ver mi perfil con un hero degradado, mi avatar prominente y mis estadísticas del torneo en un diseño premium, para que mi identidad en la app se sienta valorada.

#### Criterios de Aceptación

1. THE PerfilScreen SHALL mostrar un fondo hero degradado de color primario a background de 200px de altura.
2. THE PerfilScreen SHALL mostrar un avatar circular de 96px centrado con borde blanco de 3px y sombra.
3. THE PerfilScreen SHALL mostrar el nombre y número de empleado del usuario debajo del avatar.
4. THE PerfilScreen SHALL renderizar una PremiumStatsCard con 3 métricas del torneo en fila.
5. THE PerfilScreen SHALL mostrar un BadgeIndicator con el logro actual del usuario (TOP_10, RACHA, etc.) cuando esté disponible.
6. THE PerfilScreen SHALL mostrar un menú de opciones con íconos Feather y separadores suaves.
7. THE PerfilScreen SHALL mostrar un botón de cerrar sesión con ícono de logout.

### Requisito 15: Pantalla Login Rediseñada

**User Story:** Como usuario no autenticado, quiero ver una pantalla de login visualmente atractiva con animaciones de entrada suaves, para que la primera impresión de la app sea premium.

#### Criterios de Aceptación

1. THE LoginScreen SHALL mostrar un fondo oscuro con gradiente o imagen sutil de fútbol/mundial como textura.
2. THE LoginScreen SHALL mostrar un logo centrado de 120px.
3. THE LoginScreen SHALL mostrar un formulario dentro de una card con efecto glassmorphism suave.
4. THE LoginScreen SHALL mostrar inputs con border-radius de 16px y borde sutil.
5. THE LoginScreen SHALL mostrar un botón primario con fondo `#CC2627`, border-radius de 16px y sombra roja.
6. WHEN la LoginScreen se monta, THE LoginScreen SHALL ejecutar una animación de entrada slide-down de 350ms sobre el logo y una animación slide-up de 350ms sobre la card, ambas usando `useNativeDriver: true`.

### Requisito 16: Pantalla Detalle de Partido Rediseñada

**User Story:** Como usuario, quiero ver el detalle de un partido con los colores nacionales de ambos equipos, tabs de información y las opciones de pronóstico claramente presentadas, para registrar mi predicción de forma cómoda y visualmente agradable.

#### Criterios de Aceptación

1. THE DetallePartidoScreen SHALL mostrar un hero card con ambos equipos, sus emojis de bandera y un "VS" central.
2. THE DetallePartidoScreen SHALL aplicar el color nacional de fondo en cada mitad del hero card para cada equipo.
3. THE DetallePartidoScreen SHALL mostrar tabs "Pronóstico", "Estadísticas" y "H2H" con forma pill.
4. WHEN el tab "Pronóstico" está activo, THE DetallePartidoScreen SHALL mostrar 3 botones grandes para seleccionar el ganador (local, empate, visitante) con nombre y bandera de cada opción.
5. THE DetallePartidoScreen SHALL mostrar chips de resultado en grilla para seleccionar el marcador exacto.
6. THE DetallePartidoScreen SHALL mostrar chips toggle para detalles adicionales: Clasificado, Alargue y Penales.
7. THE DetallePartidoScreen SHALL mostrar un botón CTA "Guardar" de ancho completo con sombra roja en la parte inferior.

### Requisito 17: Soporte de Modo Oscuro y Accesibilidad

**User Story:** Como usuario, quiero que el rediseño respete mi preferencia de modo oscuro y cumpla estándares básicos de accesibilidad, para que la app sea usable en cualquier condición de luz y por usuarios con necesidades especiales.

#### Criterios de Aceptación

1. WHEN el sistema operativo tiene modo Dark activo, THE ThemeProvider SHALL proveer tokens de modo Dark a todos los componentes rediseñados.
2. THE Design_System SHALL garantizar que todos los textos principales tengan un contraste mínimo de 4.5:1 con su fondo correspondiente en ambos modos.
3. THE Design_System SHALL garantizar que todos los íconos interactivos tengan un `accessibilityLabel` descriptivo.
4. THE BadgeIndicator con tipo `NUEVO_LIDER`, `TOP_10` o `RACHA` SHALL tener `accessibilityRole="alert"` cuando se monte con `animated: true`.

### Requisito 18: Rendimiento y Dependencias

**User Story:** Como desarrollador, quiero que los nuevos componentes sean eficientes en memoria y ciclos de render, y que las nuevas dependencias sean mínimas y compatibles con el ecosistema Expo existente.

#### Criterios de Aceptación

1. THE Design_System SHALL garantizar que `SportMatchCard` y `PremiumRankingCard` estén envueltos con `React.memo` para evitar re-renders innecesarios en listas.
2. THE PosicionesScreen SHALL usar `FlatList` con `getItemLayout` definido para habilitar scroll virtualizado eficiente.
3. THE Design_System SHALL limitar el uso de `BlurView` a máximo 2 instancias simultáneas en pantalla (GlassHeader y FloatingTabBar), sin aplicarlo en tarjetas de lista.
4. THE Design_System SHALL utilizar `expo-linear-gradient` para todos los gradientes de la app.
5. THE Design_System SHALL utilizar `expo-blur` para todos los efectos glassmorphism.
6. THE Design_System SHALL garantizar que todas las animaciones de listas (stagger) sean detenidas y limpiadas en el cleanup de `useEffect` para evitar memory leaks.
