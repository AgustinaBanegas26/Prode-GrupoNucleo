import * as Linking from 'expo-linking';
import bcrypt from 'bcryptjs';

import { supabase } from '../../lib/supabase';

export type PasswordRecoveryErrorCode =
  | 'invalid_email'
  | 'email_not_found'
  | 'send_failed'
  | 'rate_limited'
  | 'session_expired'
  | 'invalid_link'
  | 'weak_password'
  | 'unknown';

export class PasswordRecoveryError extends Error {
  readonly code: PasswordRecoveryErrorCode;

  constructor(message: string, code: PasswordRecoveryErrorCode = 'unknown') {
    super(message);
    this.name = 'PasswordRecoveryError';
    this.code = code;
  }
}

function getPasswordResetRedirectUrl(): string {
  const configured = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL?.trim();
  if (configured) return configured;
  return 'prode-grupo-nucleo://reset-password';
}

function getBackendUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
  return url || null;
}

function getSupabaseFunctionsUrl(): string | null {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/functions/v1/ensure-auth-user`;
}

async function checkRecoveryEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_recovery_email', {
    p_email: email,
  });

  if (error) {
    // Si la RPC no está desplegada aún, no bloqueamos el flujo completo.
    console.warn('[PasswordRecovery] check_recovery_email no disponible:', error.message);
    return true;
  }

  return Boolean(data);
}

async function ensureAuthUserViaBackend(email: string, redirectTo: string): Promise<boolean> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) return false;

  const response = await fetch(`${backendUrl.replace(/\/$/, '')}/auth/password-recovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, redirectTo }),
  });

  if (response.ok) {
    return true;
  }

  const body = (await response.json().catch(() => ({}))) as { error?: string };
  const message = body.error?.trim();

  if (response.status === 404) {
    throw new PasswordRecoveryError('El correo no existe.', 'email_not_found');
  }
  if (response.status === 400 && message) {
    throw new PasswordRecoveryError(message, 'invalid_email');
  }
  if (message) {
    throw new PasswordRecoveryError(message, 'send_failed');
  }

  throw new PasswordRecoveryError(
    'No fue posible enviar el correo. Intente nuevamente.',
    'send_failed',
  );
}

async function ensureAuthUserViaEdgeFunction(email: string): Promise<boolean> {
  const functionUrl = getSupabaseFunctionsUrl();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!functionUrl || !anonKey) return false;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ email }),
    });

    if (response.status === 404) {
      console.warn('[PasswordRecovery] Edge Function ensure-auth-user no desplegada.');
      return false;
    }

    if (!response.ok) {
      console.warn('[PasswordRecovery] ensure-auth-user respondió', response.status);
      return false;
    }

    return true;
  } catch (e) {
    console.warn('[PasswordRecovery] ensure-auth-user no alcanzable:', e);
    return false;
  }
}

function mapSupabaseAuthError(message: string): PasswordRecoveryError {
  const lower = message.toLowerCase();

  if (lower.includes('invalid') && lower.includes('email')) {
    return new PasswordRecoveryError('Ingresá un email válido.', 'invalid_email');
  }
  if (lower.includes('rate') || lower.includes('too many')) {
    return new PasswordRecoveryError(
      'Demasiados intentos. Esperá unos minutos y volvé a intentar.',
      'rate_limited',
    );
  }
  if (
    lower.includes('session') ||
    lower.includes('expired') ||
    lower.includes('jwt') ||
    lower.includes('token')
  ) {
    return new PasswordRecoveryError(
      'El enlace expiró o ya fue utilizado. Solicitá uno nuevo.',
      'session_expired',
    );
  }
  if (lower.includes('password') && (lower.includes('weak') || lower.includes('least'))) {
    return new PasswordRecoveryError(
      'La contraseña no cumple los requisitos de seguridad.',
      'weak_password',
    );
  }

  return new PasswordRecoveryError(
    'No fue posible enviar el correo. Intente nuevamente.',
    'send_failed',
  );
}

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const tryParse = (segment: string) => {
    if (!segment) return;
    const search = segment.startsWith('?') ? segment.slice(1) : segment;
    const pairs = search.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
  };

  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');

  if (hashIndex >= 0) {
    tryParse(url.slice(hashIndex + 1));
  }
  if (queryIndex >= 0) {
    const queryEnd = hashIndex >= 0 ? hashIndex : url.length;
    tryParse(url.slice(queryIndex + 1, queryEnd));
  }

  return params;
}

