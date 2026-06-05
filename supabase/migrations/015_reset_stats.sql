-- =====================================================================
-- 015) RESET STATS — función que limpia estadísticas sin tocar usuarios
-- Ejecutar en: Supabase → SQL Editor
-- NUNCA elimina registros de clientes, admins ni auth.users
-- =====================================================================

create or replace function public.reset_all_stats()
returns void
language plpgsql
security definer
as $$
begin
  -- 1. Vaciar scores
  delete from public.scores;

  -- 2. Vaciar ranking_cache
  delete from public.ranking_cache;

  -- 3. Vaciar predictions
  delete from public.predictions;

  -- 4. Vaciar historial de notificaciones (NO la tabla notification_settings)
  delete from public.notifications;

  -- 5. Vaciar notification_log (dedup de push)
  delete from public.notification_log;

  -- 6. Resetear resultados de partidos — solo home_goals, away_goals y status
  --    NO se toca: fixture_id, home_team, away_team, logos, match_date, round, venue
  update public.matches
  set
    home_goals  = null,
    away_goals  = null,
    status      = 'NS',
    updated_at  = now();

  -- 7. Resetear campos estadísticos en tabla ranking (si existe)
  --    NO se elimina ningún registro; solo se zerean los puntos
  do $inner$
  begin
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'ranking'
    ) then
      update public.ranking
      set
        total_points   = 0,
        total_played   = 0,
        correct_exact  = 0,
        correct_winner = 0,
        position       = null,
        updated_at     = now();
    end if;
  end $inner$;

  -- 8. NO se toca: clientes, admins, auth.users, scoring_config,
  --    slider_slides, app_versions, push_tokens, notifications_outbox,
  --    notification_settings, rewards, news, events, image_assets
end;
$$;

-- Conceder ejecución solo a service_role (el backend usa service_role)
revoke execute on function public.reset_all_stats() from public, anon, authenticated;
grant execute on function public.reset_all_stats() to service_role;
