# Admin Panel (Usuarios + Slider) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar Novedades/Partidos del admin y dejar Usuarios/Slider 100% funcionales con Supabase realtime, manteniendo estética y sin romper lo existente.

**Architecture:** Mantener la arquitectura actual (Expo Router + Zustand + React Query + Supabase). Usuarios: agregar suscripción realtime incremental para `clientes` (sin refetch), más watcher de “habilitado” en `AuthProvider` para logout forzado. Slider: mantener implementación existente y solo ajustar feedback si hace falta.

**Tech Stack:** React Native (Expo), expo-router, Zustand, @tanstack/react-query, Supabase JS (DB + Realtime + Storage).

---

## Mapa de archivos (responsabilidades)

**Eliminar:**
- `mobile/app/(admin)/matches.tsx` — ruta de admin para Partidos.
- `mobile/app/(admin)/news.tsx` — ruta de admin para Novedades.
- `mobile/src/features/admin/screens/MatchesManagementScreen.tsx` — pantalla Partidos admin.
- `mobile/src/features/admin/screens/NewsManagementScreen.tsx` — pantalla Novedades admin.

**Modificar:**
- `mobile/app/(admin)/_layout.tsx` — Stack: remover screens `matches` y `news`.
- `mobile/src/features/admin/screens/AdminDashboardScreen.tsx` — menú: remover opciones Partidos/Novedades.
- `mobile/src/features/users/store/usersStore.ts` — agregar realtime incremental + métodos locales.
- `mobile/src/features/users/services/usersDb.ts` — exponer mapeo de row→AppUser o duplicar mapeo de manera segura para realtime.
- `mobile/src/providers/AuthProvider.tsx` — watcher realtime de `habilitado` para logout forzado.

**Revisar (sin cambios esperados):**
- `mobile/src/features/admin/screens/UsersManagementScreen.tsx` — integrar estados de loading por acción si hace falta.
- `mobile/src/features/admin/screens/SliderManagementScreen.tsx` — confirmar feedback/estética.
- `mobile/src/features/content/api/sliderSlides.ts` — confirmar realtime + storage.
- `mobile/app/(app)/index.tsx` — confirmar consumo slider en realtime.

---

## Task 1: Eliminar “Novedades” y “Partidos” del admin (rutas, menú, pantallas)

**Files:**
- Modify: `mobile/app/(admin)/_layout.tsx`
- Modify: `mobile/src/features/admin/screens/AdminDashboardScreen.tsx`
- Delete: `mobile/app/(admin)/matches.tsx`
- Delete: `mobile/app/(admin)/news.tsx`
- Delete: `mobile/src/features/admin/screens/MatchesManagementScreen.tsx`
- Delete: `mobile/src/features/admin/screens/NewsManagementScreen.tsx`

- [ ] **Step 1: Editar stack del admin**
  - En `mobile/app/(admin)/_layout.tsx` eliminar:
    - `<Stack.Screen name="matches" />`
    - `<Stack.Screen name="news" />`

- [ ] **Step 2: Editar menú del dashboard admin**
  - En `mobile/src/features/admin/screens/AdminDashboardScreen.tsx` eliminar de `MENU_OPTIONS`:
    - `label: 'Partidos'` (route `/(admin)/matches`)
    - `label: 'Novedades'` (route `/(admin)/news`)
  - Confirmar que el grid renderiza sin esas cards.

- [ ] **Step 3: Borrar archivos de rutas**
  - Eliminar:
    - `mobile/app/(admin)/matches.tsx`
    - `mobile/app/(admin)/news.tsx`

- [ ] **Step 4: Borrar pantallas admin**
  - Eliminar:
    - `mobile/src/features/admin/screens/MatchesManagementScreen.tsx`
    - `mobile/src/features/admin/screens/NewsManagementScreen.tsx`

- [ ] **Step 5: Verificación de referencias**
  - Buscar y asegurar 0 resultados:
    - `MatchesManagementScreen`
    - `NewsManagementScreen`
    - `/(admin)/matches`
    - `/(admin)/news`
  - Comandos (desde repo root):
    - `git grep -n "MatchesManagementScreen|NewsManagementScreen|/\\(admin\\)/matches|/\\(admin\\)/news" -- mobile`
  - Expected: sin matches.

- [ ] **Step 6: Commit**
  - `git add -A`
  - `git commit -m "refactor(admin): elimina novedades y partidos del panel"`

---

## Task 2: Usuarios — Realtime incremental en Zustand (clientes)

