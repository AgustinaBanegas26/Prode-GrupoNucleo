-- Bloqueo real de predicciones (10 min antes) + seed partido de prueba + RPC seguro

alter table public.predictions
  add column if not exists user_id text,
  add column if not exists pick_winner text,
  add column if not exists score_home int,
  add column if not exists score_away int,
  add column if not exists submitted_at timestamptz default now(),
  add column if not exists status text default 'pending',
  add column if not exists locked boolean not null default false,
  add column if not exists points_earned int not null default 0;

create or replace function public.get_match_lock_time(p_match_date timestamptz)
returns timestamptz
language sql
immutable
as $$
  select p_match_date - interval '10 minutes';
$$;

create or replace function public.is_prediction_locked_for_fixture(p_fixture_id int)
returns boolean
language plpgsql
stable
as $$
declare
  m_date timestamptz;
begin
  select match_date into m_date
  from public.matches
  where fixture_id = p_fixture_id;

  if m_date is null then
    return false;
  end if;

  return now() >= public.get_match_lock_time(m_date);
end;
$$;

create or replace function public.trg_predictions_enforce_lock()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.locked = true or public.is_prediction_locked_for_fixture(old.fixture_id) then
      raise exception 'PREDICTION_LOCKED: Las predicciones se cerraron 10 minutos antes del inicio del partido';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and new.locked = true and coalesce(old.locked, false) = false then
    return new;
  end if;

  if coalesce(new.locked, false) = true
     or public.is_prediction_locked_for_fixture(new.fixture_id) then
    raise exception 'PREDICTION_LOCKED: Las predicciones se cerraron 10 minutos antes del inicio del partido';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_predictions_enforce_lock on public.predictions;
create trigger trg_predictions_enforce_lock
before insert or update or delete on public.predictions
for each row execute function public.trg_predictions_enforce_lock();

create or replace function public.upsert_prediction_secure(
  p_user_id text,
  p_cliente_id text,
  p_fixture_id int,
  p_pick_winner text,
  p_score_home int,
  p_score_away int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pred_id uuid;
  now_ts timestamptz := now();
begin
  if p_score_home is null or p_score_away is null then
    raise exception 'INVALID_PREDICTION: Completá el resultado de ambos equipos';
  end if;

  if public.is_prediction_locked_for_fixture(p_fixture_id) then
    raise exception 'PREDICTION_LOCKED: Las predicciones se cerraron 10 minutos antes del inicio del partido';
  end if;

  if not exists (select 1 from public.matches where fixture_id = p_fixture_id) then
    raise exception 'MATCH_NOT_FOUND: El partido no existe en el sistema';
  end if;

  select id into pred_id
  from public.predictions
  where cliente_id = p_cliente_id
    and fixture_id = p_fixture_id
  limit 1;

  if pred_id is not null then
    update public.predictions
    set
      user_id = coalesce(p_user_id, user_id),
      pick_winner = p_pick_winner,
      score_home = p_score_home,
      score_away = p_score_away,
      submitted_at = now_ts,
      updated_at = now_ts
    where id = pred_id;
    return pred_id;
  end if;

  insert into public.predictions (
    user_id,
    cliente_id,
    fixture_id,
    pick_winner,
    score_home,
    score_away,
    points_earned,
    locked,
    status,
    submitted_at,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    p_cliente_id,
    p_fixture_id,
    p_pick_winner,
    p_score_home,
    p_score_away,
    0,
    false,
    'pending',
    now_ts,
    now_ts,
    now_ts
  )
  returning id into pred_id;

  return pred_id;
end;
$$;

create or replace function public.delete_prediction_secure(
  p_cliente_id text,
  p_prediction_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pred record;
begin
  select * into pred
  from public.predictions
  where id = p_prediction_id
    and cliente_id = p_cliente_id;

  if pred.id is null then
    raise exception 'PREDICTION_NOT_FOUND: Pronóstico no encontrado';
  end if;

  if pred.locked = true or public.is_prediction_locked_for_fixture(pred.fixture_id) then
    raise exception 'PREDICTION_LOCKED: Las predicciones se cerraron 10 minutos antes del inicio del partido';
  end if;

  delete from public.predictions where id = p_prediction_id;
end;
$$;

create or replace function public.seed_test_match()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  fid int := 999001;
  kickoff timestamptz := now() + interval '15 minutes';
begin
  insert into public.matches (
    fixture_id,
    home_team,
    away_team,
    home_goals,
    away_goals,
    status,
    match_date,
    round,
    venue,
    updated_at
  )
  values (
    fid,
    'Argentina',
    'Brasil',
    null,
    null,
    'NS',
    kickoff,
    'TEST',
    'Partido de prueba E2E',
    now()
  )
  on conflict (fixture_id) do update set
    home_team = excluded.home_team,
    away_team = excluded.away_team,
    home_goals = null,
    away_goals = null,
    status = 'NS',
    match_date = kickoff,
    round = 'TEST',
    venue = excluded.venue,
    updated_at = now();

  return fid;
end;
$$;

grant execute on function public.upsert_prediction_secure(text, text, int, text, int, int) to anon, authenticated, service_role;
grant execute on function public.delete_prediction_secure(text, uuid) to anon, authenticated, service_role;
grant execute on function public.seed_test_match() to anon, authenticated, service_role;
grant execute on function public.is_prediction_locked_for_fixture(int) to anon, authenticated, service_role;
