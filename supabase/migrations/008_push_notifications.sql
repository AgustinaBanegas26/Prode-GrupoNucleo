-- Push: tokens Expo + outbox de notificaciones (para automatización)
-- Nota: el envío real lo harás desde Edge Function o backend (service_role) usando Expo Push API.

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_role text not null check (user_role in ('client', 'admin')),
  cliente_id text,
  admin_id text,
  expo_push_token text not null,
  device_id text,
  device_platform text, -- ios/android/web
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (expo_push_token)
);

create index if not exists push_tokens_role_idx on public.push_tokens(user_role);
create index if not exists push_tokens_cliente_id_idx on public.push_tokens(cliente_id);
create index if not exists push_tokens_admin_id_idx on public.push_tokens(admin_id);

-- Outbox: se llena automáticamente por triggers (news/rewards/events/matches/etc) o desde admin actions.
create table if not exists public.notifications_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null, -- ej: 'news_created', 'news_published', 'match_published', 'result_updated', etc.
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

-- updated_at helper (si no existe, lo crea) para push_tokens
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_push_tokens_updated_at on public.push_tokens;
create trigger trg_push_tokens_updated_at
before update on public.push_tokens
for each row execute function public.set_updated_at();

-- Realtime (idempotente) - útil para que el admin vea historial/estado sin refresh
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications_outbox'
  ) then
    alter publication supabase_realtime add table public.notifications_outbox;
  end if;
end $$;

-- RLS (permisiva por ahora)
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

