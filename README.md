# Prode Grupo Núcleo - Mundial FIFA 2026

Repositorio del proyecto Prode Grupo Núcleo (Mobile en React Native + Expo).

## Stack (Mobile)

- React Native + Expo + TypeScript
- Expo Router
- Zustand
- React Query
- Light/Dark Mode global

## Estructura

```text
mobile/
  app/                 Rutas (Expo Router)
  src/
    components/        Componentes reutilizables
    lib/               Configuración y utilidades
    providers/         Providers globales (tema, etc.)
    store/             Estado global (Zustand)
    theme/             Tokens y creación de tema
  images/              Assets del proyecto (logos)
```

## Instalación

```bash
cd mobile
npm install
```

## Ejecutar

```bash
cd mobile
npm run start
```

## Recuperación de contraseña (Supabase Auth)

Configuración, plantilla de email y migraciones SQL:

- `mobile/docs/SUPABASE_PASSWORD_RECOVERY.md`
- `mobile/supabase/email-templates/password-reset.html`
- `mobile/supabase/migrations/002_password_recovery.sql`

## Assets requeridos

Los logos se encuentran en:

- `mobile/images/icononucleo.png`
- `mobile/images/icononucleo-light.png`
