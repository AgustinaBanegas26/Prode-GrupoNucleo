-- 019) Permisos slider_slides (tabla public — SÍ se puede ejecutar en SQL Editor)
-- NOTA: las políticas de storage.objects NO se pueden crear por SQL (error "must be owner").
--       Para Storage usá el Dashboard o desplegá la Edge Function slider-upload.

insert into storage.buckets (id, name, public)
values ('sliders', 'sliders', true)
on conflict (id) do update set public = true;

-- Solo tabla public.slider_slides (login legacy + anon key)
drop policy if exists "slider_slides_insert_all" on public.slider_slides;
drop policy if exists "slider_slides_insert_admin" on public.slider_slides;
drop policy if exists "slider_slides_insert_anon" on public.slider_slides;
create policy "slider_slides_insert_anon"
on public.slider_slides for insert to anon with check (true);

drop policy if exists "slider_slides_update_all" on public.slider_slides;
drop policy if exists "slider_slides_update_admin" on public.slider_slides;
drop policy if exists "slider_slides_update_anon" on public.slider_slides;
create policy "slider_slides_update_anon"
on public.slider_slides for update to anon using (true) with check (true);

drop policy if exists "slider_slides_delete_all" on public.slider_slides;
drop policy if exists "slider_slides_delete_admin" on public.slider_slides;
drop policy if exists "slider_slides_delete_anon" on public.slider_slides;
create policy "slider_slides_delete_anon"
on public.slider_slides for delete to anon using (true);
