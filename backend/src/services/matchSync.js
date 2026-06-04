'use strict';

/**
 * Sincronización de resultados con API-Football (api-sports.io) → Supabase.
 *
 * Requisitos:
 * - No hardcodear claves/URL: todo por variables de entorno
 * - Retries de red con backoff
 * - Logs con formato: "[matchSync] 2026-06-15T20:00:00Z — 3 partidos actualizados"
 *
 * Variables de entorno:
 * - API_FOOTBALL_KEY
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY
 */

const axios = require('axios');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

const API_BASE_URL = 'https://v3.football.api-sports.io';
const LEAGUE_ID = 1;
const SEASON = 2026;
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);

function nowIso() {
  return new Date().toISOString();
}

function log(msg) {
  console.log(`[matchSync] ${nowIso()} — ${msg}`);
}

function logError(msg, err) {
  const suffix = err instanceof Error ? ` (${err.message})` : '';
  console.error(`[matchSync] ${nowIso()} — ${msg}${suffix}`);
  if (err) console.error(err);
}

function getEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) throw new Error(`Falta variable de entorno: ${name}`);
  return String(v).trim();
}

function getSupabaseAdminClient() {
  const url = getEnv('SUPABASE_URL');
  const serviceKey = getEnv('SUPABASE_SERVICE_KEY');
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function apiClient() {
  const apiKey = getEnv('API_FOOTBALL_KEY');
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
      'x-apisports-key': apiKey,
    },
  });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, { retries = 3, backoffMs = 2000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await sleep(backoffMs);
      }
    }
  }
  throw lastErr;
}

function toMatchRow(fixture) {
  const fixtureId = fixture?.fixture?.id;
  const status = fixture?.fixture?.status?.short ?? 'NS';

  return {
    fixture_id: fixtureId,
    home_team: fixture?.teams?.home?.name ?? '',
    away_team: fixture?.teams?.away?.name ?? '',
    home_logo: fixture?.teams?.home?.logo ?? null,
    away_logo: fixture?.teams?.away?.logo ?? null,
    home_goals: typeof fixture?.goals?.home === 'number' ? fixture.goals.home : null,
    away_goals: typeof fixture?.goals?.away === 'number' ? fixture.goals.away : null,
    status,
    match_date: fixture?.fixture?.date, // ISO string
    round: fixture?.league?.round ?? null,
    venue: fixture?.fixture?.venue?.name ?? null,
    updated_at: nowIso(),
  };
}

async function fetchFixtures(params) {
  const client = apiClient();
  const res = await withRetry(() => client.get('/fixtures', { params }));
  const data = res?.data;
  if (!data || !Array.isArray(data.response)) return [];
  return data.response;
}

/**
 * syncFinishedMatches():
 * - consulta API-Football (principalmente status=FT)
 * - upsert en Supabase usando fixture_id como PK
 * - solo guarda partidos con status FT/AET/PEN
 */
async function syncFinishedMatches() {
  const supabase = getSupabaseAdminClient();

  try {
    // Requisito: consultar con status=FT.
    // Nota: para cubrir AET/PEN (también finalizados), hacemos requests adicionales.
    const statusesToQuery = ['FT', 'AET', 'PEN'];

    const all = [];
    for (const st of statusesToQuery) {
      const fixtures = await fetchFixtures({ league: LEAGUE_ID, season: SEASON, status: st });
      all.push(...fixtures);
    }

    const byId = new Map();
    for (const f of all) {
      const id = f?.fixture?.id;
      if (id) byId.set(id, f);
    }

    const rows = Array.from(byId.values())
      .filter((f) => FINISHED_STATUSES.has(f?.fixture?.status?.short))
      .map(toMatchRow)
      .filter((r) => r.fixture_id && r.home_team && r.away_team && r.match_date);

    if (rows.length === 0) {
      log('0 partidos actualizados');
      return { updated: 0 };
    }

    const { error } = await supabase
      .from('matches')
      .upsert(rows, { onConflict: 'fixture_id' });

    if (error) {
      throw new Error(`Supabase upsert error: ${error.message}`);
    }

    log(`${rows.length} partidos actualizados`);
    return { updated: rows.length };
  } catch (e) {
    logError('Error en syncFinishedMatches', e);
    throw e;
  }
}

/**
 * syncTodayMatches():
 * - consulta los partidos del día actual (UTC) para almacenar/actualizar fixture_ids aunque no hayan terminado
 */
async function syncTodayMatches() {
  const supabase = getSupabaseAdminClient();

  try {
    const todayUtc = new Date();
    const yyyy = todayUtc.getUTCFullYear();
    const mm = String(todayUtc.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(todayUtc.getUTCDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;

    const fixtures = await fetchFixtures({ league: LEAGUE_ID, season: SEASON, date });

    const rows = fixtures
      .map(toMatchRow)
      .filter((r) => r.fixture_id && r.home_team && r.away_team && r.match_date);

    if (rows.length === 0) {
      log('0 partidos del día sincronizados');
      return { updated: 0 };
    }

    const { error } = await supabase
      .from('matches')
      .upsert(rows, { onConflict: 'fixture_id' });

    if (error) {
      throw new Error(`Supabase upsert error: ${error.message}`);
    }

    log(`${rows.length} partidos del día sincronizados`);
    return { updated: rows.length };
  } catch (e) {
    logError('Error en syncTodayMatches', e);
    throw e;
  }
}

/**
 * startSyncCron():
 * - Cada 2 minutos: syncFinishedMatches()
 * - Todos los días 06:00 UTC: syncTodayMatches()
 */
function startSyncCron() {
  try {
    // Valida env al iniciar (falla temprano)
    getEnv('API_FOOTBALL_KEY');
    getEnv('SUPABASE_URL');
    getEnv('SUPABASE_SERVICE_KEY');

    cron.schedule(
      '*/2 * * * *',
      async () => {
        try {
          await syncFinishedMatches();
        } catch (_) {
          // error ya logueado en sync
        }
      },
      { timezone: 'UTC' },
    );

    cron.schedule(
      '0 6 * * *',
      async () => {
        try {
          await syncTodayMatches();
        } catch (_) {
          // error ya logueado en sync
        }
      },
      { timezone: 'UTC' },
    );

    log('Cron iniciado (*/2 min + 06:00 UTC)');
  } catch (e) {
    logError('No se pudo iniciar el cron', e);
    throw e;
  }
}

module.exports = {
  startSyncCron,
  syncFinishedMatches,
  syncTodayMatches,
};

