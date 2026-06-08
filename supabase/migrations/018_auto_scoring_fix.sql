-- Fix scoring automático: columnas reales de predictions + ranking + trigger en INSERT

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'ranking'
  ) and not exists (
    select 1 from pg_constraint where conname = 'ranking_cliente_id_key'
  ) then
    alter table public.ranking add constraint ranking_cliente_id_key unique (cliente_id);
  end if;
end $$;

create or replace function public.recalculate_ranking()
returns void as $$
begin
  insert into public.ranking (
    cliente_id, nombre, total_points, total_played, correct_exact, correct_winner, position, updated_at
  )
  select
    s.cliente_id,
    coalesce(c.nombre, 'Cliente ' || s.cliente_id),
    coalesce(sum(s.points_earned), 0),
    count(*)::int,
    count(*) filter (where s.result_type = 'exact')::int,
    count(*) filter (where s.result_type in ('winner', 'draw'))::int,
    0,
    now()
  from public.scores s
  left join public.clientes c on c.cliente_id = s.cliente_id
  group by s.cliente_id, c.nombre
  on conflict (cliente_id) do update set
    nombre         = excluded.nombre,
    total_points   = excluded.total_points,
    total_played   = excluded.total_played,
    correct_exact  = excluded.correct_exact,
    correct_winner = excluded.correct_winner,
    updated_at     = now();

  with ranked as (
    select cliente_id,
           row_number() over (order by total_points desc, correct_exact desc) as pos
    from public.ranking
  )
  update public.ranking r
  set position = ranked.pos
  from ranked
  where r.cliente_id = ranked.cliente_id;
end;
$$ language plpgsql;

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
      pred.score_home,
      pred.score_away,
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
    set
      points_earned = calc.points,
      result_type = calc.result_type,
      status = case
        when calc.result_type = 'exact' then 'correct'
        when calc.result_type in ('winner', 'draw') then 'partial'
        else 'incorrect'
      end
    where id = pred.id;
  end loop;

  perform public.recalculate_ranking_cache();
  perform public.recalculate_ranking();
end;
$$ language plpgsql;

create or replace function public.trg_matches_calculate_scores()
returns trigger as $$
begin
  if new.home_goals is not null and new.away_goals is not null then
    if tg_op = 'INSERT'
       or old.home_goals is distinct from new.home_goals
       or old.away_goals is distinct from new.away_goals then
      perform public.calculate_match_scores(new.fixture_id);
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_matches_calculate_scores on public.matches;
create trigger trg_matches_calculate_scores
after insert or update on public.matches
for each row execute function public.trg_matches_calculate_scores();
