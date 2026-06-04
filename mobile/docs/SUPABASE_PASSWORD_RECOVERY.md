# Recuperación de contraseña — Supabase Auth

## URL Configuration (Dashboard)

En **Authentication → URL Configuration**, agregar:

| Tipo | URL |
|------|-----|
| Deep link (app móvil) | `prode-grupo-nucleo://reset-password` |
| Web (producción) | `https://TU_DOMINIO/reset-password` |

Variable opcional en `.env`:

```env
EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL=prode-grupo-nucleo://reset-password
```

Para web en Expo:

```env
EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL=https://TU_DOMINIO/reset-password
```

## Plantilla de email

1. Ir a **Authentication → Email Templates → Reset Password**
2. Copiar el contenido de `mobile/supabase/email-templates/password-reset.html`
3. Reemplazar `https://TU_DOMINIO_PUBLICO/mobile/images/icononucleo.png` por la URL pública del logo
4. Supabase usa `{{ .ConfirmationURL }}` como enlace de recuperación (token seguro, expiración y uso único gestionados por Supabase)

## Usuarios en Supabase Auth

`resetPasswordForEmail` requiere que el email exista en **auth.users**.

Para cada admin/cliente con recuperación por email:

1. Crear usuario en Authentication con el mismo email registrado en `admins.email` o `clientes.email`
2. Ejecutar la migración `mobile/supabase/migrations/002_password_recovery.sql`
3. Mantener sincronizado el hash legacy: al restablecer desde la app, `passwordRecoveryService` actualiza `password_hash` en `admins`/`clientes`

## Flujo en la app

1. **Olvidé mi contraseña** → `sendPasswordResetEmail()` → correo con enlace
2. Usuario abre enlace → deep link `prode-grupo-nucleo://reset-password#access_token=...`
3. **Reset password** → `establishRecoverySessionFromUrl()` + `updatePassword()`
4. Login con la nueva contraseña

## Cambio obligatorio (`mustChangePassword`)

- Campo en BD: `must_change_password` (admins / clientes) y `profiles.must_change_password`
- Tras login con primer ingreso, la sesión guarda `mustChangePassword: true`
- `AuthGate` redirige a `/(auth)/force-change-password` y bloquea el resto de rutas
- Al guardar, se actualiza `must_change_password = false` y `primer_login = false`
