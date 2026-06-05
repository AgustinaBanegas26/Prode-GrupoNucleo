-- SETUP COMPLETO (pegá TODO este archivo en Supabase > SQL Editor y ejecutá una sola vez)
-- Crea: matches + slider + news + rewards + events + image_assets + predictions/ranking_cache + push/outbox
--
-- Nota: es idempotente (usa IF NOT EXISTS + DO blocks).
-- Nota RLS: policies permisivas para que funcione con anon key y login legacy.

-- =====================================================================
-- 000) USERS
-- =====================================================================
create table if not exists public.users (
  id text primary key,
  numero_empleado text not null unique,
  nombre text not null,
  apellido text not null,
  email text,
  empresa text,
  rol text not null check (rol in ('usuario', 'admin')) default 'usuario',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_numero_empleado_idx on public.users(numero_empleado);
create index if not exists users_activo_idx on public.users(activo);
create index if not exists users_rol_idx on public.users(rol);

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'users'
  ) then
    alter publication supabase_realtime add table public.users;
  end if;
end $$;

alter table public.users enable row level security;
drop policy if exists "users_select_all" on public.users;
create policy "users_select_all" on public.users for select to public using (true);
drop policy if exists "users_insert_all" on public.users;
create policy "users_insert_all" on public.users for insert to public with check (true);
drop policy if exists "users_update_all" on public.users;
create policy "users_update_all" on public.users for update to public using (true) with check (true);
drop policy if exists "users_delete_all" on public.users;
create policy "users_delete_all" on public.users for delete to public using (true);

-- =====================================================================
-- 001) MATCHES
-- =====================================================================
-- Matches (fixture/resultados) + índices + Realtime
create table if not exists public.matches (
  fixture_id    int primary key,
  home_team     text not null,
  away_team     text not null,
  home_logo     text,
  away_logo     text,
  home_goals    int,
  away_goals    int,
  status        text not null default 'NS',
  match_date    timestamptz not null,
  round         text,
  venue         text,
  updated_at    timestamptz default now()
);

create index if not exists matches_status_idx on public.matches(status);
create index if not exists matches_date_idx on public.matches(match_date);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;

-- =====================================================================
-- Helper: updated_at trigger function (reutilizable)
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================================
-- 002) SLIDER + BUCKET + RLS + REALTIME
-- =====================================================================
create table if not exists public.slider_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
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

drop trigger if exists trg_slider_slides_updated_at on public.slider_slides;
create trigger trg_slider_slides_updated_at
before update on public.slider_slides
for each row execute function public.set_updated_at();

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

insert into storage.buckets (id, name, public)
values ('slider', 'slider', true)
on conflict (id) do nothing;

alter table public.slider_slides enable row level security;
drop policy if exists "slider_slides_select_all" on public.slider_slides;
create policy "slider_slides_select_all" on public.slider_slides for select to public using (true);
drop policy if exists "slider_slides_insert_all" on public.slider_slides;
create policy "slider_slides_insert_all" on public.slider_slides for insert to public with check (true);
drop policy if exists "slider_slides_update_all" on public.slider_slides;
create policy "slider_slides_update_all" on public.slider_slides for update to public using (true) with check (true);
drop policy if exists "slider_slides_delete_all" on public.slider_slides;
create policy "slider_slides_delete_all" on public.slider_slides for delete to public using (true);

alter table storage.objects enable row level security;
drop policy if exists "storage_slider_select_all" on storage.objects;
create policy "storage_slider_select_all" on storage.objects for select to public using (bucket_id = 'slider');
drop policy if exists "storage_slider_insert_all" on storage.objects;
create policy "storage_slider_insert_all" on storage.objects for insert to public with check (bucket_id = 'slider');
drop policy if exists "storage_slider_update_all" on storage.objects;
create policy "storage_slider_update_all" on storage.objects for update to public using (bucket_id = 'slider') with check (bucket_id = 'slider');
drop policy if exists "storage_slider_delete_all" on storage.objects;
create policy "storage_slider_delete_all" on storage.objects for delete to public using (bucket_id = 'slider');

