# Tasks: Rediseño UI Premium — Prode del Mundial

## Task 1: Extender theme.ts con tokens premium
- [ ] 1.1 Agregar tokens de glassmorphism (glass light/dark/border/blur)
- [ ] 1.2 Agregar gradientes hero (heroOverlay, primaryFade, darkHero)
- [ ] 1.3 Agregar mapa de colores nacionales (NATIONAL_COLORS + FLAG_EMOJIS)
- [ ] 1.4 Agregar radius '2xl' y '3xl', sombras glow y float
- [ ] 1.5 Exportar nuevos tipos

## Task 2: Crear componente GlassHeader
- [ ] 2.1 Implementar GlassHeader con avatar circular + iniciales
- [ ] 2.2 Saludo dinámico según hora del día (getGreeting)
- [ ] 2.3 Mostrar posición del torneo debajo del nombre
- [ ] 2.4 Badge de notificaciones y botón menú a la derecha
- [ ] 2.5 Fondo glass semi-transparente

## Task 3: Crear componente HeroStatsBanner
- [ ] 3.1 Imagen de fondo con overlay oscuro (LinearGradient)
- [ ] 3.2 Overlay de stats: puntos, posición, variación, partidos restantes
- [ ] 3.3 Indicador de variación con flecha animada (fade+slide)
- [ ] 3.4 Fallback a gradiente si no hay imagen
- [ ] 3.5 Botón "Ver ranking"

## Task 4: Crear componente SportMatchCard
- [ ] 4.1 Layout horizontal equipo local / VS / equipo visitante con emojis bandera
- [ ] 4.2 Colores nacionales sutiles en fondo de cada mitad
- [ ] 4.3 Badge EN VIVO pulsante para partidos en curso
- [ ] 4.4 Mostrar pronóstico del usuario si existe
- [ ] 4.5 Press animation scale 0.97

## Task 5: Crear componente FloatingTabBar
- [ ] 5.1 Fondo glass flotante con sombra float
- [ ] 5.2 Border radius pill (28px), margin horizontal 16px
- [ ] 5.3 Indicador activo animado (punto/píldora) debajo del ícono
- [ ] 5.4 Animación spring en tab activa
- [ ] 5.5 Safe area bottom padding

## Task 6: Crear componente PremiumRankingCard
- [ ] 6.1 Avatar circular con iniciales
- [ ] 6.2 Indicador de variación (↑/↓) con color
- [ ] 6.3 Destacado visual del usuario actual (borde primario + glow)
- [ ] 6.4 Badge de estado opcional (SUBISTE, TOP 10, etc.)

## Task 7: Crear componente QuickRankingPodium
- [ ] 7.1 Layout podio 🥇🥈🥉 con el primero más alto
- [ ] 7.2 Avatar con iniciales para cada posición
- [ ] 7.3 Nombre y puntos visibles
- [ ] 7.4 Destacar usuario actual

## Task 8: Crear componente BadgeIndicator
- [ ] 8.1 Implementar los 5 tipos de badge (SUBISTE, BAJASTE, NUEVO_LIDER, TOP_10, RACHA)
- [ ] 8.2 Animación fade-in + scale al montar
- [ ] 8.3 Colores y íconos por tipo

## Task 9: Rediseñar Home Screen (index.tsx)
- [ ] 9.1 Reemplazar AppHeader por GlassHeader con datos del authStore + homePosition
- [ ] 9.2 Reemplazar ImageCarousel + tarjetas de posición por HeroStatsBanner
- [ ] 9.3 Reemplazar MatchCard por SportMatchCard en "Próximos Partidos"
- [ ] 9.4 Agregar sección QuickRankingPodium con top 3 del rankingData
- [ ] 9.5 Aumentar espaciado entre secciones a 24px, padding bottom 100px

## Task 10: Rediseñar Posiciones Screen (posiciones.tsx)
- [ ] 10.1 Agregar GlassHeader
- [ ] 10.2 Reemplazar RankingCard por PremiumRankingCard con animación stagger
- [ ] 10.3 Mejorar tabs General/Semanal con diseño pill

## Task 11: Actualizar FloatingTabBar en el layout
- [ ] 11.1 Reemplazar BottomTabBar por FloatingTabBar en app/(app)/_layout.tsx
- [ ] 11.2 Ajustar tabBarStyle para soportar tab flotante