**Files:**
- Modify: `mobile/src/features/users/store/usersStore.ts`
- Modify: `mobile/src/features/users/services/usersDb.ts` (si se decide exportar helper)
- Add (opcional si se quiere prolijidad): `mobile/src/features/users/services/usersRealtime.ts`

- [ ] **Step 1: Crear helpers de mapping reutilizables**
  - Objetivo: evitar duplicar lógica de `mapRowToUser`.
  - Opción A (recomendada): exportar `mapRowToUser` desde `usersDb.ts`.
    - Cambiar `function mapRowToUser(row: any): AppUser` → `export function mapRowToUser(row: any): AppUser`
  - Si esto rompe algo por circular deps, crear archivo nuevo `usersMapper.ts` y mover ahí.

- [ ] **Step 2: Agregar métodos locales al store**
  - En `usersStore.ts`, extender el tipo `UsersStore`:
    - `upsertLocal: (user: AppUser) => void`
    - `removeLocal: (userId: string) => void`
    - `setLocalLoading?: (value: boolean) => void` (solo si se necesita)
  - Implementación sugerida (manteniendo orden por `createdAt` desc si existe):
    - `upsertLocal`:
      - si existe, reemplazar por id
      - si no existe, insertar
      - reordenar por `createdAt` desc si ambos tienen `createdAt`, si no por `id` desc como fallback
    - `removeLocal`: filtrar por id

- [ ] **Step 3: Agregar suscripción realtime a clientes**
  - En `usersStore.ts` agregar:
    - `realtimeStatus: 'disconnected' | 'connected' | 'error'` (opcional)
    - `startRealtime: () => () => void` (retorna cleanup)
  - Implementación:
    - `import { supabase } from '../../../lib/supabase'`
    - `supabase.channel('clientes-realtime')`
      - `.on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, (payload) => { ... })`
    - En handler:
      - Para `INSERT`/`UPDATE`: `upsertLocal(mapRowToUser(payload.new))`
      - Para `DELETE`: `removeLocal(String(payload.old.id))`
  - Cleanup:
    - `supabase.removeChannel(channel)`

- [ ] **Step 4: Conectar realtime al ciclo de vida**
  - En `UsersManagementScreen.tsx` (o en un provider admin si existe):
    - al montar la pantalla: llamar `startRealtime()` y guardar cleanup.
    - al desmontar: ejecutar cleanup.
  - Alternativa válida: iniciar realtime una sola vez en `AdminDashboardScreen` para que toda navegación admin quede sincronizada.

- [ ] **Step 5: Evitar refetch completo post-operación**
  - En `usersStore.ts`, cambiar:
    - `upsert/remove/setActivo/resetPassword` que hoy hacen `await refresh()`
  - Nuevo comportamiento:
    - ejecutar operación remota
    - *no* llamar `refresh()` como default
    - fallback: si la operación remota termina ok pero no hay realtime (ej: `realtimeStatus !== 'connected'`), entonces `await refresh()`

- [ ] **Step 6: Commit**
  - `git add mobile/src/features/users/store/usersStore.ts mobile/src/features/users/services/usersDb.ts`
  - `git commit -m "feat(users): realtime incremental en admin (clientes)"`

---

## Task 3: Usuarios — Feedback visual por operación (loading/success/error)

**Files:**
- Modify: `mobile/src/features/admin/screens/UsersManagementScreen.tsx`

- [ ] **Step 1: Estado de loading por fila**
  - Agregar estado local:
    - `const [busyUserIds, setBusyUserIds] = useState<Record<string, true>>({});`
  - Helpers:
    - `const setBusy = (id: string, v: boolean) => setBusyUserIds(s => { ... })`
  - En acciones:
    - toggle activo
    - delete
    - reset password
  - Mientras busy:
    - deshabilitar botones del `UserCard`
    - opcional: mostrar `ActivityIndicator` sobre el botón accionado

- [ ] **Step 2: Loading en modal**
  - Reutilizar `saving` ya existente o agregar:
    - `const [savingUser, setSavingUser] = useState(false);`
  - Deshabilitar “Guardar” y cambiar texto a “Guardando...”.

- [ ] **Step 3: Success feedback**
  - Mantener logs actuales (`useAdminActivityStore.log`).
  - Para UX inmediato:
    - usar `Alert.alert("OK", "...")` solo en acciones críticas (ej: reset password ya lo hace).
    - evitar spamear alerts en cada toggle; con realtime + log alcanza.

