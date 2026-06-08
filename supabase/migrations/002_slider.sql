-- Slider/Banner (Admin -> Cliente) + Storage bucket
-- Ejecutar en Supabase. Pensado para funcionar con el login legacy (admins/clientes).
-- Incluye: tabla + índices + trigger + bucket + RLS (permisiva) + Realtime.
--
-- IMPORTANTE (por tu setup actual):
-- - La app usa la anon key y NO usa Supabase Auth para roles.
-- - Para que funcione end-to-end sin backend intermedio, las políticas RLS deben ser permisivas
--   (equivalente a "público"). Luego se endurecen cuando migres a Auth/RLS real.

-- 1) Tabla de slides
create table if not exists public.slider_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  -- Ruta en Supabase Storage (bucket 'sliders'), ej: "slides/<uuid>.jpg"
  image_path text not null,

  button_enabled boolean not null default false,
  button_text text not null default '',
  internal_link text,
  external_link text,

  sort_order int not null default 1,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists slider_slides_sort_order_idx on public.slider_slides(sort_order);
create index if not exists slider_slides_is_active_idx on public.slider_slides(is_active);

-- 2) updated_at automático
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_slider_slides_updated_at on public.slider_slides;
create trigger trg_slider_slides_updated_at
before update on public.slider_slides
for each row execute procedure public.set_updated_at();

-- 3) Realtime (para sincronización inmediata admin -> cliente)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'slider_slides'
  ) then
    alter publication supabase_realtime add table public.slider_slides;
  end if;
end $$;

-- 4) Storage bucket público para imágenes del slider
-- (Si ya existe, no hace nada)
insert into storage.buckets (id, name, public)
values ('sliders', 'sliders', true)
on conflict (id) do nothing;

-- 5) RLS: tabla
alter table public.slider_slides enable row level security;

drop policy if exists "slider_slides_select_all" on public.slider_slides;
create policy "slider_slides_select_all"
on public.slider_slides
for select
to public
using (true);

drop policy if exists "slider_slides_insert_all" on public.slider_slides;
create policy "slider_slides_insert_all"
on public.slider_slides
for insert
to authenticated
with check (auth.role() = 'admin');

drop policy if exists "slider_slides_update_all" on public.slider_slides;
create policy "slider_slides_update_all"
on public.slider_slides
for update
to authenticated
using (auth.role() = 'admin')
with check (auth.role() = 'admin');

drop policy if exists "slider_slides_delete_all" on public.slider_slides;
create policy "slider_slides_delete_all"
on public.slider_slides
for delete
to authenticated
using (auth.role() = 'admin');

-- Storage RLS (comentado: requiere role service_role en Supabase)
-- Para aplicar estas políticas, usa la consola Supabase > Storage > Policies
-- o ejecuta desde un client con service_role key.
-- alter table storage.objects enable row level security;
-- drop policy if exists "storage_sliders_select_all" on storage.objects;
-- create policy "storage_sliders_select_all"
-- on storage.objects
-- for select
-- to public
-- using (bucket_id = 'sliders');
-- ... etc
