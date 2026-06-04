// ─────────────────────────────────────────────────────────────
// Tipos  API-Football v3  (v3.football.api-sports.io)
// Copa Mundial FIFA 2026 → league = 1, season = 2026
// ─────────────────────────────────────────────────────────────

/** Identificadores fijos del torneo */
export const WC_LEAGUE_ID = 1;
export const WC_SEASON    = 2026;

// ── Envelope genérico ─────────────────────────────────────────
export interface ApiResponse<T> {
  get:        string;
  parameters: Record<string, string | number>;
  errors:     Record<string, string> | string[];
  results:    number;
  paging:     { current: number; total: number };
  response:   T[];
}

// ── Equipo ────────────────────────────────────────────────────
export interface ApiTeam {
  id:       number;
  name:     string;
  code:     string | null;
  country:  string;
  logo:     string;
  national: boolean;
}
export interface ApiVenue { id: number | null; name: string; city: string }
export interface ApiTeamEntry { team: ApiTeam; venue: ApiVenue }

// ── League info dentro de fixture ────────────────────────────
export interface ApiLeagueInFixture {
  id:      number;
  name:    string;
  country: string;
  logo:    string;
  flag:    string | null;
  season:  number;
  round:   string;
}

// ── Fixture ───────────────────────────────────────────────────
export type MatchStatusShort =
  | 'TBD' | 'NS'
  | '1H' | 'HT' | '2H' | 'ET' | 'BT' | 'P'
  | 'SUSP' | 'INT'
  | 'FT' | 'AET' | 'PEN'
  | 'PST' | 'CANC' | 'ABD' | 'AWD' | 'WO' | 'LIVE';

export interface ApiFixtureInfo {
  id:        number;
  referee:   string | null;
  timezone:  string;
  date:      string;           // ISO 8601
  timestamp: number;
  periods:   { first: number | null; second: number | null };
  venue:     ApiVenue;
  status: {
    long:    string;
    short:   MatchStatusShort;
    elapsed: number | null;
  };
}

export interface ApiTeamInMatch {
  id:     number;
  name:   string;
  logo:   string;
  winner: boolean | null;
}

export interface ApiGoals { home: number | null; away: number | null }
export interface ApiScore {
  halftime:  ApiGoals;
  fulltime:  ApiGoals;
  extratime: ApiGoals;
  penalty:   ApiGoals;
}

export interface ApiFixture {
  fixture: ApiFixtureInfo;
  league:  ApiLeagueInFixture;
  teams:   { home: ApiTeamInMatch; away: ApiTeamInMatch };
  goals:   ApiGoals;
  score:   ApiScore;
}

// ── Standings ─────────────────────────────────────────────────
export interface ApiStandingTeam { id: number; name: string; logo: string }
export interface ApiStandingStats {
  played: number; win: number; draw: number; lose: number;
  goals: { for: number; against: number };
}
export interface ApiStandingEntry {
  rank:        number;
  team:        ApiStandingTeam;
  points:      number;
  goalsDiff:   number;
  group:       string;
  form:        string | null;
  status:      string;
  description: string | null;
  all:         ApiStandingStats;
  home:        ApiStandingStats;
  away:        ApiStandingStats;
  update:      string;
}
export interface ApiStandingsWrapper {
  league: {
    id:         number;
    name:       string;
    country:    string;
    logo:       string;
    flag:       string | null;
    season:     number;
    standings:  ApiStandingEntry[][];   // array de grupos
  };
}

// ── DTOs normalizados para la UI ──────────────────────────────
export interface NormalizedMatch {
  id:          number;
  homeTeam:    string;
  awayTeam:    string;
  homeLogo:    string;
  awayLogo:    string;
  homeCode:    string;
  awayCode:    string;
  homeScore:   number | null;
  awayScore:   number | null;
  date:        string;    // "11 Jun"
  isoDate:     string;    // "2026-06-11"
  time:        string;    // "15:00"
  stadium:     string;
  city:        string;
  status:      MatchStatusShort;
  statusLong:  string;
  elapsed:     number | null;
  round:       string;
  group:       string | null;   // "Group A" o null
  phase:       string;          // fase normalizada para la UI
  isLive:      boolean;
  isFinished:  boolean;
}

export interface NormalizedStanding {
  rank:        number;
  teamId:      number;
  teamName:    string;
  teamLogo:    string;
  points:      number;
  played:      number;
  won:         number;
  drawn:       number;
  lost:        number;
  goalsFor:    number;
  goalsAgainst:number;
  goalDiff:    number;
  group:       string;
  form:        string | null;
}

export interface NormalizedGroup {
  name:  string;              // "Group A"
  teams: NormalizedStanding[];
}
