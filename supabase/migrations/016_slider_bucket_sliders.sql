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
with check (auth.role = 'admin');

drop policy if exists "slider_slides_update_all" on public.slider_slides;
create policy "slider_slides_update_all"
on public.slider_slides
for update
to authenticated
using (auth.role = 'admin')
with check (auth.role = 'admin');

drop policy if exists "slider_slides_delete_all" on public.slider_slides;
create policy "slider_slides_delete_all"
on public.slider_slides
for delete
to authenticated
using (auth.role = 'admin');

-- 3) Habilitar y endurecer RLS en storage.objects para el bucket sliders.
alter table storage.objects enable row level security;

drop policy if exists "storage_sliders_select_all" on storage.objects;
create policy "storage_sliders_select_all"
on storage.objects
for select
to public
using (bucket_id = 'sliders');

drop policy if exists "storage_sliders_insert_all" on storage.objects;
create policy "storage_sliders_insert_all"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'sliders' and auth.role = 'admin');

drop policy if exists "storage_sliders_update_all" on storage.objects;
create policy "storage_sliders_update_all"
on storage.objects
for update
to authenticated
using (bucket_id = 'sliders' and auth.role = 'admin')
with check (bucket_id = 'sliders');

drop policy if exists "storage_sliders_delete_all" on storage.objects;
create policy "storage_sliders_delete_all"
on storage.objects
for delete
to authenticated
using (bucket_id = 'sliders');
