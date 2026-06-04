-- Pronósticos (cliente) + base para rankings/resultados
-- Nota: La tabla matches ya existe (001_matches.sql) con PK fixture_id (int).
-- Esta migración crea predicciones, y un "cache" opcional de ranking para lectura rápida.

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  fixture_id int not null references public.matches(fixture_id) on delete cascade,
  -- cliente_id: se guarda como text porque en tu AuthProvider se usa string/number según DB.
  cliente_id text not null,
  home_goals int,
  away_goals int,
  pick text, -- opcional (ej: '1', 'X', '2' o código)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fixture_id, cliente_id)
);

create index if not exists predictions_cliente_id_idx on public.predictions(cliente_id);
create index if not exists predictions_fixture_id_idx on public.predictions(fixture_id);

-- updated_at automático (usa public.set_updated_at si ya existe; si no, lo crea)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_predictions_updated_at on public.predictions;
create trigger trg_predictions_updated_at
before update on public.predictions
for each row execute function public.set_updated_at();

-- Tabla opcional: ranking_cache (se puede recalcular por job/edge function)
create table if not exists public.ranking_cache (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'general', -- 'general' | 'semanal' | etc
  cliente_id text not null,
  points int not null default 0,
  played int not null default 0,
  diff int not null default 0,
  updated_at timestamptz not null default now(),
  unique (scope, cliente_id)
);

create index if not exists ranking_cache_scope_points_idx on public.ranking_cache(scope, points desc);

-- Realtime (idempotente)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'predictions'
  ) then
    alter publication supabase_realtime add table public.predictions;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ranking_cache'
  ) then
    alter publication supabase_realtime add table public.ranking_cache;
  end if;
end $$;

-- RLS: permisiva (para que funcione con anon key). Luego endurecer.
alter table public.predictions enable row level security;
alter table public.ranking_cache enable row level security;

drop policy if exists "predictions_select_all" on public.predictions;
create policy "predictions_select_all" on public.predictions for select to public using (true);
drop policy if exists "predictions_insert_all" on public.predictions;
create policy "predictions_insert_all" on public.predictions for insert to public with check (true);
drop policy if exists "predictions_update_all" on public.predictions;
create policy "predictions_update_all" on public.predictions for update to public using (true) with check (true);
drop policy if exists "predictions_delete_all" on public.predictions;
create policy "predictions_delete_all" on public.predictions for delete to public using (true);

drop policy if exists "ranking_cache_select_all" on public.ranking_cache;
create policy "ranking_cache_select_all" on public.ranking_cache for select to public using (true);
drop policy if exists "ranking_cache_insert_all" on public.ranking_cache;
create policy "ranking_cache_insert_all" on public.ranking_cache for insert to public with check (true);
drop policy if exists "ranking_cache_update_all" on public.ranking_cache;
create policy "ranking_cache_update_all" on public.ranking_cache for update to public using (true) with check (true);
drop policy if exists "ranking_cache_delete_all" on public.ranking_cache;
create policy "ranking_cache_delete_all" on public.ranking_cache for delete to public using (true);

