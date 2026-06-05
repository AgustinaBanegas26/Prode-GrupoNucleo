'use strict';

const { getSupabaseAdmin } = require('./supabaseAdmin');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Envía notificaciones Expo Push en chunks de 100.
 */
async function sendExpoPush(messages) {
  if (!messages.length) return { ok: true, sent: 0 };

  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  let sent = 0;
  for (const chunk of chunks) {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Expo push failed: ${res.status} ${text}`);
    }
    sent += chunk.length;
  }

  return { ok: true, sent };
}

async function getTokensForAudience(audience, targetUserId) {
  const supabase = getSupabaseAdmin();
  let q = supabase.from('push_tokens').select('expo_push_token, cliente_id, admin_id');

  if (audience === 'individual' && targetUserId) {
    q = q.or(`cliente_id.eq.${targetUserId},admin_id.eq.${targetUserId}`);
  } else if (audience === 'group') {
    // group = cliente_id prefix or custom — filter by cliente_id pattern if needed
    q = q.not('cliente_id', 'is', null);
  }

  const { data, error } = await q;
  if (error) throw error;

  const tokens = new Set();
  for (const row of data ?? []) {
    if (row.expo_push_token) tokens.add(row.expo_push_token);
  }
  return [...tokens];
}

async function processOutboxBatch(limit = 50) {
  const supabase = getSupabaseAdmin();

  const { data: pending, error } = await supabase
    .from('notifications_outbox')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  if (!pending?.length) return { processed: 0 };

  let processed = 0;

  for (const row of pending) {
    try {
      const tokens = await getTokensForAudience(row.audience, row.target_user_id);
      if (tokens.length) {
        const messages = tokens.map((to) => ({
          to,
          sound: 'default',
          title: row.title,
          body: row.body,
          data: row.data ?? {},
        }));
        await sendExpoPush(messages);
      }

      await supabase
        .from('notifications_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString(), error: null })
        .eq('id', row.id);

      processed += 1;
    } catch (err) {
      await supabase
        .from('notifications_outbox')
        .update({ status: 'failed', error: String(err.message ?? err) })
        .eq('id', row.id);
    }
  }

  return { processed };
}

module.exports = {
  sendExpoPush,
  getTokensForAudience,
  processOutboxBatch,
};
