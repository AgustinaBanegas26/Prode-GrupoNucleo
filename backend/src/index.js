'use strict';

/**
 * Punto de entrada principal para producción (Render).
 * Arranca:
 *   1. Servidor HTTP (GET /health, GET /app/version, admin endpoints)
 *   2. Cron jobs de sincronización de partidos (API-Football → Supabase)
 */

const { startServer } = require('./server');
const { startSyncCron } = require('./services/matchSync');
const { startNotificationJobs } = require('./services/notificationJobs');

function nowIso() {
  return new Date().toISOString();
}

function log(msg) {
  console.log(`[index] ${nowIso()} — ${msg}`);
}

// ── Arrancar servidor HTTP ────────────────────────────────────────────────────
startServer();

// ── Arrancar cron jobs (no-op si faltan variables de entorno opcionales) ──────
try {
  startSyncCron();
} catch (e) {
  console.warn(`[index] ${nowIso()} — matchSync cron no iniciado: ${e.message}`);
}

try {
  startNotificationJobs();
} catch (e) {
  console.warn(`[index] ${nowIso()} — notification jobs no iniciados: ${e.message}`);
}

log('Sistema iniciado');
