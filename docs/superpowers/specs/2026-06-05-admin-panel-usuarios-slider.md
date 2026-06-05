# Spec — Admin Panel (Usuarios + Slider) / Limpieza de módulos (Novedades + Partidos)

## Objetivo

1) Eliminar completamente del admin panel:
- **Novedades** (ruta, pantalla, menú, imports, referencias).
- **Partidos** (ruta, pantalla, menú, imports, referencias).

2) Dejar **Usuarios** 100% funcional, conectado a Supabase, con actualización **en tiempo real** y feedback UI.

3) Dejar **Slider** 100% funcional, conectado a Supabase (DB + Storage), con actualización **en tiempo real** y feedback UI.

4) Mantener estética actual (celeste/blanco estilo mundialista argentino), sin romper funcionalidades existentes.

## Alcance

### Admin panel (mobile/app/(admin))
- Se modifica navegación (stack + dashboard menú).
- Se eliminan pantallas y rutas de News/Matches.
- Se refuerza Users:
  - CRUD en `public.clientes` (Supabase).
  - realtime incremental (sin recargar).
  - bloqueo/desbloqueo refleja en app y corta sesión si corresponde.
- Slider:
  - se mantiene implementación existente basada en `public.slider_slides` + Storage bucket `slider`.

### App cliente (mobile/app/(app))
- Home ya consume slider desde `useSliderSlides()` + `useSliderRealtime()`; debe seguir funcionando.
- Acceso de usuario bloqueado: se agrega vigilancia realtime del registro del usuario logueado para logout forzado cuando `habilitado=false`.

## Fuente de verdad / Modelos

### Usuarios (clientes)
- Tabla Supabase: `public.clientes`
- Campos usados actualmente por la app:
  - `id` (bigint/uuid según instancia; UI lo maneja como string)
  - `cliente_id` → `AppUser.clienteId`
  - `nombre`
  - `email` (opcional)
  - `habilitado` → `AppUser.activo`
  - `primer_login`
  - `ultimo_acceso`
  - `must_change_password` (ya existe en migrations, usado por auth)

**No se agregan columnas nuevas** (ej: avatar/rol para clientes) en este cambio.

### Admin (roles)
- Admin panel está restringido por `AuthProvider` con `SessionUser.role === 'admin'`.
- Admins viven en tabla `public.admins` (login legacy + opcional JWT backend).

### Slider
- Tabla: `public.slider_slides`
- Storage bucket: `slider`
- Realtime: publicación `supabase_realtime` incluye `slider_slides` (según migration 002_slider.sql).

## Diseño técnico

### A) Eliminación completa de Novedades y Partidos (admin)

Cambios:
- `mobile/src/features/admin/screens/AdminDashboardScreen.tsx`
  - Remover opciones del menú:
    - Partidos (`route: /(admin)/matches`)
    - Novedades (`route: /(admin)/news`)
- `mobile/app/(admin)/_layout.tsx`
  - Remover `<Stack.Screen name="matches" />`
  - Remover `<Stack.Screen name="news" />`
- Eliminar rutas:
  - `mobile/app/(admin)/matches.tsx`
  - `mobile/app/(admin)/news.tsx`
- Eliminar pantallas:
  - `mobile/src/features/admin/screens/MatchesManagementScreen.tsx`
  - `mobile/src/features/admin/screens/NewsManagementScreen.tsx`
- Validar que no queden referencias:
  - imports rotos
  - rutas huérfanas
  - strings “MatchesManagementScreen”, “NewsManagementScreen”, “/(admin)/matches”, “/(admin)/news”

### B) Usuarios — realtime + operaciones completas

Estado actual:
- UI admin: `UsersManagementScreen.tsx` usa `useUsersStore`.
- Store: `useUsersStore` hace `refresh()` después de cada operación (re-fetch).
- DB: `usersDb.ts` opera directo contra Supabase `clientes`.
- Login:
  - client login rechaza si `clientes.habilitado=false`.
  - admin login rechaza si `admins.habilitado=false`.

Objetivo del cambio:
- **Lista se actualiza en tiempo real sin recargar** y sin re-fetch completo.
- **Feedback visual** consistente (loading / éxito / error) por operación.
- **Bloqueo**: usuario bloqueado no puede acceder; si estaba logueado, se fuerza logout.

Implementación propuesta:

1) **Realtime incremental (clientes → usersStore)**
   - Crear suscripción `supabase.channel('clientes-realtime')` a `postgres_changes` sobre `public.clientes`.
   - En cada evento:
     - INSERT / UPDATE: mapear row → `AppUser` (misma lógica de `mapRowToUser`) y `upsertLocal`.
     - DELETE: `removeLocal` por id.
   - El store debe mantener orden estable (por `createdAt` desc como hoy o el orden actual del admin).

