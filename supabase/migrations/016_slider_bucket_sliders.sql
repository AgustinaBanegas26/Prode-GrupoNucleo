-- 016) Slider: crear bucket sliders y endurecer RLS para slider_slides

-- 1) Crear bucket sliders si no existe.
insert into storage.buckets (id, name, public)
values ('sliders', 'sliders', true)
on conflict (id) do nothing;

-- 2) Habilitar y endurecer RLS en slider_slides.
alter table public.slider_slides enable row level security;

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

-- 3) RLS storage (comentado: requiere role service_role en Supabase)
-- Para aplicar estas políticas, usa la consola Supabase > Storage > Policies
-- o ejecuta desde un client con service_role key.
-- alter table storage.objects enable row level security;
-- drop policy if exists "storage_sliders_select_all" on storage.objects;
-- ... etc
