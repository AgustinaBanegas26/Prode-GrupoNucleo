-- Eventos (Admin -> Cliente) + Storage bucket + RLS + Realtime

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  location text,

  start_at timestamptz,
  end_at timestamptz,

  image_path text, -- bucket 'events' (opcional)
  is_published boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_is_published_idx on public.events(is_published);
create index if not exists events_start_at_idx on public.events(start_at);

-- updated_at automático (usa public.set_updated_at si ya existe; si no, lo crea)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

-- Realtime (idempotente)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
end $$;

-- Storage bucket público para imágenes de eventos
insert into storage.buckets (id, name, public)
values ('events', 'events', true)
on conflict (id) do nothing;

-- RLS: tabla events (permisiva)
alter table public.events enable row level security;

drop policy if exists "events_select_all" on public.events;
create policy "events_select_all"
on public.events
for select
to public
using (true);

drop policy if exists "events_insert_all" on public.events;
create policy "events_insert_all"
on public.events
for insert
to public
with check (true);

drop policy if exists "events_update_all" on public.events;
create policy "events_update_all"
on public.events
for update
to public
using (true)
with check (true);

drop policy if exists "events_delete_all" on public.events;
create policy "events_delete_all"
on public.events
for delete
to public
using (true);

-- RLS: Storage (bucket events) (permisiva)
alter table storage.objects enable row level security;

drop policy if exists "storage_events_select_all" on storage.objects;
create policy "storage_events_select_all"
on storage.objects
for select
to public
using (bucket_id = 'events');

drop policy if exists "storage_events_insert_all" on storage.objects;
create policy "storage_events_insert_all"
on storage.objects
for insert
to public
with check (bucket_id = 'events');

drop policy if exists "storage_events_update_all" on storage.objects;
create policy "storage_events_update_all"
on storage.objects
for update
to public
using (bucket_id = 'events')
with check (bucket_id = 'events');

drop policy if exists "storage_events_delete_all" on storage.objects;
create policy "storage_events_delete_all"
on storage.objects
for delete
to public
using (bucket_id = 'events');

