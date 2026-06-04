create table if not exists matches (
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
create index if not exists matches_status_idx on matches(status);
create index if not exists matches_date_idx on matches(match_date);

-- Habilitar Realtime
alter publication supabase_realtime add table matches;

