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
} = require('./services/appVersionService');
const { loginAdmin } = require('./services/adminAuthService');
const { requestPasswordRecovery } = require('./services/passwordRecoveryService');
const { getSupabaseAdmin } = require('./services/supabaseAdmin');
const { processOutboxBatch } = require('./services/pushService');
const { notifyNewAppVersion } = require('./services/notificationJobs');

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

/**
 * POST /auth/password-recovery
 * Body: { email, redirectTo? }
 * Verifica email legacy, sincroniza auth.users y envía correo de recuperación.
 */
app.post('/auth/password-recovery', async (req, res) => {
  try {
    const { email, redirectTo } = req.body ?? {};
    if (!email?.trim()) {
      return sendError(res, 400, 'Ingresá un email válido.');
    }

    const recoveryRedirect =
      redirectTo?.trim() || process.env.PASSWORD_RESET_REDIRECT_URL || 'prode-grupo-nucleo://reset-password';

    await requestPasswordRecovery(String(email), recoveryRedirect);
    return res.json({ ok: true, message: 'Correo enviado correctamente.' });
  } catch (err) {
    logError('POST /auth/password-recovery', err);
    const code = err.code ?? 'unknown';
    if (code === 'email_not_found') {
      return sendError(res, 404, 'El correo no existe.');
    }
    if (code === 'invalid_email') {
      return sendError(res, 400, err.message);
    }
    if (code === 'send_failed') {
      return sendError(res, 502, 'No fue posible enviar el correo. Intente nuevamente.');
    }
    return sendError(res, 500, 'No fue posible enviar el correo. Intente nuevamente.');
  }
});

// ─── Auth admin (JWT) ─────────────────────────────────────────────────────────

/**
 * POST /admin/auth/login
 * Body: { usuario, password }
 */
app.post('/admin/auth/login', async (req, res) => {
  try {
    const { usuario, password } = req.body ?? {};
    if (!usuario || !password) {
      return sendError(res, 400, 'usuario y password son requeridos');
    }
    const result = await loginAdmin(String(usuario), String(password));
    return res.json(result);
  } catch (err) {
    logError('POST /admin/auth/login', err);
    return sendError(res, 401, err.message);
  }
});

// ─── Rutas admin (requieren JWT con role=admin) ───────────────────────────────

/**
 * POST /admin/notifications/send
 * Encola push manual + historial.
 */
app.post('/admin/notifications/send', requireAdmin, async (req, res) => {
  try {
    const { title, body, audience, target_user_id } = req.body ?? {};
    if (!title?.trim() || !body?.trim()) {
      return sendError(res, 400, 'title y body son requeridos');
    }
    const aud = audience ?? 'global';
    const supabase = getSupabaseAdmin();

    await supabase.from('notifications').insert({
      title: title.trim(),
      body: body.trim(),
      audience: aud,
      target_user_id: target_user_id ?? null,
      sent_at: new Date().toISOString(),
    });

    await supabase.from('notifications_outbox').insert({
      event_type: 'manual',
      title: title.trim(),
      body: body.trim(),
      audience: aud,
      target_user_id: target_user_id ?? null,
      status: 'pending',
    });

    await processOutboxBatch(5);

    return res.json({ success: true });
  } catch (err) {
    logError('POST /admin/notifications/send', err);
    return sendError(res, 500, err.message);
  }
});

/**
 * POST /admin/scoring/recalculate
 * Body opcional: { fixture_id }
 */
app.post('/admin/scoring/recalculate', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const fixtureId = req.body?.fixture_id;

    if (fixtureId != null) {
      const { error } = await supabase.rpc('calculate_match_scores', {
        p_fixture_id: Number(fixtureId),
      });
      if (error) throw new Error(error.message);
    } else {
      const { data: finished, error: mErr } = await supabase
        .from('matches')
        .select('fixture_id')
        .not('home_goals', 'is', null)
        .not('away_goals', 'is', null);
      if (mErr) throw new Error(mErr.message);

      for (const m of finished ?? []) {
        const { error } = await supabase.rpc('calculate_match_scores', {
          p_fixture_id: m.fixture_id,
        });
        if (error) throw new Error(error.message);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    logError('POST /admin/scoring/recalculate', err);
    return sendError(res, 500, err.message);
  }
});

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

    if (active !== false) {
      try {
        await notifyNewAppVersion(version, changelog ?? '');
      } catch (e) {
        logError('notifyNewAppVersion', e);
      }
    }

    log(`Nueva versión creada por admin: ${version} (code ${versionCode})`);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    logError('POST /admin/app/version', err);
    return sendError(res, 400, err.message);
  }
});

/**
 * PUT /admin/app/version/:id
 * Actualiza una versión existente.
 * SOLO permite: active, forceUpdate, changelog
 */
app.put('/admin/app/version/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { version, versionCode, apkUrl, forceUpdate, changelog, active } = req.body ?? {};

    // Inmutabilidad: estos campos NO se pueden modificar luego de creado
    if (version !== undefined || versionCode !== undefined || apkUrl !== undefined) {
      return sendError(res, 400, 'No se permite modificar version, versionCode ni apkUrl');
    }

    const data = await updateVersion(id, {
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

/**
 * DELETE /admin/reset-stats
 * Resetea estadísticas: scores, ranking_cache, predictions, notifications, resultados de partidos.
 * NO toca usuarios, credenciales, scoring_config, slider, APK versions.
 * Requiere JWT admin.
 */
app.delete('/admin/reset-stats', requireAdmin, async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc('reset_all_stats');
    if (error) throw new Error(error.message);
    log('reset-stats ejecutado por admin');
    return res.json({ success: true, message: 'Estadísticas reseteadas. Usuarios y datos intactos.' });
  } catch (err) {
    logError('DELETE /admin/reset-stats', err);
    return sendError(res, 500, err.message);
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
