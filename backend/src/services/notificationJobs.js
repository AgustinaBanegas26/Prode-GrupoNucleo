'use strict';

const cron = require('node-cron');
const { getSupabaseAdmin } = require('./supabaseAdmin');
const { processOutboxBatch, getTokensForAudience, sendExpoPush } = require('./pushService');

function log(msg) {
  console.log(`[notificationJobs] ${new Date().toISOString()} — ${msg}`);
}

async function enqueueOutbox(row) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('notifications_outbox').insert(row);
  if (error) throw error;
}

async function wasLogged(eventType, fixtureId, clienteId) {
  const supabase = getSupabaseAdmin();
  let q = supabase
    .from('notification_log')
    .select('id')
    .eq('event_type', eventType);

  if (fixtureId != null) q = q.eq('fixture_id', fixtureId);
  if (clienteId != null) q = q.eq('cliente_id', clienteId);
  else q = q.is('cliente_id', null);

  const { data } = await q.maybeSingle();
  return !!data?.id;
}

async function logSent(eventType, fixtureId, clienteId) {
  const supabase = getSupabaseAdmin();
  await supabase.from('notification_log').insert({
    event_type: eventType,
    fixture_id: fixtureId ?? null,
    cliente_id: clienteId ?? null,
  });
}

/**
 * A) 10 minutos antes: usuarios sin predicción completa para ese partido.
 */
async function runTenMinuteReminders() {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const windowStart = new Date(now.getTime() + 9 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 11 * 60 * 1000);

  const { data: matches, error } = await supabase
    .from('matches')
    .select('fixture_id, home_team, away_team, match_date')
    .gte('match_date', windowStart.toISOString())
    .lte('match_date', windowEnd.toISOString());

  if (error) throw error;

  for (const m of matches ?? []) {
    if (await wasLogged('reminder_10m', m.fixture_id, null)) continue;

    await supabase.rpc('lock_predictions_for_fixture', { p_fixture_id: m.fixture_id });

    const { data: allClients } = await supabase
      .from('clientes')
      .select('cliente_id')
      .eq('habilitado', true);

    const { data: preds } = await supabase
      .from('predictions')
      .select('cliente_id, home_goals, away_goals')
      .eq('fixture_id', m.fixture_id);

    const complete = new Set(
      (preds ?? [])
        .filter((p) => p.home_goals != null && p.away_goals != null)
        .map((p) => String(p.cliente_id)),
    );

    const missing = (allClients ?? []).filter(
      (c) => !complete.has(String(c.cliente_id)),
    );

    const title = '⚽ Últimos minutos';
    const body = `⚽ Últimos minutos para cargar tu predicción: ${m.home_team} vs ${m.away_team}`;

    for (const c of missing) {
      const clienteId = String(c.cliente_id);
      if (await wasLogged('reminder_10m_user', m.fixture_id, clienteId)) continue;

      const tokens = await getTokensForAudience('individual', clienteId);
      if (tokens.length) {
        await sendExpoPush(
          tokens.map((to) => ({ to, sound: 'default', title, body, data: { fixture_id: m.fixture_id } })),
        );
      }

      await logSent('reminder_10m_user', m.fixture_id, clienteId);
    }

    await logSent('reminder_10m', m.fixture_id, null);
    log(`10m reminder fixture ${m.fixture_id}: ${missing.length} users`);
  }
}

/**
 * B) Recordatorio diario de predicciones pendientes del día.
 */
async function runDailyReminder() {
  const supabase = getSupabaseAdmin();

  const { data: settings } = await supabase
    .from('notification_settings')
    .select('daily_reminder_enabled')
    .eq('id', 1)
    .maybeSingle();

  if (settings && !settings.daily_reminder_enabled) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: lastDaily } = await supabase
    .from('notification_log')
    .select('created_at')
    .eq('event_type', 'daily_reminder')
    .is('fixture_id', null)
    .is('cliente_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastDaily?.created_at && new Date(lastDaily.created_at) >= today) {
    return;
  }

  const { data: matchesToday } = await supabase
    .from('matches')
    .select('fixture_id')
    .gte('match_date', today.toISOString())
    .lt('match_date', tomorrow.toISOString());

  const fixtureIds = (matchesToday ?? []).map((m) => m.fixture_id);
  if (!fixtureIds.length) return;

  const { data: clients } = await supabase
    .from('clientes')
    .select('cliente_id')
    .eq('habilitado', true);

  const { data: preds } = await supabase
    .from('predictions')
    .select('cliente_id, fixture_id, home_goals, away_goals')
    .in('fixture_id', fixtureIds);

  const completeByClient = new Map();
  for (const p of preds ?? []) {
    if (p.home_goals == null || p.away_goals == null) continue;
    const key = String(p.cliente_id);
    completeByClient.set(key, (completeByClient.get(key) ?? 0) + 1);
  }

  const title = '🏆 Predicciones de hoy';
  const body = '🏆 No te olvides de cargar tus predicciones de hoy';

  let sent = 0;
  for (const c of clients ?? []) {
    const clienteId = String(c.cliente_id);
    const done = completeByClient.get(clienteId) ?? 0;
    if (done >= fixtureIds.length) continue;

    const tokens = await getTokensForAudience('individual', clienteId);
    if (tokens.length) {
      await sendExpoPush(tokens.map((to) => ({ to, sound: 'default', title, body })));
      sent += 1;
    }
  }

  await logSent('daily_reminder', null, null);
  log(`Daily reminder sent to ~${sent} users`);
}

/**
 * D) Nueva versión APK activada — detectada por outbox trigger o admin.
 */
async function notifyNewAppVersion(version, changelog) {
  await enqueueOutbox({
    event_type: 'app_version_active',
    title: '🆕 Nueva versión disponible',
    body: '🆕 Nueva versión disponible. ¡Actualizá la app!',
    data: { version, changelog },
    audience: 'global',
    status: 'pending',
  });
}

function startNotificationJobs() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[notificationJobs] SUPABASE no configurado — jobs deshabilitados');
    return;
  }

  cron.schedule('* * * * *', async () => {
    try {
      await processOutboxBatch(30);
    } catch (e) {
      log(`outbox error: ${e.message}`);
    }
  });

  cron.schedule('* * * * *', async () => {
    try {
      await runTenMinuteReminders();
    } catch (e) {
      log(`10m error: ${e.message}`);
    }
  });

  cron.schedule('0 12 * * *', async () => {
    try {
      await runDailyReminder();
    } catch (e) {
      log(`daily error: ${e.message}`);
    }
  });

  log('Cron de notificaciones iniciado');
}

module.exports = {
  startNotificationJobs,
  notifyNewAppVersion,
  runTenMinuteReminders,
  runDailyReminder,
  processOutboxBatch,
};
