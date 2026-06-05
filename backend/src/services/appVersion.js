'use strict';

/**
 * Servicio de control de versiones APK.
 *
 * Tabla Supabase: app_versions
 *   id          uuid default gen_random_uuid() primary key
 *   version     text not null
 *   version_code int not null
 *   apk_url     text not null
 *   force_update boolean not null default false
 *   changelog   text not null default ''
 *   is_active   boolean not null default false
 *   created_at  timestamptz not null default now()
 *
 * Regla: solo UNA fila puede tener is_active = true a la vez.
 * GET /app/version devuelve la fila activa (cache 60s).
 */

const { createClient } = require('@supabase/supabase-js');

const TABLE = 'app_versions';
const CACHE_TTL_MS = 60_000; // 60 segundos

// Cache en memoria simple
let _cache = null;
let _cacheAt = 0;

function getEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) throw new Error(`Falta variable de entorno: ${name}`);
  return String(v).trim();
}

function getClient() {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function nowIso() {
  return new Date().toISOString();
}

function log(msg) {
  console.log(`[appVersion] ${nowIso()} — ${msg}`);
}

/**
 * Obtiene la versión activa. Usa cache de 60s para performance.
 * @returns {Promise<object|null>}
 */
async function getActiveVersion() {
  const now = Date.now();
  if (_cache && now - _cacheAt < CACHE_TTL_MS) {
    return _cache;
  }

  const supabase = getClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Supabase error: ${error.message}`);

  const result = data
    ? {
        version: data.version,
        versionCode: data.version_code,
        apkUrl: data.apk_url,
        forceUpdate: data.force_update,
        changelog: data.changelog ?? '',
      }
    : null;

  _cache = result;
  _cacheAt = now;
  return result;
}

/**
 * Invalida el cache (llamar después de crear/actualizar versiones).
 */
function invalidateCache() {
  _cache = null;
  _cacheAt = 0;
}

/**
 * Crea una nueva versión. La activa si active=true (desactiva las anteriores).
 */
async function createVersion({ version, versionCode, apkUrl, forceUpdate, changelog, active }) {
  // Validaciones básicas
  if (!version || typeof version !== 'string' || !version.trim()) {
    throw new Error('version es requerida');
  }
  if (!Number.isInteger(versionCode) || versionCode < 1) {
    throw new Error('versionCode debe ser un entero positivo');
  }
  if (!apkUrl || typeof apkUrl !== 'string' || !apkUrl.startsWith('https://')) {
    throw new Error('apkUrl debe ser una URL HTTPS válida');
  }

  const supabase = getClient();

  // Si se activa, desactivar las anteriores primero
  if (active) {
    const { error: deactivateErr } = await supabase
      .from(TABLE)
      .update({ is_active: false })
      .eq('is_active', true);
    if (deactivateErr) throw new Error(`Error desactivando versiones: ${deactivateErr.message}`);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      version: version.trim(),
      version_code: versionCode,
      apk_url: apkUrl.trim(),
      force_update: !!forceUpdate,
      changelog: changelog ?? '',
      is_active: !!active,
    })
    .select()
    .single();

  if (error) throw new Error(`Error creando versión: ${error.message}`);
  invalidateCache();
  log(`Versión creada: ${data.version} (code ${data.version_code}) active=${data.is_active}`);
  return data;
}

/**
 * Actualiza una versión existente.
 */
async function updateVersion(id, { version, versionCode, apkUrl, forceUpdate, changelog, active }) {
  if (!id) throw new Error('id es requerido');

  const supabase = getClient();

  // Obtener versión actual para validar que existe
  const { data: existing, error: fetchErr } = await supabase
    .from(TABLE)
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!existing) throw new Error('Versión no encontrada');

  // Si se activa esta, desactivar las demás
  if (active === true) {
    const { error: deactivateErr } = await supabase
      .from(TABLE)
      .update({ is_active: false })
      .neq('id', id)
      .eq('is_active', true);
    if (deactivateErr) throw new Error(`Error desactivando versiones: ${deactivateErr.message}`);
  }

  const patch = {};
  if (version !== undefined) patch.version = version.trim();
  if (versionCode !== undefined) patch.version_code = versionCode;
  if (apkUrl !== undefined) {
    if (!apkUrl.startsWith('https://')) throw new Error('apkUrl debe ser HTTPS');
    patch.apk_url = apkUrl.trim();
  }
  if (forceUpdate !== undefined) patch.force_update = !!forceUpdate;
  if (changelog !== undefined) patch.changelog = changelog;
  if (active !== undefined) patch.is_active = !!active;

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error actualizando versión: ${error.message}`);
  invalidateCache();
  log(`Versión ${data.version} actualizada (id: ${id})`);
  return data;
}

/**
 * Lista todas las versiones ordenadas por created_at desc.
 */
async function listVersions() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

module.exports = {
  getActiveVersion,
  createVersion,
  updateVersion,
  listVersions,
  invalidateCache,
};
