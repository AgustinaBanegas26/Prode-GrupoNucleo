// Edge Function: ensure-auth-user
// Crea (si no existe) el usuario correspondiente en auth.users para habilitar resetPasswordForEmail().
//
// Motivación: este proyecto usa login legacy (admins/clientes + bcrypt) y muchos usuarios pueden
// existir solo en tablas públicas. Supabase Auth NO envía emails de recuperación si el email no
// existe en auth.users.
//
// Seguridad:
// - No expone service_role al cliente
// - No revela si el usuario existe o no (respuesta siempre "ok: true")
// - Solo intenta crear en Auth si el email existe en admins o clientes

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function randomPassword() {
  // password random únicamente para poder crear el user; el usuario luego lo cambia vía recovery.
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      // No rompemos el cliente: devolvemos ok, pero dejamos info para logs del function.
      console.error('[ensure-auth-user] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return jsonResponse({ ok: true, ensured: false });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';

    if (!email) {
      return jsonResponse({ ok: true, ensured: false });
    }

    // Solo intentamos crear el usuario si existe en nuestras tablas legacy.
    // Nota: usamos ilike para evitar problemas de case.
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id,email,usuario')
      .ilike('email', email)
      .maybeSingle();

    const { data: client } = admin?.id
      ? { data: null }
      : await supabaseAdmin.from('clientes').select('id,email,cliente_id,nombre').ilike('email', email).maybeSingle();

    if (!admin?.id && !client?.id) {
      // Respuesta opaca: no revelamos si existe o no.
      return jsonResponse({ ok: true, ensured: false });
    }

    const role = admin?.id ? 'admin' : 'client';
    const legacyId = admin?.id ? admin.id : client?.id;

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: randomPassword(),
      email_confirm: true,
      user_metadata: {
        role,
        legacy_id: legacyId,
        legacy_table: admin?.id ? 'admins' : 'clientes',
      },
    });

    // Si ya existe, no consideramos error bloqueante.
    if (error && !/already registered/i.test(error.message)) {
      console.error('[ensure-auth-user] createUser error:', error);
      return jsonResponse({ ok: true, ensured: false });
    }

    return jsonResponse({ ok: true, ensured: true });
  } catch (e) {
    console.error('[ensure-auth-user] unhandled error:', e);
    // Importante: no romper el flujo de la app
    return jsonResponse({ ok: true, ensured: false });
  }
});