-- =====================================================================
-- 003) NEWS + BUCKET + RLS + REALTIME
-- =====================================================================
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_path text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_status_idx on public.news(status);
create index if not exists news_published_at_idx on public.news(published_at desc);

drop trigger if exists trg_news_updated_at on public.news;
create trigger trg_news_updated_at
before update on public.news
for each row execute function public.set_updated_at();

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

insert into storage.buckets (id, name, public)
values ('news', 'news', true)
on conflict (id) do nothing;

alter table public.news enable row level security;
drop policy if exists "news_select_all" on public.news;
create policy "news_select_all" on public.news for select to public using (true);
drop policy if exists "news_insert_all" on public.news;
create policy "news_insert_all" on public.news for insert to public with check (true);
drop policy if exists "news_update_all" on public.news;
create policy "news_update_all" on public.news for update to public using (true) with check (true);
drop policy if exists "news_delete_all" on public.news;
create policy "news_delete_all" on public.news for delete to public using (true);

drop policy if exists "storage_news_select_all" on storage.objects;
create policy "storage_news_select_all" on storage.objects for select to public using (bucket_id = 'news');
drop policy if exists "storage_news_insert_all" on storage.objects;
create policy "storage_news_insert_all" on storage.objects for insert to public with check (bucket_id = 'news');
drop policy if exists "storage_news_update_all" on storage.objects;
create policy "storage_news_update_all" on storage.objects for update to public using (bucket_id = 'news') with check (bucket_id = 'news');
drop policy if exists "storage_news_delete_all" on storage.objects;
create policy "storage_news_delete_all" on storage.objects for delete to public using (bucket_id = 'news');

-- =====================================================================
-- 004) REWARDS + BUCKET + RLS + REALTIME
-- =====================================================================
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_path text not null,
  points_required int not null default 0,
  stock int,
  is_active boolean not null default true,
  sort_order int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rewards_is_active_idx on public.rewards(is_active);
create index if not exists rewards_sort_order_idx on public.rewards(sort_order);

drop trigger if exists trg_rewards_updated_at on public.rewards;
create trigger trg_rewards_updated_at
before update on public.rewards
for each row execute function public.set_updated_at();

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

insert into storage.buckets (id, name, public)
values ('rewards', 'rewards', true)
on conflict (id) do nothing;

alter table public.rewards enable row level security;
drop policy if exists "rewards_select_all" on public.rewards;
create policy "rewards_select_all" on public.rewards for select to public using (true);
drop policy if exists "rewards_insert_all" on public.rewards;
create policy "rewards_insert_all" on public.rewards for insert to public with check (true);
drop policy if exists "rewards_update_all" on public.rewards;
create policy "rewards_update_all" on public.rewards for update to public using (true) with check (true);
drop policy if exists "rewards_delete_all" on public.rewards;
create policy "rewards_delete_all" on public.rewards for delete to public using (true);

drop policy if exists "storage_rewards_select_all" on storage.objects;
create policy "storage_rewards_select_all" on storage.objects for select to public using (bucket_id = 'rewards');
drop policy if exists "storage_rewards_insert_all" on storage.objects;
create policy "storage_rewards_insert_all" on storage.objects for insert to public with check (bucket_id = 'rewards');
drop policy if exists "storage_rewards_update_all" on storage.objects;
create policy "storage_rewards_update_all" on storage.objects for update to public using (bucket_id = 'rewards') with check (bucket_id = 'rewards');
drop policy if exists "storage_rewards_delete_all" on storage.objects;
create policy "storage_rewards_delete_all" on storage.objects for delete to public using (bucket_id = 'rewards');

-- =====================================================================
-- 005) EVENTS + BUCKET + RLS + REALTIME
-- =====================================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  location text,
  start_at timestamptz,
  end_at timestamptz,
  image_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_is_published_idx on public.events(is_published);
create index if not exists events_start_at_idx on public.events(start_at);

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

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

