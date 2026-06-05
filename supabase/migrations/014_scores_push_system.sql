-- Scores, scoring config, notification settings, prediction locks, ranking tie-break

-- ── Scoring config (single row) ─────────────────────────────────────────────
create table if not exists public.scoring_config (
  id int primary key default 1 check (id = 1),
  points_exact int not null default 3,
  points_winner int not null default 1,
  points_draw int not null default 1,
  updated_at timestamptz not null default now()
);

insert into public.scoring_config (id, points_exact, points_winner, points_draw)
values (1, 3, 1, 1)
on conflict (id) do nothing;

-- ── Notification settings ───────────────────────────────────────────────────
create table if not exists public.notification_settings (
  id int primary key default 1 check (id = 1),
  daily_reminder_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.notification_settings (id, daily_reminder_enabled)
values (1, true)
on conflict (id) do nothing;

-- ── Scores per prediction ───────────────────────────────────────────────────
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  cliente_id text not null,
  match_id int not null references public.matches(fixture_id) on delete cascade,
  prediction_id uuid references public.predictions(id) on delete set null,
  points_earned int not null default 0,
  result_type text not null check (result_type in ('exact', 'winner', 'draw', 'wrong')),
  calculated_at timestamptz not null default now(),
  unique (prediction_id)
);

create index if not exists scores_cliente_id_idx on public.scores(cliente_id);
create index if not exists scores_match_id_idx on public.scores(match_id);

-- ── Extend predictions ────────────────────────────────────────────────────────
alter table public.predictions
  add column if not exists locked boolean not null default false,
  add column if not exists points_earned int not null default 0,
  add column if not exists result_type text;

-- ── Match notification dedup ──────────────────────────────────────────────────
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  fixture_id int,
  cliente_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists notification_log_dedup_idx
  on public.notification_log (event_type, coalesce(fixture_id::text, ''), coalesce(cliente_id, ''));

-- ── Notifications history (admin panel) ───────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'global' check (audience in ('global', 'group', 'individual')),
  target_group text,
  target_user_id text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists notifications_sent_at_idx on public.notifications(sent_at desc);

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'scores'
  ) then
    alter publication supabase_realtime add table public.scores;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'scoring_config'
  ) then
    alter publication supabase_realtime add table public.scoring_config;
  end if;
end $$;

alter table public.scoring_config enable row level security;
alter table public.notification_settings enable row level security;
alter table public.scores enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_log enable row level security;

drop policy if exists "scoring_config_select_all" on public.scoring_config;
create policy "scoring_config_select_all" on public.scoring_config for select to public using (true);
drop policy if exists "scoring_config_update_all" on public.scoring_config;
create policy "scoring_config_update_all" on public.scoring_config for update to public using (true) with check (true);

drop policy if exists "notification_settings_select_all" on public.notification_settings;
create policy "notification_settings_select_all" on public.notification_settings for select to public using (true);
drop policy if exists "notification_settings_update_all" on public.notification_settings;
create policy "notification_settings_update_all" on public.notification_settings for update to public using (true) with check (true);

drop policy if exists "scores_select_all" on public.scores;
create policy "scores_select_all" on public.scores for select to public using (true);
drop policy if exists "scores_insert_all" on public.scores;
create policy "scores_insert_all" on public.scores for insert to public with check (true);
drop policy if exists "scores_update_all" on public.scores;
create policy "scores_update_all" on public.scores for update to public using (true) with check (true);
drop policy if exists "scores_delete_all" on public.scores;
create policy "scores_delete_all" on public.scores for delete to public using (true);

drop policy if exists "notifications_select_all" on public.notifications;
create policy "notifications_select_all" on public.notifications for select to public using (true);
drop policy if exists "notifications_insert_all" on public.notifications;
create policy "notifications_insert_all" on public.notifications for insert to public with check (true);
drop policy if exists "notifications_delete_all" on public.notifications;
create policy "notifications_delete_all" on public.notifications for delete to public using (true);

drop policy if exists "notification_log_all" on public.notification_log;
create policy "notification_log_all" on public.notification_log for all to public using (true) with check (true);

-- Extend ranking_cache for exact results tie-break
alter table public.ranking_cache
  add column if not exists exact_hits int not null default 0;

-- ── Calculate points for one prediction ─────────────────────────────────────
create or replace function public.calc_prediction_points(
  p_home_goals int,
  p_away_goals int,
  p_pred_home int,
  p_pred_away int,
  p_points_exact int,
  p_points_winner int,
  p_points_draw int
)
returns table(points int, result_type text) as $$
declare
  actual_winner text;
  pred_winner text;
