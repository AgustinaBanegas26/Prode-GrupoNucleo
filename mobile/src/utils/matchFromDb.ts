import type { MatchRow } from '../features/content/api/matches';
import type { NormalizedMatch } from '../services/apiFootball.types';

const TEAM_CODES: Record<string, string> = {
  Argentina: 'ARG',
  Brasil: 'BRA',
  Brazil: 'BRA',
  Uruguay: 'URU',
  Chile: 'CHI',
  Colombia: 'COL',
  México: 'MEX',
  Mexico: 'MEX',
  España: 'ESP',
  Spain: 'ESP',
  Alemania: 'GER',
  Germany: 'GER',
  Francia: 'FRA',
  France: 'FRA',
  Italia: 'ITA',
  Italy: 'ITA',
  Inglaterra: 'ENG',
  England: 'ENG',
  'Estados Unidos': 'USA',
  'United States': 'USA',
};

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function teamCode(name: string): string {
  return TEAM_CODES[name] ?? name.slice(0, 3).toUpperCase();
}

function isFinishedStatus(status: string): boolean {
  return status === 'FT' || status === 'AET' || status === 'PEN';
}

export function isDbOnlyFixture(fixtureId: number): boolean {
  return fixtureId >= 900000;
}

export function matchRowToNormalized(row: MatchRow): NormalizedMatch {
  const d = new Date(row.match_date);
  const isoDate = d.toISOString().slice(0, 10);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const date = `${d.getDate()} ${MONTHS[d.getMonth()] ?? 'Jun'}`;
  const finished = isFinishedStatus(row.status);

  return {
    id: row.fixture_id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeLogo: row.home_logo ?? '',
    awayLogo: row.away_logo ?? '',
    homeCode: teamCode(row.home_team),
    awayCode: teamCode(row.away_team),
    homeScore: row.home_goals,
    awayScore: row.away_goals,
    date,
    isoDate,
    utcDate: d.toISOString(),
    time,
    stadium: row.venue ?? '',
    city: '',
    status: (row.status as NormalizedMatch['status']) ?? 'NS',
    statusLong: row.status,
    elapsed: null,
    round: row.round ?? '',
    group: row.round === 'TEST' ? 'Prueba' : row.round,
    phase: row.round === 'TEST' ? 'Partido de prueba' : (row.round ?? 'Fase de grupos'),
    isLive: row.status === 'LIVE' || row.status === '1H' || row.status === '2H',
    isFinished: finished,
  };
}

export function mergeFixturesWithDb(
  apiMatches: NormalizedMatch[],
  dbMatches: MatchRow[],
): NormalizedMatch[] {
  const apiIds = new Set(apiMatches.map((m) => m.id));
  const extra = dbMatches
    .filter((row) => !apiIds.has(row.fixture_id))
    .map(matchRowToNormalized);

  return [...extra, ...apiMatches].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
  );
}
