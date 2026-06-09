'use strict';

const { getSupabaseAdmin } = require('./supabaseAdmin');

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function randomPassword() {
  const bytes = require('crypto').randomBytes(24);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function findLegacyUser(email) {
  const supabase = getSupabaseAdmin();

  const { data: admin, error: adminErr } = await supabase
    .from('admins')
    .select('id,email,usuario')
    .ilike('email', email)
    .maybeSingle();

  if (adminErr) throw new Error(adminErr.message);
  if (admin?.id) {
    return { role: 'admin', legacyId: admin.id, legacyTable: 'admins' };
  }

  const { data: client, error: clientErr } = await supabase
    .from('clientes')
    .select('id,email,cliente_id,nombre')
    .ilike('email', email)
    .maybeSingle();

  if (clientErr) throw new Error(clientErr.message);
  if (client?.id) {
    return { role: 'client', legacyId: client.id, legacyTable: 'clientes' };
  }

  return null;
}

async function ensureAuthUser(email, legacyUser) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.auth.admin.createUser({
    email,
    password: randomPassword(),
    email_confirm: true,
    user_metadata: {
      role: legacyUser.role,
      legacy_id: legacyUser.legacyId,
      legacy_table: legacyUser.legacyTable,
    },
  });

  if (error && !/already registered/i.test(error.message)) {
    throw new Error(error.message);
  }
}

/**
 * Verifica email legacy, asegura usuario en auth.users y envía correo de recuperación.
 */
async function requestPasswordRecovery(email, redirectTo) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    const err = new Error('Ingresá un email válido.');
    err.code = 'invalid_email';
    throw err;
  }

  const legacyUser = await findLegacyUser(normalizedEmail);
  if (!legacyUser) {
    const err = new Error('El correo no existe.');
    err.code = 'email_not_found';
    throw err;
  }

  await ensureAuthUser(normalizedEmail, legacyUser);

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo,
  });

  if (error) {
    const err = new Error('No fue posible enviar el correo. Intente nuevamente.');
    err.code = 'send_failed';
    throw err;
  }

  return { ok: true };
}

module.exports = { requestPasswordRecovery };
