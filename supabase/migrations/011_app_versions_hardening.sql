-- =====================================================================
-- 011) APP VERSIONS — Hardening producción
-- =====================================================================
-- Objetivo:
--  - Mantener compatibilidad con lo ya creado
--  - Endurecer reglas:
--      * version_code solo creciente (insert)
--      * version/version_code/apk_url inmutables (update)
--      * solo 1 activa (ya existe trigger en 010, se mantiene)
--      * apk_url: permitir NULL, pero si existe debe ser URL pública HTTPS de Supabase Storage
--      * políticas RLS: lectura pública, escritura restringida
-- =====================================================================

-- 1) Asegurar columna apk_url nullable (para compat con seed y fallback)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'app_versions'
      and column_name = 'apk_url'
      and is_nullable = 'NO'
  ) then
    alter table public.app_versions alter column apk_url drop not null;
  end if;
end $$;

-- 2) Check constraint: si apk_url no es NULL, debe ser Supabase Storage public HTTPS
alter table public.app_versions
  drop constraint if exists app_versions_apk_url_supabase_storage_chk;

alter table public.app_versions
  add constraint app_versions_apk_url_supabase_storage_chk
  check (
    apk_url is null
    or apk_url ~* '^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/.+'
  );

-- 3) Índices únicos para evitar reuso de version_code y apk_url
create unique index if not exists app_versions_version_code_unique_idx
  on public.app_versions (version_code);

create unique index if not exists app_versions_apk_url_unique_idx
  on public.app_versions (apk_url)
  where apk_url is not null;

-- 4) Trigger: version_code solo creciente (insert)
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

-- 5) Trigger: inmutabilidad de version/version_code/apk_url (update)
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

-- 6) RLS: lectura pública, escritura restringida
alter table public.app_versions enable row level security;

-- Eliminar políticas permisivas (si existen)
drop policy if exists "app_versions_select_all" on public.app_versions;
drop policy if exists "app_versions_insert_all" on public.app_versions;
drop policy if exists "app_versions_update_all" on public.app_versions;
drop policy if exists "app_versions_delete_all" on public.app_versions;

-- Lectura pública (endpoint público)
create policy "app_versions_select_public" on public.app_versions
  for select
  to public
  using (true);

-- Escritura: solo service_role (backend)
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

-- 7) Compat seed: si existe seed con apk_url vacío, normalizar a NULL
update public.app_versions
set apk_url = null
where apk_url = '';

