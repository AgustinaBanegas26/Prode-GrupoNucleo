-- FIX SCHEMA: Asegura que TODAS las columnas existan en todas las tablas
-- Ejecuta esto en Supabase SQL Editor si 000_setup_all.sql falla

-- =====================================================================
-- PASO 1: Asegurar columnas en MATCHES
-- =====================================================================
alter table if exists public.matches add column if not exists status text default 'NS';
alter table public.matches alter column status set not null;
alter table public.matches alter column status set default 'NS';

-- =====================================================================
-- PASO 2: Asegurar columnas en NEWS
-- =====================================================================
alter table if exists public.news add column if not exists status text default 'draft';
alter table public.news alter column status set not null;
alter table public.news alter column status set default 'draft';
alter table if exists public.news add column if not exists published_at timestamptz;
alter table if exists public.news add column if not exists created_at timestamptz;
alter table if exists public.news add column if not exists updated_at timestamptz;

-- Si la columna status ya existe pero sin constraint
alter table public.news drop constraint if exists news_status_check;
alter table public.news add constraint news_status_check check (status in ('draft', 'published'));

-- =====================================================================
-- PASO 3: Recrear FUNCIÓN news_set_published_at (sin dependencias)
-- =====================================================================
drop function if exists public.news_set_published_at() cascade;

create or replace function public.news_set_published_at()
returns trigger as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  if new.status = 'draft' then
    new.published_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

-- =====================================================================
-- PASO 4: Recrear TRIGGER news_published_at
-- =====================================================================
drop trigger if exists trg_news_published_at on public.news;

create trigger trg_news_published_at
before insert or update on public.news
for each row execute function public.news_set_published_at();

-- =====================================================================
-- PASO 5: Asegurar índices en NEWS
-- =====================================================================
create index if not exists news_status_idx on public.news(status);
create index if not exists news_published_at_idx on public.news(published_at desc);

-- =====================================================================
-- PASO 6: Asegurar REALTIME y RLS en NEWS
-- =====================================================================
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'news'
  ) then
    alter publication supabase_realtime add table public.news;
  end if;
end $$;

alter table public.news enable row level security;

drop policy if exists "news_select_all" on public.news;
create policy "news_select_all" on public.news for select to public using (true);

drop policy if exists "news_insert_all" on public.news;
create policy "news_insert_all" on public.news for insert to public with check (true);

drop policy if exists "news_update_all" on public.news;
create policy "news_update_all" on public.news for update to public using (true) with check (true);

drop policy if exists "news_delete_all" on public.news;
create policy "news_delete_all" on public.news for delete to public using (true);

-- =====================================================================
-- PASO 7: Asegurar STORAGE BUCKET
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('news', 'news', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('sliders', 'sliders', true)
on conflict (id) do nothing;

-- =====================================================================
-- PASO 8: Verificar que TODAS las columnas necesarias existan
-- =====================================================================
alter table if exists public.slider_slides add column if not exists id uuid;
alter table if exists public.slider_slides add column if not exists title text;
alter table if exists public.slider_slides add column if not exists description text default '';
alter table if exists public.slider_slides add column if not exists image_path text;
alter table if exists public.slider_slides add column if not exists button_enabled boolean default false;
alter table if exists public.slider_slides add column if not exists button_text text default '';
alter table if exists public.slider_slides add column if not exists internal_link text;
alter table if exists public.slider_slides add column if not exists external_link text;
alter table if exists public.slider_slides add column if not exists sort_order int default 1;
alter table if exists public.slider_slides add column if not exists is_active boolean default true;
alter table if exists public.slider_slides add column if not exists created_at timestamptz default now();
alter table if exists public.slider_slides add column if not exists updated_at timestamptz default now();

-- =====================================================================
-- PASO 9: Asegurar RLS en SLIDER_SLIDES
-- =====================================================================
alter table public.slider_slides enable row level security;

drop policy if exists "slider_slides_select_all" on public.slider_slides;
create policy "slider_slides_select_all" on public.slider_slides for select to public using (true);

drop policy if exists "slider_slides_insert_admin" on public.slider_slides;
create policy "slider_slides_insert_admin" on public.slider_slides for insert to authenticated 
with check (auth.role() = 'admin');

drop policy if exists "slider_slides_update_admin" on public.slider_slides;
create policy "slider_slides_update_admin" on public.slider_slides for update to authenticated 
using (auth.role() = 'admin') with check (auth.role() = 'admin');

drop policy if exists "slider_slides_delete_admin" on public.slider_slides;
create policy "slider_slides_delete_admin" on public.slider_slides for delete to authenticated 
using (auth.role() = 'admin');

-- =====================================================================
-- PASO 10: Verificar ADMINS
-- =====================================================================
alter table if exists public.admins add column if not exists id uuid;
alter table if exists public.admins add column if not exists usuario text;
alter table if exists public.admins add column if not exists email text;
alter table if exists public.admins add column if not exists password_hash text;
alter table if exists public.admins add column if not exists primer_login boolean default true;
alter table if exists public.admins add column if not exists must_change_password boolean default true;
alter table if exists public.admins add column if not exists habilitado boolean default true;
alter table if exists public.admins add column if not exists created_at timestamptz default now();
alter table if exists public.admins add column if not exists updated_at timestamptz default now();

-- =====================================================================
-- ✅ FIN - TODO DEBE ESTAR CONECTADO
-- =====================================================================
