-- Premios (Admin -> Cliente) + Storage bucket + RLS + Realtime

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_path text not null, -- bucket 'rewards'

  points_required int not null default 0,
  stock int, -- null = ilimitado
  is_active boolean not null default true,
  sort_order int not null default 1,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rewards_is_active_idx on public.rewards(is_active);
create index if not exists rewards_sort_order_idx on public.rewards(sort_order);

-- updated_at automático (usa public.set_updated_at si ya existe; si no, lo crea)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_rewards_updated_at on public.rewards;
create trigger trg_rewards_updated_at
before update on public.rewards
for each row execute function public.set_updated_at();

-- Realtime (idempotente)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rewards'
  ) then
    alter publication supabase_realtime add table public.rewards;
  end if;
end $$;

-- Storage bucket público para imágenes de premios
insert into storage.buckets (id, name, public)
values ('rewards', 'rewards', true)
on conflict (id) do nothing;

-- RLS: tabla rewards (permisiva)
alter table public.rewards enable row level security;

drop policy if exists "rewards_select_all" on public.rewards;
create policy "rewards_select_all"
on public.rewards
for select
to public
using (true);

drop policy if exists "rewards_insert_all" on public.rewards;
create policy "rewards_insert_all"
on public.rewards
for insert
to public
with check (true);

drop policy if exists "rewards_update_all" on public.rewards;
create policy "rewards_update_all"
on public.rewards
for update
to public
using (true)
with check (true);

drop policy if exists "rewards_delete_all" on public.rewards;
create policy "rewards_delete_all"
on public.rewards
for delete
to public
using (true);

-- RLS: Storage (bucket rewards) (permisiva)
alter table storage.objects enable row level security;

drop policy if exists "storage_rewards_select_all" on storage.objects;
create policy "storage_rewards_select_all"
on storage.objects
for select
to public
using (bucket_id = 'rewards');

drop policy if exists "storage_rewards_insert_all" on storage.objects;
create policy "storage_rewards_insert_all"
on storage.objects
for insert
to public
with check (bucket_id = 'rewards');

drop policy if exists "storage_rewards_update_all" on storage.objects;
create policy "storage_rewards_update_all"
on storage.objects
for update
to public
using (bucket_id = 'rewards')
with check (bucket_id = 'rewards');

drop policy if exists "storage_rewards_delete_all" on storage.objects;
create policy "storage_rewards_delete_all"
on storage.objects
for delete
to public
using (bucket_id = 'rewards');

