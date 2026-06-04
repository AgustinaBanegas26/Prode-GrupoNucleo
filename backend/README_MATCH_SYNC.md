# Match Sync (API-Football → Supabase)

## Objetivo
Poblar la tabla `matches` en Supabase con el fixture del Mundial 2026 y mantener resultados actualizados.

## Requisitos previos (Supabase)
1) Ejecutar la migración:
```sql
-- supabase/migrations/001_matches.sql
```
2) Confirmar que la tabla `matches` quedó incluida en Realtime:
```sql
select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'matches';
```

## Variables de entorno (backend)
Crear `backend/.env` (podés copiar de `.env.example`):

```env
API_FOOTBALL_KEY=...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=...  # service role
```

## Instalar dependencias
Desde `backend/`:
```bash
npm install
```

## 1) Sync inicial del fixture (para que aparezcan partidos futuros en la app)
Desde `backend/`:
```bash
npm run sync:fixture
```

Esto ejecuta `syncAllMatches()` (paginado) y hace upsert de todos los partidos del season.

## 2) Iniciar cron continuo
Desde `backend/`:
```bash
npm run start:jobs
```

Jobs:
- cada 2 minutos: sincroniza partidos finalizados (FT/AET/PEN)
- diario 06:00 UTC: sincroniza fixture completo

## Verificación rápida
En Supabase SQL:
```sql
select fixture_id, home_team, away_team, status, home_goals, away_goals, match_date
from matches
order by match_date asc
limit 20;
```

## App móvil
La pantalla `Fixture` ahora lee desde Supabase (`matches`) vía el hook:
```text
mobile/src/hooks/useMatchResults.js
```