insert into storage.buckets (id, name, public)
values ('events', 'events', true)
on conflict (id) do nothing;

alter table public.events enable row level security;
drop policy if exists "events_select_all" on public.events;
create policy "events_select_all" on public.events for select to public using (true);
drop policy if exists "events_insert_all" on public.events;
create policy "events_insert_all" on public.events for insert to public with check (true);
drop policy if exists "events_update_all" on public.events;
create policy "events_update_all" on public.events for update to public using (true) with check (true);
drop policy if exists "events_delete_all" on public.events;
create policy "events_delete_all" on public.events for delete to public using (true);

drop policy if exists "storage_events_select_all" on storage.objects;
create policy "storage_events_select_all" on storage.objects for select to public using (bucket_id = 'events');
drop policy if exists "storage_events_insert_all" on storage.objects;
create policy "storage_events_insert_all" on storage.objects for insert to public with check (bucket_id = 'events');
drop policy if exists "storage_events_update_all" on storage.objects;
create policy "storage_events_update_all" on storage.objects for update to public using (bucket_id = 'events') with check (bucket_id = 'events');
drop policy if exists "storage_events_delete_all" on storage.objects;
create policy "storage_events_delete_all" on storage.objects for delete to public using (bucket_id = 'events');

-- =====================================================================
-- 006) IMAGE ASSETS + BUCKET + RLS + REALTIME
-- =====================================================================
create table if not exists public.image_assets (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  label text not null default '',
  image_path text not null,
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

drop trigger if exists trg_image_assets_updated_at on public.image_assets;
create trigger trg_image_assets_updated_at
before update on public.image_assets
for each row execute function public.set_updated_at();

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

insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

alter table public.image_assets enable row level security;
drop policy if exists "image_assets_select_all" on public.image_assets;
create policy "image_assets_select_all" on public.image_assets for select to public using (true);
drop policy if exists "image_assets_insert_all" on public.image_assets;
create policy "image_assets_insert_all" on public.image_assets for insert to public with check (true);
drop policy if exists "image_assets_update_all" on public.image_assets;
create policy "image_assets_update_all" on public.image_assets for update to public using (true) with check (true);
drop policy if exists "image_assets_delete_all" on public.image_assets;
create policy "image_assets_delete_all" on public.image_assets for delete to public using (true);

drop policy if exists "storage_assets_select_all" on storage.objects;
create policy "storage_assets_select_all" on storage.objects for select to public using (bucket_id = 'assets');
drop policy if exists "storage_assets_insert_all" on storage.objects;
create policy "storage_assets_insert_all" on storage.objects for insert to public with check (bucket_id = 'assets');
drop policy if exists "storage_assets_update_all" on storage.objects;
create policy "storage_assets_update_all" on storage.objects for update to public using (bucket_id = 'assets') with check (bucket_id = 'assets');
drop policy if exists "storage_assets_delete_all" on storage.objects;
create policy "storage_assets_delete_all" on storage.objects for delete to public using (bucket_id = 'assets');

-- =====================================================================
-- 007) PREDICTIONS + RANKING_CACHE + REALTIME + RLS
-- =====================================================================
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  fixture_id int not null references public.matches(fixture_id) on delete cascade,
  cliente_id text not null,
  home_goals int,
  away_goals int,
  pick text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fixture_id, cliente_id)
);

create index if not exists predictions_cliente_id_idx on public.predictions(cliente_id);
create index if not exists predictions_fixture_id_idx on public.predictions(fixture_id);

drop trigger if exists trg_predictions_updated_at on public.predictions;
create trigger trg_predictions_updated_at
before update on public.predictions
for each row execute function public.set_updated_at();

create table if not exists public.ranking_cache (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'general',
  cliente_id text not null,
  points int not null default 0,
  played int not null default 0,
  diff int not null default 0,
  updated_at timestamptz not null default now(),
  unique (scope, cliente_id)
);

create index if not exists ranking_cache_scope_points_idx on public.ranking_cache(scope, points desc);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'predictions'
  ) then
    alter publication supabase_realtime add table public.predictions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ranking_cache'
  ) then
    alter publication supabase_realtime add table public.ranking_cache;
  end if;
