-- =====================================================================
-- 010) APP VERSIONS — Control de versiones APK
-- =====================================================================
-- Solo puede haber UNA versión activa a la vez (is_active = true).
-- El campo apk_url es la URL pública de descarga del APK.
-- El campo force_update indica si la actualización es obligatoria.
-- =====================================================================

create table if not exists public.app_versions (
  id          uuid primary key default gen_random_uuid(),
  version     text not null,
  version_code int not null,
  apk_url     text not null,
  force_update boolean not null default false,
  changelog   text not null default '',
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists app_versions_is_active_idx on public.app_versions(is_active);
create index if not exists app_versions_version_code_idx on public.app_versions(version_code desc);
create unique index if not exists app_versions_version_unique_idx on public.app_versions(version);

-- Trigger updated_at
drop trigger if exists trg_app_versions_updated_at on public.app_versions;
create trigger trg_app_versions_updated_at
before update on public.app_versions
for each row execute function public.set_updated_at();

-- Realtime
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

-- RLS
alter table public.app_versions enable row level security;

drop policy if exists "app_versions_select_all" on public.app_versions;
create policy "app_versions_select_all" on public.app_versions for select to public using (true);

drop policy if exists "app_versions_insert_all" on public.app_versions;
create policy "app_versions_insert_all" on public.app_versions for insert to public with check (true);

drop policy if exists "app_versions_update_all" on public.app_versions;
create policy "app_versions_update_all" on public.app_versions for update to public using (true) with check (true);

drop policy if exists "app_versions_delete_all" on public.app_versions;
create policy "app_versions_delete_all" on public.app_versions for delete to public using (true);

-- Función: al activar una versión, desactiva las demás
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

-- Seed: versión inicial (1.0.0) activa como baseline
insert into public.app_versions (version, version_code, apk_url, force_update, changelog, is_active)
values ('1.0.0', 1, '', false, 'Versión inicial', true)
on conflict (version) do nothing;
