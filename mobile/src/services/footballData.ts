// ─────────────────────────────────────────────────────────────
// Servicio football-data.org v4
// Base URL: https://api.football-data.org/v4
// Copa Mundial FIFA 2026 → competition code = WC (id = 2000)
// Header: X-Auth-Token
// Plan free: 10 req/min, datos de World Cup incluidos
// ─────────────────────────────────────────────────────────────

import type { NormalizedMatch, NormalizedGroup, NormalizedStanding } from './apiFootball.types';
import type { MatchStatusShort } from './apiFootball.types';

const BASE   = 'https://api.football-data.org/v4';
const WC_CODE = 'WC';

function getToken(): string {
  return process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN ?? '';
}

function getSupabaseUrl(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
}

// En web el browser bloquea CORS hacia football-data.org.
// Usamos la Supabase Edge Function como proxy.
function isWebPlatform(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function buildProxyUrl(fdPath: string, params?: Record<string, string>): string {
  const supabaseUrl = getSupabaseUrl();
  const base = `${supabaseUrl}/functions/v1/wc-proxy`;
  const qs = new URLSearchParams({ path: fdPath, ...params });
  return `${base}?${qs.toString()}`;
}

function buildDirectUrl(fdPath: string, params?: Record<string, string>): string {
  const url = new URL(`${BASE}${fdPath}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

// ── Fetch base ────────────────────────────────────────────────
async function fdFetch<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  const token     = getToken();
  const onWeb     = isWebPlatform();
  const supaUrl   = getSupabaseUrl();

  // En web necesitamos el proxy; si no hay Supabase URL configurada, fallback a null
  if (onWeb && !supaUrl) {
    console.warn('[football-data] En web se necesita EXPO_PUBLIC_SUPABASE_URL para el proxy');
    return null;
  }

  if (!token && !onWeb) {
    console.warn('[football-data] Token no configurado en EXPO_PUBLIC_FOOTBALL_DATA_TOKEN');
    return null;
  }

  const url     = onWeb ? buildProxyUrl(path, params) : buildDirectUrl(path, params);
  const headers: Record<string, string> = onWeb
    ? { 'Content-Type': 'application/json' }          // proxy no necesita token en el header
    : { 'X-Auth-Token': token, 'Content-Type': 'application/json' };

  try {
    const res = await fetch(url, { headers });

    if (res.status === 429) {
      console.warn('[football-data] Rate limit alcanzado (10 req/min en plan free)');
      return null;
    }
    if (!res.ok) {
      const body = await res.text();
      console.error(`[football-data] HTTP ${res.status}:`, body);
      return null;
    }

    return (await res.json()) as T;
  } catch (e) {
    console.error('[football-data] Error de red:', e);
    return null;
  }
}

// ── Tipos internos de la respuesta ────────────────────────────
interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;           // 3-letter code
  crest: string;         // logo URL
  flag?: string;
}

interface FDScore {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration: string;
  fullTime:  { home: number | null; away: number | null };
  halfTime:  { home: number | null; away: number | null };
  extraTime: { home: number | null; away: number | null };
  penalties: { home: number | null; away: number | null };
}

interface FDMatch {
  id: number;
  utcDate: string;
  status: string;   // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | etc.
  matchday: number | null;
  stage: string;    // GROUP_STAGE | LAST_16 | QUARTER_FINALS | SEMI_FINALS | FINAL | etc.
  group: string | null;  // GROUP_A | GROUP_B | etc.
  lastUpdated: string;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: FDScore;
  venue?: string;
}

interface FDMatchesResponse {
  count: number;
  filters: Record<string, unknown>;
  resultSet: { count: number; competitions: string; first: string; last: string; played: number };
  matches: FDMatch[];
}

interface FDStandingsGroup {
  stage: string;
  type: string;
  group: string | null;
  table: FDStandingEntry[];
}

interface FDStandingEntry {
  position: number;
  team: FDTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string | null;
}

interface FDStandingsResponse {
  competition: { id: number; name: string };
  season: { id: number; startDate: string; endDate: string };
  standings: FDStandingsGroup[];
}

// ── Normalización ─────────────────────────────────────────────

function mapStatus(status: string): MatchStatusShort {
  switch (status) {
    case 'TIMED':
    case 'SCHEDULED': return 'NS';
    case 'IN_PLAY':   return '1H';
    case 'PAUSED':    return 'HT';
    case 'FINISHED':  return 'FT';
    case 'POSTPONED': return 'PST';
    case 'CANCELLED': return 'CANC';
    default:          return 'NS';
  }
}

function mapPhase(stage: string): string {
  switch (stage) {
    case 'GROUP_STAGE':     return 'Fase de Grupos';
    case 'LAST_32':         return 'Dieciseisavos';
    case 'LAST_16':         return 'Octavos';
    case 'QUARTER_FINALS':  return 'Cuartos';
    case 'SEMI_FINALS':     return 'Semifinales';
    case 'THIRD_PLACE':     return 'Tercer Puesto';
    case 'FINAL':           return 'Final';
    default:                return stage;
  }
}

function mapGroup(group: string | null): string | null {
  if (!group) return null;
  return group.replace('GROUP_', 'Grupo ');
}

function formatDate(utcDate: string): string {
  try {
    return new Date(utcDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  } catch { return utcDate; }
}

function formatTime(utcDate: string): string {
  try {
    return new Date(utcDate).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return ''; }
}

// Mapa de TLA de football-data.org (2-3 letras) → código ISO 3 letras que usamos en FLAG_EMOJIS
const TLA_TO_CODE: Record<string, string> = {
  MX: 'MEX', ZA: 'RSA', KR: 'KOR', CZ: 'CZE',
  CA: 'CAN', BA: 'BIH', US: 'USA', PY: 'PAR',
  QA: 'QAT', CH: 'SUI', BR: 'BRA', MA: 'MAR',
  HT: 'HAI', SCO: 'SCO', AU: 'AUS', TR: 'TUR',
  DE: 'GER', CW: 'CUW', NL: 'NED', JP: 'JPN',
  CI: 'CIV', EC: 'ECU', SE: 'SWE', TN: 'TUN',
  ES: 'ESP', CV: 'CPV', BE: 'BEL', EG: 'EGY',
  SA: 'KSA', UY: 'URU', IR: 'IRN', NZ: 'NZL',
  FR: 'FRA', SN: 'SEN', IQ: 'IRQ', NO: 'NOR',
  AR: 'ARG', DZ: 'ALG', AT: 'AUT', JO: 'JOR',
  PT: 'POR', CG: 'CGO', ENG: 'ENG', HR: 'CRO',
  GH: 'GHA', PA: 'PAN', UZ: 'UZB', CO: 'COL',
  // ya correctos (3 letras)
  MEX: 'MEX', RSA: 'RSA', KOR: 'KOR', CZE: 'CZE',
  CAN: 'CAN', BIH: 'BIH', USA: 'USA', PAR: 'PAR',
  QAT: 'QAT', SUI: 'SUI', BRA: 'BRA', MAR: 'MAR',
  HAI: 'HAI', AUS: 'AUS', TUR: 'TUR', GER: 'GER',
  CUW: 'CUW', NED: 'NED', JPN: 'JPN', CIV: 'CIV',
  ECU: 'ECU', SWE: 'SWE', TUN: 'TUN', ESP: 'ESP',
  CPV: 'CPV', BEL: 'BEL', EGY: 'EGY', KSA: 'KSA',
  URU: 'URU', IRN: 'IRN', NZL: 'NZL', FRA: 'FRA',
  SEN: 'SEN', IRQ: 'IRQ', NOR: 'NOR', ARG: 'ARG',
  ALG: 'ALG', AUT: 'AUT', JOR: 'JOR', POR: 'POR',
  CGO: 'CGO', CRO: 'CRO', GHA: 'GHA', PAN: 'PAN',
  UZB: 'UZB', COL: 'COL',
};

function toCode(tla: string | null | undefined, shortName: string): string {
  if (!tla) return (shortName ?? '').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || '???';
  const upper = tla.toUpperCase();
  return TLA_TO_CODE[upper] ?? upper;
}

function normalizeMatch(m: FDMatch): NormalizedMatch {
  const status     = mapStatus(m.status);
  const isLive     = ['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(m.status);
  const isFinished = m.status === 'FINISHED';

  const score = isFinished || isLive ? m.score.fullTime : { home: null, away: null };

  return {
    id:          m.id,
    homeTeam:    m.homeTeam.name,
    awayTeam:    m.awayTeam.name,
    homeLogo:    m.homeTeam.crest ?? '',
    awayLogo:    m.awayTeam.crest ?? '',
    homeCode:    toCode(m.homeTeam.tla, m.homeTeam.shortName),
    awayCode:    toCode(m.awayTeam.tla, m.awayTeam.shortName),
    homeScore:   score.home,
    awayScore:   score.away,
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
    isLive,
    isFinished,
  };
}

// ── API pública ───────────────────────────────────────────────

/** Todos los partidos del Mundial 2026 */
export async function getWCFixtures(filters?: {
  dateFrom?: string;
  dateTo?: string;
  stage?: string;
  status?: string;
}): Promise<NormalizedMatch[]> {
  const params: Record<string, string> = {};

  // football-data.org requiere dateFrom Y dateTo juntos
  if (filters?.dateFrom && filters?.dateTo) {
    params.dateFrom = filters.dateFrom;
    params.dateTo   = filters.dateTo;
  }
  if (filters?.stage)  params.stage  = filters.stage;
  if (filters?.status) params.status = filters.status;

  const data = await fdFetch<FDMatchesResponse>(
    `/competitions/${WC_CODE}/matches`,
    Object.keys(params).length ? params : undefined,
  );

  if (!data) return [];
  return data.matches
    .map(normalizeMatch)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

/** Próximos N partidos (scheduled/timed desde hoy) */
export async function getWCUpcoming(limit = 5): Promise<NormalizedMatch[]> {
  const today  = new Date();
  const future = new Date(today);
  future.setDate(today.getDate() + 60); // rango de 60 días — cubre toda la fase de grupos

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  // Sin filtro de status para capturar TIMED, SCHEDULED e IN_PLAY
  const data = await fdFetch<FDMatchesResponse>(
    `/competitions/${WC_CODE}/matches`,
    { dateFrom: fmt(today), dateTo: fmt(future) },
  );
  if (!data) return [];
  // Filtrar finalizados y ordenar por fecha
  return data.matches
    .filter(m => m.status !== 'FINISHED' && m.status !== 'CANCELLED' && m.status !== 'POSTPONED')
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, limit)
    .map(normalizeMatch);
}

/** Partidos en vivo */
export async function getWCLive(): Promise<NormalizedMatch[]> {
  const data = await fdFetch<FDMatchesResponse>(
    `/competitions/${WC_CODE}/matches`,
    { status: 'IN_PLAY' },
  );
  if (!data) return [];
  return data.matches.map(normalizeMatch);
}

/** Un partido por su ID */
export async function getWCMatchById(matchId: number): Promise<NormalizedMatch | null> {
  const data = await fdFetch<{ match: FDMatch }>(`/matches/${matchId}`);
  if (!data) return null;
  return normalizeMatch(data.match);
}

/** Standings / posiciones por grupo */
export async function getWCStandings(): Promise<NormalizedGroup[]> {
  const data = await fdFetch<FDStandingsResponse>(`/competitions/${WC_CODE}/standings`);
  if (!data) return [];

  const groups: NormalizedGroup[] = [];

  for (const sg of data.standings) {
    if (sg.type !== 'TOTAL') continue;
    const groupName = mapGroup(sg.group) ?? 'General';
    groups.push({
      name: groupName,
      teams: sg.table.map((entry): NormalizedStanding => ({
        rank:         entry.position,
        teamId:       entry.team.id,
        teamName:     entry.team.name,
        teamLogo:     entry.team.crest ?? '',
        points:       entry.points,
        played:       entry.playedGames,
        won:          entry.won,
        drawn:        entry.draw,
        lost:         entry.lost,
        goalsFor:     entry.goalsFor,
        goalsAgainst: entry.goalsAgainst,
        goalDiff:     entry.goalDifference,
        group:        groupName,
        form:         entry.form ?? null,
      })),
    });
  }

  return groups.sort((a, b) => a.name.localeCompare(b.name));
}
