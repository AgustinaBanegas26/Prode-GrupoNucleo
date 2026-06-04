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

-- Índices útiles
create index if not exists matches_status_idx on public.matches(status);
create index if not exists matches_date_idx on public.matches(match_date);

-- Habilitar Realtime
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