- [ ] **Step 4: Commit**
  - `git add mobile/src/features/admin/screens/UsersManagementScreen.tsx`
  - `git commit -m "ui(admin): feedback de acciones en usuarios"`

---

## Task 4: Bloqueo en tiempo real — logout forzado cuando `habilitado=false`

**Files:**
- Modify: `mobile/src/providers/AuthProvider.tsx`

- [ ] **Step 1: Implementar watcher realtime de la fila del usuario**
  - Agregar un `useEffect` que corra cuando `user` cambie.
  - Si `user == null`: no suscribirse.
  - Si `user.role === 'client'`:
    - suscribirse a `public.clientes` filtrando por `id == user.id`
  - Si `user.role === 'admin'`:
    - suscribirse a `public.admins` filtrando por `id == user.id`
  - En payload `UPDATE`:
    - si `habilitado === false`:
      - llamar `logout()`
      - (opcional) setear alguna marca en AsyncStorage para mostrar mensaje en login

- [ ] **Step 2: Cleanup correcto**
  - guardar `channel` y removerlo en cleanup del effect:
    - `supabase.removeChannel(channel)`

- [ ] **Step 3: Validar no-interferencia**
  - Asegurar que:
    - no rompe restoreSession
    - no rompe login (admin/client)

- [ ] **Step 4: Commit**
  - `git add mobile/src/providers/AuthProvider.tsx`
  - `git commit -m "feat(auth): logout si usuario queda deshabilitado"`

---

## Task 5: Slider — verificación + ajustes mínimos de feedback/estética

**Files:**
- Review/Modify (solo si aplica): `mobile/src/features/admin/screens/SliderManagementScreen.tsx`
- Review: `mobile/src/features/content/api/sliderSlides.ts`
- Review: `mobile/app/(app)/index.tsx`

- [ ] **Step 1: Confirmar feedback en operaciones**
  - Guardado: ya tiene `saving` y muestra “Guardando...”.
  - Delete: hoy usa `Alert` en error; OK.
  - Reorder: hoy llama `reorderMutation.mutate(next)` sin feedback visual.
    - Si se decide: agregar `isPending` visible (ej: deshabilitar botones up/down mientras reorder pending).

- [ ] **Step 2: Confirmar realtime admin → cliente**
  - Admin usa `useSliderRealtime()` y cliente también.
  - No tocar lógica, solo validar que sigue igual.

- [ ] **Step 3: Commit (solo si hubo cambios)**
  - `git add mobile/src/features/admin/screens/SliderManagementScreen.tsx`
  - `git commit -m "ui(slider): mejora feedback en reorder"` (si aplica)

---

## Task 6: Chequeos finales (compilación + lint + búsqueda de huérfanos)

**Files:** N/A (verificación)

- [ ] **Step 1: Buscar strings huérfanas**
  - `git grep -n "Novedades|Partidos" -- mobile/src/features/admin mobile/app/(admin)`
  - Expected:
    - No deben quedar “Novedades” ni “Partidos” como opciones del admin.
    - OJO: “Partidos” puede aparecer en la app cliente (fixture, etc.). No tocar eso.

- [ ] **Step 2: Typecheck / build**
  - Desde `mobile/`:
    - `npm test` (si existe) o `npm run lint` (si existe)
    - `npx tsc -p tsconfig.json --noEmit`
    - `npx expo export -p web` (si lo usan) o `npx expo start` (manual)

- [ ] **Step 3: Commit final (si hay fixes)**
  - `git add -A`
  - `git commit -m "chore: fix build after admin cleanup"` (si aplica)

---

## Self-review (plan vs spec)

- Cobertura spec:
  - Eliminación completa de news/matches: Task 1.
  - Usuarios realtime sin reload: Task 2 + Task 3.
  - Bloqueo corta acceso: Task 4 (más login ya lo hace).
  - Slider realtime: Task 5.
  - Estética unificada: Task 3 + Task 5 (solo ajustes mínimos).
- Placeholder scan: no hay “TODO/TBD”.
- Consistencia: se respetan paths exactos del repo.

---

## Handoff a ejecución

Plan completo y guardado en `docs/superpowers/plans/2026-06-05-admin-panel-usuarios-slider-plan.md`.

Dos opciones de ejecución:
1) **Subagent-Driven (recomendado)** — despacho subagente por task y reviso entre tasks.
2) **Inline Execution** — ejecuto tasks en esta sesión con checkpoints.

¿Cuál querés?

