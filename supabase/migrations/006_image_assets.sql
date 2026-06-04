-- Assets de imagen genéricos (banners/ads/etc) + Storage bucket + RLS + Realtime
-- Sirve para cualquier módulo que necesite imágenes administrables sin hardcode ni URLs.

create table if not exists public.image_assets (
  id uuid primary key default gen_random_uuid(),
  module text not null,      -- ej: 'banners', 'ads', 'sponsors', 'home'
  label text not null default '',
  image_path text not null,  -- bucket 'assets'
  link_internal text,
  link_external text,
  is_active boolean not null default true,
  sort_order int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists image_assets_module_idx on public.image_assets(module);
create index if not exists image_assets_sort_order_idx on public.image_assets(sort_order);
create index if not exists image_assets_is_active_idx on public.image_assets(is_active);

-- updated_at automático (usa public.set_updated_at si ya existe; si no, lo crea)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_image_assets_updated_at on public.image_assets;
create trigger trg_image_assets_updated_at
before update on public.image_assets
for each row execute function public.set_updated_at();

-- Realtime (idempotente)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'image_assets'
  ) then
    alter publication supabase_realtime add table public.image_assets;
  end if;
end $$;

-- Storage bucket público para assets genéricos
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- RLS: tabla image_assets (permisiva)
alter table public.image_assets enable row level security;

drop policy if exists "image_assets_select_all" on public.image_assets;
create policy "image_assets_select_all"
on public.image_assets
for select
to public
using (true);

drop policy if exists "image_assets_insert_all" on public.image_assets;
create policy "image_assets_insert_all"
on public.image_assets
for insert
to public
with check (true);

drop policy if exists "image_assets_update_all" on public.image_assets;
create policy "image_assets_update_all"
on public.image_assets
for update
to public
using (true)
with check (true);

drop policy if exists "image_assets_delete_all" on public.image_assets;
create policy "image_assets_delete_all"
on public.image_assets
for delete
to public
using (true);

-- RLS: Storage (bucket assets) (permisiva)
alter table storage.objects enable row level security;

drop policy if exists "storage_assets_select_all" on storage.objects;
create policy "storage_assets_select_all"
on storage.objects
for select
to public
using (bucket_id = 'assets');

drop policy if exists "storage_assets_insert_all" on storage.objects;
create policy "storage_assets_insert_all"
on storage.objects
for insert
to public
with check (bucket_id = 'assets');

drop policy if exists "storage_assets_update_all" on storage.objects;
create policy "storage_assets_update_all"
on storage.objects
for update
to public
using (bucket_id = 'assets')
with check (bucket_id = 'assets');

drop policy if exists "storage_assets_delete_all" on storage.objects;
create policy "storage_assets_delete_all"
on storage.objects
for delete
to public
using (bucket_id = 'assets');

