-- Consultas de verificación (no modifica nada).
-- Pegá esto en Supabase SQL Editor para confirmar que TODO quedó creado y habilitado.

-- Tablas
select
  to_regclass('public.slider_slides') as slider_slides,
  to_regclass('public.news') as news,
  to_regclass('public.rewards') as rewards,
  to_regclass('public.events') as events,
  to_regclass('public.image_assets') as image_assets,
  to_regclass('public.predictions') as predictions,
  to_regclass('public.ranking_cache') as ranking_cache,
  to_regclass('public.push_tokens') as push_tokens,
  to_regclass('public.notifications_outbox') as notifications_outbox;

-- Buckets
select id, name, public
from storage.buckets
where id in ('slider', 'news', 'rewards', 'events', 'assets')
order by id;

-- RLS habilitado por tabla
select
  c.relname as table,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('slider_slides', 'news', 'rewards', 'events', 'image_assets', 'predictions', 'ranking_cache', 'push_tokens', 'notifications_outbox')
order by c.relname;

-- Policies
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where (schemaname = 'public' and tablename in ('slider_slides', 'news', 'rewards', 'events', 'image_assets', 'predictions', 'ranking_cache', 'push_tokens', 'notifications_outbox'))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- Realtime habilitado
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
order by tablename;

