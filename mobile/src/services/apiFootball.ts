// ─────────────────────────────────────────────────────────────
// Servicio API-Football v3
// Base URL: https://v3.football.api-sports.io/
// Copa Mundial FIFA 2026 → league=1, season=2026
// ─────────────────────────────────────────────────────────────

import type {
  ApiFixture,
  ApiResponse,
  ApiStandingsWrapper,
  ApiTeamEntry,
  MatchStatusShort,
  NormalizedGroup,
  NormalizedMatch,
  NormalizedStanding,
} from './apiFootball.types';
import { WC_LEAGUE_ID, WC_SEASON } from './apiFootball.types';

const BASE_URL = 'https://v3.football.api-sports.io';

function getApiKey(): string {
  return process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ?? '';
}

// ── Fetch base ────────────────────────────────────────────────
async function apiFetch<T>(path: string, params?: Record<string, string | number>): Promise<T[]> {
  const key = getApiKey();
  if (!key || key === 'TU_API_KEY_AQUI') {
    console.warn('[API-Football] API key no configurada. Editá .env → EXPO_PUBLIC_API_FOOTBALL_KEY');
    return [];
  }

  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-apisports-key': key,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`[API-Football] HTTP ${res.status} en ${path}`);
      return [];
    }

    const json = (await res.json()) as ApiResponse<T>;

    if (Array.isArray(json.errors) && json.errors.length > 0) {
      console.error('[API-Football] Errores de API:', json.errors);
      return [];
    }
    if (typeof json.errors === 'object' && Object.keys(json.errors).length > 0) {
      console.error('[API-Football] Errores de API:', json.errors);
      return [];
    }

    return json.response ?? [];
  } catch (err) {
    console.error(`[API-Football] Error de red en ${path}:`, err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// Normalización
// ─────────────────────────────────────────────────────────────

const LIVE_STATUSES: MatchStatusShort[] = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'];
const FINISHED_STATUSES: MatchStatusShort[] = ['FT', 'AET', 'PEN', 'AWD', 'WO'];

/** Convierte el round de la API en fase legible para la UI */
function normalizePhase(round: string): string {
  const r = round.toLowerCase();
  if (r.includes('group'))        return 'Fase de Grupos';
  if (r.includes('round of 32'))  return 'Dieciseisavos';
  if (r.includes('round of 16'))  return 'Octavos';
  if (r.includes('quarter'))      return 'Cuartos';
  if (r.includes('semi'))         return 'Semifinales';
  if (r.includes('3rd'))          return 'Tercer Puesto';
  if (r.includes('final'))        return 'Final';
  return round;
}

/** Extrae el grupo del round ("Group Stage - A" → "Grupo A") */
function extractGroup(round: string): string | null {
  const match = round.match(/group.*?[-–]\s*([A-L])\b/i);
  if (match) return `Grupo ${match[1].toUpperCase()}`;
  // fallback: "Group A"
  const match2 = round.match(/group\s+([A-L])\b/i);
  if (match2) return `Grupo ${match2[1].toUpperCase()}`;
  return null;
}

/** Código corto de 3 letras a partir del nombre del equipo */
function teamCode(name: string): string {
  if (!name) return '???';
  return name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || '???';
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  } catch {
    return isoDate;
  }
}

function formatTime(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

function normalizeFixture(f: ApiFixture): NormalizedMatch {
  const status = f.fixture.status.short;
  return {
    id:          f.fixture.id,
    homeTeam:    f.teams.home.name,
    awayTeam:    f.teams.away.name,
    homeLogo:    f.teams.home.logo,
    awayLogo:    f.teams.away.logo,
    homeCode:    teamCode(f.teams.home.name),
    awayCode:    teamCode(f.teams.away.name),
    homeScore:   f.goals.home,
    awayScore:   f.goals.away,
    date:        formatDate(f.fixture.date),
    isoDate:     f.fixture.date.split('T')[0],
    time:        formatTime(f.fixture.date),
    stadium:     f.fixture.venue.name ?? '',
    city:        f.fixture.venue.city ?? '',
    status,
    statusLong:  f.fixture.status.long,
    elapsed:     f.fixture.status.elapsed,
    round:       f.league.round,
    group:       extractGroup(f.league.round),
    phase:       normalizePhase(f.league.round),
    isLive:      LIVE_STATUSES.includes(status),
    isFinished:  FINISHED_STATUSES.includes(status),
  };
}

function normalizeStanding(entry: import('./apiFootball.types').ApiStandingEntry): NormalizedStanding {
  return {
    rank:         entry.rank,
    teamId:       entry.team.id,
    teamName:     entry.team.name,
    teamLogo:     entry.team.logo,
    points:       entry.points,
    played:       entry.all.played,
    won:          entry.all.win,
    drawn:        entry.all.draw,
    lost:         entry.all.lose,
    goalsFor:     entry.all.goals.for,
    goalsAgainst: entry.all.goals.against,
    goalDiff:     entry.goalsDiff,
    group:        entry.group,
    form:         entry.form ?? null,
  };
}

// ─────────────────────────────────────────────────────────────
// Funciones públicas del servicio
// ─────────────────────────────────────────────────────────────

/**
 * Todos los partidos del Mundial 2026.
 * Parámetros opcionales: from/to en formato "YYYY-MM-DD"
 */
export async function getFixtures(options?: {
  from?: string;
  to?: string;
  round?: string;
}): Promise<NormalizedMatch[]> {
  const params: Record<string, string | number> = {
    league: WC_LEAGUE_ID,
    season: WC_SEASON,
  };
  if (options?.from)  params.from  = options.from;
  if (options?.to)    params.to    = options.to;
  if (options?.round) params.round = options.round;

  const raw = await apiFetch<ApiFixture>('/fixtures', params);
  return raw.map(normalizeFixture).sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

/**
 * Partidos en vivo del Mundial 2026 ahora mismo.
 */
export async function getLiveMatches(): Promise<NormalizedMatch[]> {
  const raw = await apiFetch<ApiFixture>('/fixtures', {
    live:   `${WC_LEAGUE_ID}`,
    league: WC_LEAGUE_ID,
    season: WC_SEASON,
  });
  return raw.map(normalizeFixture);
}

/**
 * Próximos N partidos desde hoy.
 */
export async function getUpcomingFixtures(next = 10): Promise<NormalizedMatch[]> {
  const raw = await apiFetch<ApiFixture>('/fixtures', {
    league: WC_LEAGUE_ID,
    season: WC_SEASON,
    next,
  });
  return raw.map(normalizeFixture);
}

/**
 * Un partido específico por su ID de API-Football.
 */
export async function getMatchById(fixtureId: number): Promise<NormalizedMatch | null> {
  const raw = await apiFetch<ApiFixture>('/fixtures', { id: fixtureId });
  return raw.length > 0 ? normalizeFixture(raw[0]) : null;
}

/**
 * Equipos del Mundial 2026.
 */
export async function getTeams(): Promise<ApiTeamEntry[]> {
  return apiFetch<ApiTeamEntry>('/teams', {
    league: WC_LEAGUE_ID,
    season: WC_SEASON,
  });
}

/**
 * Standings / posiciones del Mundial 2026.
 * Retorna array de grupos, cada uno con sus equipos ordenados.
 */
export async function getStandings(): Promise<NormalizedGroup[]> {
  const raw = await apiFetch<ApiStandingsWrapper>('/standings', {
    league: WC_LEAGUE_ID,
    season: WC_SEASON,
  });

  if (!raw.length) return [];

  const groups: NormalizedGroup[] = [];

  for (const wrapper of raw) {
    for (const groupArray of wrapper.league.standings) {
      if (!groupArray.length) continue;
      const groupName = groupArray[0].group ?? 'General';
      const label = groupName.replace('Group ', 'Grupo ');
      groups.push({
        name:  label,
        teams: groupArray.map(normalizeStanding),
      });
    }
  }

  // Ordenar grupos A → L
  return groups.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Rounds disponibles del torneo (útil para navegar por ronda).
 */
export async function getRounds(): Promise<string[]> {
  const raw = await apiFetch<string>('/fixtures/rounds', {
    league:  WC_LEAGUE_ID,
    season:  WC_SEASON,
    current: 'true',
  });
  return raw;
}