end $$;

alter table public.predictions enable row level security;
alter table public.ranking_cache enable row level security;

drop policy if exists "predictions_select_all" on public.predictions;
create policy "predictions_select_all" on public.predictions for select to public using (true);
drop policy if exists "predictions_insert_all" on public.predictions;
create policy "predictions_insert_all" on public.predictions for insert to public with check (true);
drop policy if exists "predictions_update_all" on public.predictions;
create policy "predictions_update_all" on public.predictions for update to public using (true) with check (true);
drop policy if exists "predictions_delete_all" on public.predictions;
create policy "predictions_delete_all" on public.predictions for delete to public using (true);

drop policy if exists "ranking_cache_select_all" on public.ranking_cache;
create policy "ranking_cache_select_all" on public.ranking_cache for select to public using (true);
drop policy if exists "ranking_cache_insert_all" on public.ranking_cache;
create policy "ranking_cache_insert_all" on public.ranking_cache for insert to public with check (true);
drop policy if exists "ranking_cache_update_all" on public.ranking_cache;
create policy "ranking_cache_update_all" on public.ranking_cache for update to public using (true) with check (true);
drop policy if exists "ranking_cache_delete_all" on public.ranking_cache;
create policy "ranking_cache_delete_all" on public.ranking_cache for delete to public using (true);

-- =====================================================================
-- 008) PUSH TOKENS + OUTBOX + REALTIME + RLS
-- =====================================================================
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_role text not null check (user_role in ('client', 'admin')),
  cliente_id text,
  admin_id text,
  expo_push_token text not null,
  device_id text,
  device_platform text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (expo_push_token)
);

create index if not exists push_tokens_role_idx on public.push_tokens(user_role);
create index if not exists push_tokens_cliente_id_idx on public.push_tokens(cliente_id);
create index if not exists push_tokens_admin_id_idx on public.push_tokens(admin_id);

create table if not exists public.notifications_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  audience text not null default 'global' check (audience in ('global', 'group', 'individual')),
  target_group text,
  target_user_id text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists notifications_outbox_status_idx on public.notifications_outbox(status);
create index if not exists notifications_outbox_created_at_idx on public.notifications_outbox(created_at desc);

drop trigger if exists trg_push_tokens_updated_at on public.push_tokens;
create trigger trg_push_tokens_updated_at
before update on public.push_tokens
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications_outbox'
  ) then
    alter publication supabase_realtime add table public.notifications_outbox;
  end if;
end $$;

alter table public.push_tokens enable row level security;
alter table public.notifications_outbox enable row level security;

drop policy if exists "push_tokens_select_all" on public.push_tokens;
create policy "push_tokens_select_all" on public.push_tokens for select to public using (true);
drop policy if exists "push_tokens_upsert_all" on public.push_tokens;
create policy "push_tokens_upsert_all" on public.push_tokens for insert to public with check (true);
drop policy if exists "push_tokens_update_all" on public.push_tokens;
create policy "push_tokens_update_all" on public.push_tokens for update to public using (true) with check (true);
drop policy if exists "push_tokens_delete_all" on public.push_tokens;
create policy "push_tokens_delete_all" on public.push_tokens for delete to public using (true);

drop policy if exists "notifications_outbox_select_all" on public.notifications_outbox;
create policy "notifications_outbox_select_all" on public.notifications_outbox for select to public using (true);
drop policy if exists "notifications_outbox_insert_all" on public.notifications_outbox;
create policy "notifications_outbox_insert_all" on public.notifications_outbox for insert to public with check (true);
drop policy if exists "notifications_outbox_update_all" on public.notifications_outbox;
create policy "notifications_outbox_update_all" on public.notifications_outbox for update to public using (true) with check (true);
drop policy if exists "notifications_outbox_delete_all" on public.notifications_outbox;
create policy "notifications_outbox_delete_all" on public.notifications_outbox for delete to public using (true);

