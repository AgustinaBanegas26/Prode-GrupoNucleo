// ─────────────────────────────────────────────────────────────
// Servicio football-data.org API v4
// Base URL: https://api.football-data.org/v4
// Copa Mundial FIFA 2026 → /competitions/WC/matches
// Header: X-Auth-Token: <token>
// ─────────────────────────────────────────────────────────────

import type { NormalizedMatch } from './apiFootball.types';
import type { MatchStatusShort } from './apiFootball.types';

const BASE_URL = 'https://api.football-data.org/v4';
const WC_CODE  = 'WC';

function getToken(): string {
  return process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN ?? '';
}

// ── Tipos de respuesta football-data.org ──────────────────────
interface FDArea   { id: number; name: string; code: string; flag?: string }
interface FDCompetition { id: number; name: string; code: string; emblem?: string }
interface FDSeason { id: number; startDate: string; endDate: string; currentMatchday?: number }
interface FDTeam   { id: number; name: string; shortName: string; tla: string; crest: string; area?: FDArea }

interface FDScore {
  winner:   'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
  fullTime:  { home: number | null; away: number | null };
  halfTime:  { home: number | null; away: number | null };
}

interface FDMatch {
  id:          number;
  competition: FDCompetition;
  season:      FDSeason;
  utcDate:     string;          // ISO 8601
  status:      'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'EXTRA_TIME' |
               'PENALTY_SHOOTOUT' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' |
               'CANCELLED' | 'AWARDED';
  matchday:    number | null;
  stage:       string;          // GROUP_STAGE | LAST_32 | LAST_16 | QUARTER_FINALS | SEMI_FINALS | FINAL etc.
  group:       string | null;   // "GROUP_A" | null
  lastUpdated: string;
  homeTeam:    FDTeam;
  awayTeam:    FDTeam;
  score:       FDScore;
  venue?:      string;
  referees?:   unknown[];
}

interface FDMatchesResponse {
  filters:     Record<string, string>;
  resultSet:   { count: number; competitions: string; first: string; last: string; played: number };
  competition: FDCompetition;
  matches:     FDMatch[];
}

// ── Mapeo de status ───────────────────────────────────────────
function mapStatus(status: FDMatch['status']): MatchStatusShort {
  switch (status) {
    case 'SCHEDULED':         return 'NS';
    case 'TIMED':             return 'NS';
    case 'IN_PLAY':           return '1H';
    case 'PAUSED':            return 'HT';
    case 'EXTRA_TIME':        return 'ET';
    case 'PENALTY_SHOOTOUT':  return 'P';
    case 'FINISHED':          return 'FT';
    case 'SUSPENDED':         return 'SUSP';
    case 'POSTPONED':         return 'PST';
    case 'CANCELLED':         return 'CANC';
    case 'AWARDED':           return 'AWD';
    default:                  return 'NS';
  }
}

const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT']);
const FINISHED_STATUSES = new Set(['FINISHED', 'AWARDED']);

// ── Mapeo de fase ─────────────────────────────────────────────
function mapPhase(stage: string): string {
  const s = stage.toUpperCase();
  if (s.includes('GROUP'))         return 'Fase de Grupos';
  if (s.includes('LAST_32'))       return 'Dieciseisavos';
  if (s.includes('LAST_16'))       return 'Octavos';
  if (s.includes('QUARTER'))       return 'Cuartos';
  if (s.includes('SEMI'))          return 'Semifinales';
  if (s.includes('THIRD'))         return 'Tercer Puesto';
  if (s.includes('FINAL'))         return 'Final';
  return stage;
}

// ── Mapeo de grupo ────────────────────────────────────────────
function mapGroup(group: string | null): string | null {
  if (!group) return null;
  // "GROUP_A" → "Grupo A"
  const m = group.match(/GROUP_([A-L])/i);
  if (m) return `Grupo ${m[1].toUpperCase()}`;
  return group;
}

// ── Formateo de fecha y hora ──────────────────────────────────
function formatDate(utcDate: string): string {
  try {
    const d = new Date(utcDate);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  } catch { return utcDate; }
}

function formatTime(utcDate: string): string {
  try {
    const d = new Date(utcDate);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return ''; }
}

function toNormalizedMatch(m: FDMatch): NormalizedMatch {
  const status = mapStatus(m.status);
  return {
    id:          m.id,
    homeTeam:    m.homeTeam.name,
    awayTeam:    m.awayTeam.name,
    homeLogo:    m.homeTeam.crest ?? '',
    awayLogo:    m.awayTeam.crest ?? '',
    homeCode:    m.homeTeam.tla ?? m.homeTeam.shortName?.slice(0, 3).toUpperCase() ?? '???',
    awayCode:    m.awayTeam.tla ?? m.awayTeam.shortName?.slice(0, 3).toUpperCase() ?? '???',
    homeScore:   m.score.fullTime.home,
    awayScore:   m.score.fullTime.away,
    date:        formatDate(m.utcDate),
    isoDate:     m.utcDate.split('T')[0],
    time:        formatTime(m.utcDate),
    stadium:     m.venue ?? '',
    city:        '',
    status,
    statusLong:  m.status,
    elapsed:     null,
    round:       m.stage,
    group:       mapGroup(m.group),
    phase:       mapPhase(m.stage),
    isLive:      LIVE_STATUSES.has(m.status),
    isFinished:  FINISHED_STATUSES.has(m.status),
  };
}

// ── Fetch base ────────────────────────────────────────────────
async function fdFetch<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  const token = getToken();
  if (!token) {
    console.warn('[football-data] Token no configurado. Editá .env → EXPO_PUBLIC_FOOTBALL_DATA_TOKEN');
    return null;
  }

  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { 'X-Auth-Token': token },
    });

    if (res.status === 429) {
      console.warn('[football-data] Rate limit alcanzado. Reintentá en unos segundos.');
      return null;
    }
    if (!res.ok) {
      console.error(`[football-data] HTTP ${res.status} en ${path}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[football-data] Error de red en ${path}:`, err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────

/** Todos los partidos del Mundial 2026 */
export async function getWCFixtures(options?: {
  dateFrom?: string;   // YYYY-MM-DD
  dateTo?: string;
  stage?: string;
}): Promise<NormalizedMatch[]> {
  const params: Record<string, string> = {};
  if (options?.dateFrom) params.dateFrom = options.dateFrom;
  if (options?.dateTo)   params.dateTo   = options.dateTo;
  if (options?.stage)    params.stage    = options.stage;

  const data = await fdFetch<FDMatchesResponse>(
    `/competitions/${WC_CODE}/matches`,
    params
  );

  if (!data?.matches) return [];

  return data.matches
    .map(toNormalizedMatch)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

/** Próximos N partidos */
export async function getWCUpcoming(limit = 10): Promise<NormalizedMatch[]> {
  const today = new Date().toISOString().split('T')[0];
  const inTwoMonths = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const all = await getWCFixtures({ dateFrom: today, dateTo: inTwoMonths });
  return all.filter(m => !m.isFinished).slice(0, limit);
}

/** Un partido por ID */
export async function getWCMatchById(matchId: number): Promise<NormalizedMatch | null> {
  const data = await fdFetch<{ match: FDMatch }>(`/matches/${matchId}`);
  if (!data?.match) return null;
  return toNormalizedMatch(data.match);
}

/** Comprueba si el token funciona */
export function hasValidToken(): boolean {
  const t = getToken();
  return !!t && t.length > 10;
}