begin
  if p_pred_home is null or p_pred_away is null then
    return query select 0, 'wrong'::text;
    return;
  end if;

  if p_pred_home = p_home_goals and p_pred_away = p_away_goals then
    return query select p_points_exact, 'exact'::text;
    return;
  end if;

  if p_home_goals = p_away_goals and p_pred_home = p_pred_away then
    return query select p_points_draw, 'draw'::text;
    return;
  end if;

  actual_winner := case
    when p_home_goals > p_away_goals then 'home'
    when p_home_goals < p_away_goals then 'away'
    else 'draw'
  end;

  pred_winner := case
    when p_pred_home > p_pred_away then 'home'
    when p_pred_home < p_pred_away then 'away'
    else 'draw'
  end;

  if actual_winner = pred_winner then
    return query select p_points_winner, 'winner'::text;
    return;
  end if;

  return query select 0, 'wrong'::text;
end;
$$ language plpgsql immutable;

-- ── Calculate all scores for a finished match ───────────────────────────────
create or replace function public.calculate_match_scores(p_fixture_id int)
returns void as $$
declare
  m record;
  cfg record;
  pred record;
  calc record;
begin
  select home_goals, away_goals, home_team, away_team
  into m
  from public.matches
  where fixture_id = p_fixture_id;

  if m.home_goals is null or m.away_goals is null then
    return;
  end if;

  select * into cfg from public.scoring_config where id = 1;

  for pred in
    select * from public.predictions where fixture_id = p_fixture_id
  loop
    select * into calc from public.calc_prediction_points(
      m.home_goals,
      m.away_goals,
      pred.home_goals,
      pred.away_goals,
      cfg.points_exact,
      cfg.points_winner,
      cfg.points_draw
    );

    insert into public.scores (
      cliente_id, user_id, match_id, prediction_id, points_earned, result_type, calculated_at
    )
    values (
      pred.cliente_id,
      pred.cliente_id,
      p_fixture_id,
      pred.id,
      calc.points,
      calc.result_type,
      now()
    )
    on conflict (prediction_id) do update set
      points_earned = excluded.points_earned,
      result_type = excluded.result_type,
      calculated_at = now();

    update public.predictions
    set points_earned = calc.points, result_type = calc.result_type
    where id = pred.id;
  end loop;

  perform public.recalculate_ranking_cache();
end;
$$ language plpgsql;

-- ── Recalculate ranking (tie-break: exact hits) ───────────────────────────────
create or replace function public.recalculate_ranking_cache()
returns void as $$
begin
  insert into public.ranking_cache (scope, cliente_id, points, played, diff, exact_hits, updated_at)
  select
    'general',
    s.cliente_id,
    coalesce(sum(s.points_earned), 0),
    count(*)::int,
    coalesce(sum(s.points_earned), 0),
    count(*) filter (where s.result_type = 'exact')::int,
    now()
  from public.scores s
  group by s.cliente_id
  on conflict (scope, cliente_id) do update set
    points = excluded.points,
    played = excluded.played,
    diff = excluded.points,
    exact_hits = excluded.exact_hits,
    updated_at = now();
end;
$$ language plpgsql;

-- ── Trigger: auto score when match result saved ─────────────────────────────
create or replace function public.trg_matches_calculate_scores()
returns trigger as $$
begin
  if new.home_goals is not null and new.away_goals is not null
     and (old.home_goals is distinct from new.home_goals or old.away_goals is distinct from new.away_goals) then
    perform public.calculate_match_scores(new.fixture_id);

    insert into public.notifications_outbox (event_type, title, body, data, audience)
    select
      'result_updated',
      '✅ Resultado cargado',
      format('✅ Resultado cargado: %s %s - %s %s. ¡Mirá tus puntos!', new.home_team, new.home_goals, new.away_goals, new.away_team),
      jsonb_build_object('fixture_id', new.fixture_id),
      'global'
    where not exists (
      select 1 from public.notification_log nl
      where nl.event_type = 'result_updated' and nl.fixture_id = new.fixture_id
    );

    insert into public.notification_log (event_type, fixture_id)
    values ('result_updated', new.fixture_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_matches_calculate_scores on public.matches;
create trigger trg_matches_calculate_scores
after update on public.matches
for each row execute function public.trg_matches_calculate_scores();

-- ── Lock predictions 10 min before kickoff ────────────────────────────────────
create or replace function public.lock_predictions_for_fixture(p_fixture_id int)
returns void as $$
begin
  update public.predictions
  set locked = true
  where fixture_id = p_fixture_id and locked = false;
end;
$$ language plpgsql;