2) **Store: separar “operaciones remotas” de “actualización local”**
   - Agregar al store métodos puros:
     - `upsertLocal(user: AppUser)`
     - `removeLocal(userId: string)`
     - `setLocalActivo(userId: string, activo: boolean)` (opcional; puede venir por realtime)
   - Mantener `refresh()` para fallback/manual.
   - En operaciones remotas (`upsert/remove/setActivo/resetPassword`):
     - No hacer `refresh()` obligatorio.
     - Confiar en realtime para reflejar cambios.
     - Fallback: si el proyecto corre sin realtime en algún entorno, invalidar vía `refresh()` como backup (controlado por flag o try/catch).

3) **Feedback UI**
   - En `UsersManagementScreen.tsx`:
     - Loading global de “cargando usuarios” usando `isLoading` del store (ya existe).
     - Loading por acción:
       - en modal: `guardando...`
       - por fila: al bloquear/eliminar/resetear mostrar estado “procesando” y deshabilitar botones.
     - Error: `Alert.alert(...)` ya existe; se mantiene pero se asegura consistencia.

4) **Bloqueo y corte de sesión**
   - En `AuthProvider.tsx`:
     - Al restaurar sesión y/o al estar logueado, suscribirse al registro del usuario:
       - Si role === 'client': escuchar `clientes` por `id`.
       - Si role === 'admin': escuchar `admins` por `id`.
     - Si llega update con `habilitado=false`:
       - ejecutar `logout()` y redirigir a login con mensaje.
   - Esto cubre el caso “bloquear en admin → cliente ya logueado”.

### C) Slider — mantener + pulir feedback

Estado actual:
- Admin: `SliderManagementScreen.tsx` usa hooks `useSliderSlides/useSliderRealtime/useUpsertSliderSlide/useDeleteSliderSlide/useReorderSliderSlides`.
- Cliente: Home usa `useSliderSlides/useSliderRealtime` y filtra `active`.

Objetivo:
- Confirmar que:
  - sube a Storage y persiste row en `slider_slides`.
  - elimina row y borra archivo best-effort.
  - reorden persiste `sort_order`.
  - activar/desactivar refleja en cliente.
  - feedback visual (loading / error) existe en cada operación.

Cambios:
- Solo ajustes mínimos si se detecta:
  - falta de loading en alguna acción (ej: reorder)
  - inconsistencia estética con headers/botones

## Lista de archivos a tocar

### Eliminaciones (admin)
- `mobile/app/(admin)/matches.tsx` (ELIMINAR)
- `mobile/app/(admin)/news.tsx` (ELIMINAR)
- `mobile/src/features/admin/screens/MatchesManagementScreen.tsx` (ELIMINAR)
- `mobile/src/features/admin/screens/NewsManagementScreen.tsx` (ELIMINAR)

### Modificaciones
- `mobile/app/(admin)/_layout.tsx` (remover screens matches/news)
- `mobile/src/features/admin/screens/AdminDashboardScreen.tsx` (remover cards menú matches/news)
- `mobile/src/features/users/store/usersStore.ts` (realtime incremental + separar refresh)
- `mobile/src/features/users/services/usersDb.ts` (reusar mapeo; sin cambios de comportamiento salvo que se requiera)
- `mobile/src/providers/AuthProvider.tsx` (watch realtime habilitado y logout forzado)

### Sin cambios (salvo ajustes mínimos)
- `mobile/src/features/admin/screens/UsersManagementScreen.tsx`
- `mobile/src/features/admin/screens/SliderManagementScreen.tsx`
- `mobile/src/features/content/api/sliderSlides.ts`

## Criterios de aceptación (verificables)

1) En admin panel:
- No existe “Novedades” ni “Partidos” en menú, rutas, ni pantallas.
- No hay imports rotos ni rutas huérfanas.

2) Usuarios:
- Crear/editar/eliminar/bloquear/desbloquear se refleja en Supabase y en el admin **sin recargar**.
- El cliente bloqueado **no puede** iniciar sesión.
- Si el cliente estaba logueado y se lo bloquea, la app lo desloguea.
- Cada operación muestra loading y error/success visible.

3) Slider:
- Alta/baja/reorden/activar-desactivar persiste en Supabase y se refleja en Home en tiempo real.
- Feedback visual en cada operación.

4) No se rompe nada existente:
- Admin sigue accesible solo para role admin.
- App cliente sigue funcionando.

