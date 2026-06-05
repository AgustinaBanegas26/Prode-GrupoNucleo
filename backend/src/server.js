'use strict';

/**
 * Servidor HTTP del backend Prode Mundialista.
 *
 * Endpoints:
 *   GET  /health              — healthcheck (Render keepalive)
 *   GET  /app/version         — versión activa de la APK (pública, cached 60s)
 *   GET  /admin/app/versions  — lista todas las versiones (requiere JWT admin)
 *   POST /admin/app/version   — crea nueva versión (requiere JWT admin)
 *   PUT  /admin/app/version/:id — actualiza versión (requiere JWT admin)
 *
 * JWT: se valida con SUPABASE_JWT_SECRET (mismo secret que usa Supabase).
 * El token viene en el header: Authorization: Bearer <token>
 * El campo role del payload debe ser 'admin'.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const {
  getActiveVersion,
  createVersion,
  updateVersion,
  listVersions,
} = require('./services/appVersion');

const app = express();
app.use(express.json());

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString();
}

function log(msg) {
  console.log(`[server] ${nowIso()} — ${msg}`);
}

function logError(msg, err) {
  console.error(`[server] ${nowIso()} — ${msg}`, err?.message ?? err ?? '');
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

// ─── Middleware JWT Admin ─────────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authorization header requerido');
    }

    const token = authHeader.slice(7).trim();
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      logError('SUPABASE_JWT_SECRET no está configurado', null);
      return sendError(res, 500, 'Configuración del servidor incompleta');
    }

    const payload = jwt.verify(token, secret);

    // Supabase pone el rol en user_metadata.role o en app_metadata.role
    const role =
      payload?.user_metadata?.role ??
      payload?.app_metadata?.role ??
      payload?.role ??
      null;

    if (role !== 'admin') {
      return sendError(res, 403, 'Acceso restringido a administradores');
    }

    req.jwtPayload = payload;
    return next();
  } catch (err) {
    if (err?.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expirado');
    }
    if (err?.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Token inválido');
    }
    logError('Error en requireAdmin', err);
    return sendError(res, 500, 'Error al validar token');
  }
}

// ─── Rutas públicas ───────────────────────────────────────────────────────────

/**
 * GET /health
 * Healthcheck para Render (evita que el servicio duerma).
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: nowIso() });
});

/**
 * GET /app/version
 * Devuelve la versión activa de la APK.
 * Respuesta en < 300ms gracias al cache en memoria (60s).
 */
app.get('/app/version', async (_req, res) => {
  try {
    const version = await getActiveVersion();
    if (!version) {
      // Ninguna versión activa — la app no debe bloquear
      return res.json({
        version: '1.0.0',
        versionCode: 1,
        apkUrl: null,
        forceUpdate: false,
        changelog: '',
      });
    }
    return res.json(version);
  } catch (err) {
    logError('GET /app/version', err);
    // En caso de error de DB, devolver fallback para no bloquear la app
    return res.json({
      version: '1.0.0',
      versionCode: 1,
      apkUrl: null,
      forceUpdate: false,
      changelog: '',
    });
  }
});

// ─── Rutas admin (requieren JWT con role=admin) ───────────────────────────────

/**
 * GET /admin/app/versions
 * Lista todas las versiones.
 */
app.get('/admin/app/versions', requireAdmin, async (_req, res) => {
  try {
    const versions = await listVersions();
    return res.json({ versions });
  } catch (err) {
    logError('GET /admin/app/versions', err);
    return sendError(res, 500, err.message);
  }
});

/**
 * POST /admin/app/version
 * Crea una nueva versión.
 * Body: { version, versionCode, apkUrl, forceUpdate, changelog, active }
 */
app.post('/admin/app/version', requireAdmin, async (req, res) => {
  try {
    const { version, versionCode, apkUrl, forceUpdate, changelog, active } = req.body ?? {};

    if (!version || !versionCode || !apkUrl) {
      return sendError(res, 400, 'version, versionCode y apkUrl son requeridos');
    }

    const data = await createVersion({
      version,
      versionCode: Number(versionCode),
      apkUrl,
      forceUpdate: !!forceUpdate,
      changelog: changelog ?? '',
      active: active !== false, // activa por defecto
    });

    log(`Nueva versión creada por admin: ${version} (code ${versionCode})`);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    logError('POST /admin/app/version', err);
    return sendError(res, 400, err.message);
  }
});

/**
 * PUT /admin/app/version/:id
 * Actualiza una versión existente (active, forceUpdate, changelog, etc.)
 */
app.put('/admin/app/version/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { version, versionCode, apkUrl, forceUpdate, changelog, active } = req.body ?? {};

    const data = await updateVersion(id, {
      ...(version !== undefined && { version }),
      ...(versionCode !== undefined && { versionCode: Number(versionCode) }),
      ...(apkUrl !== undefined && { apkUrl }),
      ...(forceUpdate !== undefined && { forceUpdate }),
      ...(changelog !== undefined && { changelog }),
      ...(active !== undefined && { active }),
    });

    log(`Versión ${id} actualizada por admin`);
    return res.json({ success: true, data });
  } catch (err) {
    logError(`PUT /admin/app/version/${req.params.id}`, err);
    const status = err.message === 'Versión no encontrada' ? 404 : 400;
    return sendError(res, status, err.message);
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

function startServer() {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    log(`Servidor HTTP escuchando en puerto ${port}`);
  });
  return app;
}

module.exports = { app, startServer };
