-- =====================================================================
-- 012) APP VERSIONS — SQL COMPLETO (idempotente)
-- =====================================================================
-- Incluye:
--  - tabla public.app_versions
--  - constraints + índices
--  - triggers:
--      * solo 1 activa
--      * version_code solo creciente (insert)
--      * inmutabilidad de version/version_code/apk_url (update)
--  - RLS policies: lectura pública, escritura solo service_role
-- =====================================================================

-- 0) Tabla
create table if not exists public.app_versions (
  id           uuid primary key default gen_random_uuid(),
  version      text not null,
  version_code int not null,
  apk_url      text null,
  force_update boolean not null default false,
  changelog    text not null default '',
  is_active    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 1) Índices base
create index if not exists app_versions_is_active_idx on public.app_versions(is_active);
create index if not exists app_versions_version_code_idx on public.app_versions(version_code desc);
create unique index if not exists app_versions_version_unique_idx on public.app_versions(version);
create unique index if not exists app_versions_version_code_unique_idx on public.app_versions(version_code);
create unique index if not exists app_versions_apk_url_unique_idx on public.app_versions(apk_url) where apk_url is not null;

-- 2) updated_at
drop trigger if exists trg_app_versions_updated_at on public.app_versions;
create trigger trg_app_versions_updated_at
before update on public.app_versions
for each row execute function public.set_updated_at();

-- 3) Constraint apk_url: si existe, debe ser Supabase Storage public HTTPS
alter table public.app_versions
  drop constraint if exists app_versions_apk_url_supabase_storage_chk;

alter table public.app_versions
  add constraint app_versions_apk_url_supabase_storage_chk
  check (
    apk_url is null
    or apk_url ~* '^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/.+'
  );

-- 4) Trigger: solo UNA activa
create or replace function public.deactivate_other_app_versions()
returns trigger as $$
begin
  if new.is_active = true then
    update public.app_versions
    set is_active = false, updated_at = now()
    where id != new.id and is_active = true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_app_versions_single_active on public.app_versions;
create trigger trg_app_versions_single_active
after insert or update on public.app_versions
for each row
when (new.is_active = true)
execute function public.deactivate_other_app_versions();

-- 5) Trigger: version_code solo creciente (insert)
create or replace function public.enforce_app_versions_version_code_increasing()
returns trigger as $$
declare
  max_code int;
begin
  select max(version_code) into max_code from public.app_versions;
  if max_code is not null and new.version_code <= max_code then
    raise exception 'version_code debe ser mayor al actual (%)', max_code
      using errcode = '23514';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_app_versions_version_code_increasing on public.app_versions;
create trigger trg_app_versions_version_code_increasing
before insert on public.app_versions
for each row
execute function public.enforce_app_versions_version_code_increasing();

-- 6) Trigger: inmutabilidad de version/version_code/apk_url (update)
create or replace function public.prevent_app_versions_immutable_fields_update()
returns trigger as $$
begin
  if new.version is distinct from old.version then
    raise exception 'No se permite modificar version' using errcode = '23514';
  end if;
  if new.version_code is distinct from old.version_code then
    raise exception 'No se permite modificar version_code' using errcode = '23514';
  end if;
  if new.apk_url is distinct from old.apk_url then
    raise exception 'No se permite modificar apk_url' using errcode = '23514';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_app_versions_immutable_fields on public.app_versions;
create trigger trg_app_versions_immutable_fields
before update on public.app_versions
for each row
execute function public.prevent_app_versions_immutable_fields_update();

-- 7) Realtime (opcional)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_versions'
  ) then
    alter publication supabase_realtime add table public.app_versions;
  end if;
end $$;

-- 8) RLS policies
alter table public.app_versions enable row level security;

drop policy if exists "app_versions_select_public" on public.app_versions;
drop policy if exists "app_versions_insert_service_role" on public.app_versions;
drop policy if exists "app_versions_update_service_role" on public.app_versions;
drop policy if exists "app_versions_delete_service_role" on public.app_versions;

create policy "app_versions_select_public" on public.app_versions
  for select
  to public
  using (true);

create policy "app_versions_insert_service_role" on public.app_versions
  for insert
  to service_role
  with check (true);

create policy "app_versions_update_service_role" on public.app_versions
  for update
  to service_role
  using (true)
  with check (true);

create policy "app_versions_delete_service_role" on public.app_versions
  for delete
  to service_role
  using (true);

-- 9) Normalización seed legacy
update public.app_versions
set apk_url = null
where apk_url = '';

