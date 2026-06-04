# Informe — Auditoría y corrección de recuperación de contraseña

## Síntoma
El usuario completaba “¿Olvidaste tu contraseña?”, la app “procesaba” pero **no llegaba ningún correo**.

## Causa raíz (principal)
En este proyecto el login es **legacy** (tablas `admins`/`clientes` + bcrypt) y **no todos los usuarios existen en `auth.users`**.

Supabase Auth **solo envía** emails de recuperación para cuentas que existen en `auth.users`.  
Además, `resetPasswordForEmail()` puede devolver “OK” aunque el usuario no exista (para evitar enumeración), lo que hace que el flujo parezca exitoso sin enviar correo.

## Cambios realizados
### 1) Instrumentación y diagnóstico (logs)
Se agregaron logs detallados en `src/services/auth/passwordRecoveryService.ts`:
- email normalizado y `redirectTo`
- errores devueltos por Supabase
- trazas al establecer sesión desde el enlace

### 2) Deep links de recuperación más robustos
Se amplió el parsing del enlace para soportar los formatos comunes:
- `access_token` / `refresh_token` (implicit flow)
- `code` (PKCE) mediante `exchangeCodeForSession(code)`
- `token_hash` mediante `verifyOtp({ type: 'recovery', token_hash })`

### 3) Plantilla de email compatible con Supabase
Se corrigió el placeholder no soportado `{{nombreUsuario}}` por una variable real:
- `Hola {{ .Email }}`

### 4) Estrategia segura de sincronización con `auth.users` (sin exponer service_role)
Se agregó una Edge Function **opcional pero recomendada**:
```text
supabase/functions/ensure-auth-user/index.ts
```
La app la invoca antes de llamar `resetPasswordForEmail()` para garantizar que el usuario exista en `auth.users`.

> Nota: si la function no está desplegada, el código no rompe: registra un warning y continúa.

## Archivos tocados
- `mobile/src/services/auth/passwordRecoveryService.ts`
- `mobile/supabase/email-templates/password-reset.html`
- `mobile/docs/SUPABASE_PASSWORD_RECOVERY.md`
- `supabase/functions/ensure-auth-user/index.ts`

## Checklist de pruebas (real)
1) Usuario existente en `auth.users` → llega email → link abre app → cambia contraseña → login ok  
2) Usuario en `admins/clientes` pero no en `auth.users` → con function desplegada: llega email  
3) Email inválido → error UI  
4) Token/link vencido → error UI y pedir nuevo enlace  
5) Cambio exitoso → actualiza Supabase Auth + bcrypt en tabla legacy  
6) Primer ingreso obligatorio → `must_change_password` se desactiva tras el cambio

