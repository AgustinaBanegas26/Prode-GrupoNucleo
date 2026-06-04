-- Noticias (Admin -> Cliente) + Storage bucket
-- Incluye: tabla + índices + triggers + bucket + RLS (permisiva) + Realtime.
--
-- IMPORTANTE (por tu setup actual):
-- - La app usa la anon key y NO usa Supabase Auth para roles.
-- - Para que funcione end-to-end sin backend intermedio, las políticas RLS deben ser permisivas
--   (equivalente a "público"). Luego se endurecen cuando migres a Auth/RLS real.

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_path text not null, -- bucket 'news'
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_status_idx on public.news(status);
create index if not exists news_published_at_idx on public.news(published_at desc);

-- updated_at automático (usa public.set_updated_at si ya existe; si no, lo crea)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_news_updated_at on public.news;
create trigger trg_news_updated_at
before update on public.news
for each row execute function public.set_updated_at();

-- Si se pasa a published y no hay published_at, setearlo automáticamente
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

drop trigger if exists trg_news_published_at on public.news;
create trigger trg_news_published_at
before insert or update on public.news
for each row execute function public.news_set_published_at();

-- Realtime
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

-- Storage bucket público para imágenes de noticias
insert into storage.buckets (id, name, public)
values ('news', 'news', true)
on conflict (id) do nothing;

-- RLS: tabla news (permisiva)
alter table public.news enable row level security;

drop policy if exists "news_select_all" on public.news;
create policy "news_select_all"
on public.news
for select
to public
using (true);

drop policy if exists "news_insert_all" on public.news;
create policy "news_insert_all"
on public.news
for insert
to public
with check (true);

drop policy if exists "news_update_all" on public.news;
create policy "news_update_all"
on public.news
for update
to public
using (true)
with check (true);

drop policy if exists "news_delete_all" on public.news;
create policy "news_delete_all"
on public.news
for delete
to public
using (true);

-- RLS: Storage (bucket news) (permisiva)
alter table storage.objects enable row level security;

drop policy if exists "storage_news_select_all" on storage.objects;
create policy "storage_news_select_all"
on storage.objects
for select
to public
using (bucket_id = 'news');

drop policy if exists "storage_news_insert_all" on storage.objects;
create policy "storage_news_insert_all"
on storage.objects
for insert
to public
with check (bucket_id = 'news');

drop policy if exists "storage_news_update_all" on storage.objects;
create policy "storage_news_update_all"
on storage.objects
for update
to public
using (bucket_id = 'news')
with check (bucket_id = 'news');

drop policy if exists "storage_news_delete_all" on storage.objects;
create policy "storage_news_delete_all"
on storage.objects
for delete
to public
using (bucket_id = 'news');
