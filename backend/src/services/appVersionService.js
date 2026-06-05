'use strict';

/**
 * Servicio de control de versiones APK.
 *
 * Tabla Supabase: public.app_versions
 * Campos:
 *   - version (text)
 *   - version_code (int)
 *   - apk_url (text, nullable; requerido por API al crear)
 *   - force_update (bool)
 *   - changelog (text)
 *   - is_active (bool)
 *   - created_at (timestamptz)
 *
 * Reglas clave:
 *   - Solo puede existir UNA versión activa (is_active=true) a la vez (trigger en DB)
 *   - version_code solo creciente (trigger en DB + validación aquí)
 *   - version/version_code/apk_url inmutables luego de creado (trigger en DB + validación aquí)
 *
 * Cache:
 *   - Cache simple en memoria (60s) para GET /app/version
 */

const { createClient } = require('@supabase/supabase-js');

const TABLE = 'app_versions';
const CACHE_TTL_MS = 60_000;

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

function invalidateCache() {
  _cache = null;
  _cacheAt = 0;
}

function isValidSemverLike(version) {
  // Acepta "1.2.0" y variantes simples.
  return typeof version === 'string' && /^\d+\.\d+\.\d+(-[0-9A-Za-z-.]+)?$/.test(version.trim());
}

function isValidSupabaseStoragePublicUrl(url) {
  if (typeof url !== 'string') return false;
  const s = url.trim();
  if (!s.startsWith('https://')) return false;

  // Formato típico:
  // https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
  // Se valida que sea supabase.co y contenga el path público de storage.
  const re = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/.+/i;
  return re.test(s);
}

async function getMaxVersionCode(supabase) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('version_code')
    .order('version_code', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data?.version_code ?? null;
}

/**
 * Devuelve la versión activa (pública), con cache 60s.
 * @returns {Promise<{version:string,versionCode:number,apkUrl:string|null,forceUpdate:boolean,changelog:string}|null>}
 */
async function getActiveVersion() {
  const now = Date.now();
  if (_cache && now - _cacheAt < CACHE_TTL_MS) return _cache;

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
        apkUrl: data.apk_url ?? null,
        forceUpdate: !!data.force_update,
        changelog: data.changelog ?? '',
      }
    : null;

  _cache = result;
  _cacheAt = now;
  return result;
}

/**
 * Crea una nueva versión.
 * @param {{version:string,versionCode:number,apkUrl:string,forceUpdate?:boolean,changelog?:string,active?:boolean}} payload
 */
async function createVersion({ version, versionCode, apkUrl, forceUpdate, changelog, active }) {
  if (!isValidSemverLike(version)) throw new Error('version inválida (ej: 1.2.0)');
  if (!Number.isInteger(versionCode) || versionCode < 1) {
    throw new Error('versionCode debe ser un entero positivo');
  }
  if (!isValidSupabaseStoragePublicUrl(apkUrl)) {
    throw new Error('apkUrl debe ser una URL HTTPS pública de Supabase Storage');
  }

  const supabase = getClient();

  // Validación de crecimiento (defensa adicional; DB también lo valida)
  const maxCode = await getMaxVersionCode(supabase);
  if (maxCode !== null && versionCode <= maxCode) {
    throw new Error(`versionCode debe ser mayor al actual (${maxCode})`);
  }

  // Insert
  const insertRow = {
    version: version.trim(),
    version_code: versionCode,
    apk_url: apkUrl.trim(),
    force_update: !!forceUpdate,
    changelog: changelog ?? '',
    is_active: active !== false, // activa por defecto
  };

  const { data, error } = await supabase.from(TABLE).insert(insertRow).select().single();
  if (error) throw new Error(`Error creando versión: ${error.message}`);

  invalidateCache();
  return data;
}

/**
 * Actualiza una versión existente.
 * Regla: NO se permite modificar version/versionCode/apkUrl.
 * Solo: forceUpdate, changelog, active.
 */
async function updateVersion(id, { forceUpdate, changelog, active }) {
  if (!id) throw new Error('id es requerido');

  const supabase = getClient();

  // Verificar que exista
  const { data: existing, error: fetchErr } = await supabase
    .from(TABLE)
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) throw new Error(`Supabase error: ${fetchErr.message}`);
  if (!existing) throw new Error('Versión no encontrada');

  const patch = {};
  if (forceUpdate !== undefined) patch.force_update = !!forceUpdate;
  if (changelog !== undefined) patch.changelog = changelog ?? '';
  if (active !== undefined) patch.is_active = !!active;

  if (Object.keys(patch).length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  const { data, error } = await supabase.from(TABLE).update(patch).eq('id', id).select().single();
  if (error) throw new Error(`Error actualizando versión: ${error.message}`);

  invalidateCache();
  return data;
}

/**
 * Activa una versión por id (y desactiva las demás por trigger en DB).
 */
async function setActiveVersion(id) {
  return updateVersion(id, { active: true });
}

/**
 * Lista todas las versiones (admin).
 */
async function listVersions() {
  const supabase = getClient();
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data ?? [];
}

module.exports = {
  getActiveVersion,
  createVersion,
  updateVersion,
  setActiveVersion,
  listVersions,
  invalidateCache,
};