/**
 * Envía el correo de recuperación con enlace seguro de Supabase Auth.
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const redirectTo = getPasswordResetRedirectUrl();

  console.log('[PasswordRecovery] sendPasswordResetEmail()', {
    email: normalizedEmail,
    redirectTo,
    backendUrl: getBackendUrl() ?? '(no configurado)',
  });

  const emailExists = await checkRecoveryEmailExists(normalizedEmail);
  if (!emailExists) {
    throw new PasswordRecoveryError('El correo no existe.', 'email_not_found');
  }

  // Backend con service_role: flujo completo (ensure + envío de correo).
  if (getBackendUrl()) {
    await ensureAuthUserViaBackend(normalizedEmail, redirectTo);
    console.log('[PasswordRecovery] correo solicitado vía backend.');
    return;
  }

  // Edge Function (si está desplegada) + resetPasswordForEmail desde el cliente.
  const ensured = await ensureAuthUserViaEdgeFunction(normalizedEmail);
  if (!ensured) {
    throw new PasswordRecoveryError(
      'No fue posible enviar el correo. Intente nuevamente.',
      'send_failed',
    );
  }

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo,
  });

  if (error) {
    console.error('[PasswordRecovery] resetPasswordForEmail error:', error);
    throw mapSupabaseAuthError(error.message);
  }

  console.log('[PasswordRecovery] resetPasswordForEmail: solicitud enviada.');
}

/**
 * Establece la sesión de recuperación a partir del deep link del correo.
 */
export async function establishRecoverySessionFromUrl(url: string): Promise<boolean> {
  console.log('[PasswordRecovery] establishRecoverySessionFromUrl() url:', url);
  const params = parseUrlParams(url);
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const type = params.type;
  const code = params.code;
  const tokenHash = params.token_hash;

  if (type && type !== 'recovery') {
    throw new PasswordRecoveryError('Enlace de recuperación inválido.', 'invalid_link');
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[PasswordRecovery] exchangeCodeForSession error:', error);
      throw mapSupabaseAuthError(error.message);
    }
    console.log('[PasswordRecovery] exchangeCodeForSession ok');
    return true;
  }

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: 'recovery',
      token_hash: tokenHash,
    });
    if (error) {
      console.error('[PasswordRecovery] verifyOtp error:', error);
      throw mapSupabaseAuthError(error.message);
    }
    console.log('[PasswordRecovery] verifyOtp ok');
    return true;
  }

  if (!accessToken || !refreshToken) {
    return false;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error('[PasswordRecovery] setSession error:', error);
    throw mapSupabaseAuthError(error.message);
  }

  console.log('[PasswordRecovery] setSession ok');
  return true;
}

/**
 * Verifica que exista una sesión activa de recuperación.
 */
export async function hasActiveRecoverySession(): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[PasswordRecovery] getSession error:', error);
    throw mapSupabaseAuthError(error.message);
  }
  return Boolean(data.session);
}

/**
 * Actualiza la contraseña del usuario autenticado vía Supabase Auth.
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('[PasswordRecovery] getSession (updatePassword) error:', sessionError);
    throw mapSupabaseAuthError(sessionError.message);
  }
  if (!sessionData.session) {
    throw new PasswordRecoveryError(
      'El enlace expiró o ya fue utilizado. Solicitá uno nuevo.',
      'session_expired',
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  const userEmail = userData.user?.email?.toLowerCase();
  console.log('[PasswordRecovery] updatePassword(): user email:', userEmail);

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    console.error('[PasswordRecovery] updateUser(password) error:', error);
    throw mapSupabaseAuthError(error.message);
  }

  if (userEmail) {
    await syncPasswordHashToLegacyTables(newPassword, userEmail);
  }

  await supabase.auth.signOut();
}

/**
 * Mantiene compatibilidad con tablas legacy (admins/clientes) que usan bcrypt.
 */
async function syncPasswordHashToLegacyTables(
  newPassword: string,
  email: string,
): Promise<void> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (admin?.id) {
    await supabase
      .from('admins')
      .update({
        password_hash: hash,
        primer_login: false,
        must_change_password: false,
      })
      .eq('id', admin.id);
    return;
  }

  const { data: client } = await supabase
    .from('clientes')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (client?.id) {
    await supabase
      .from('clientes')
      .update({
        password_hash: hash,
        primer_login: false,
        must_change_password: false,
        ultimo_acceso: new Date().toISOString(),
        password_actualizada: true,
        fecha_cambio_password: new Date().toISOString(),
      })
      .eq('id', client.id);
  }
}

/**
 * Escucha deep links de recuperación al abrir la app desde el correo.
 */
export function subscribeToPasswordRecoveryLinks(
  onRecoveryUrl: (url: string) => void,
): () => void {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    if (url.includes('type=recovery') || url.includes('access_token') || url.includes('code=')) {
      onRecoveryUrl(url);
    }
  });

  Linking.getInitialURL().then((url) => {
    if (url && (url.includes('type=recovery') || url.includes('access_token') || url.includes('code='))) {
      onRecoveryUrl(url);
    }
  });

  return () => subscription.remove();
}
