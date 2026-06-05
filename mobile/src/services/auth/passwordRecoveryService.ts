import * as Linking from 'expo-linking';
import bcrypt from 'bcryptjs';

import { supabase } from '../../lib/supabase';

export type PasswordRecoveryErrorCode =
  | 'invalid_email'
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

async function ensureAuthUserExists(email: string): Promise<void> {
  // Importante: la app NO tiene service_role, por lo que no puede crear usuarios en auth.users.
  // Este hook intenta llamar a una Edge Function (opcional) que crea/sincroniza el usuario en Auth.
  // Si no está desplegada, el flujo sigue y Supabase NO enviará mail si el usuario no existe en auth.users.
  try {
    const { data, error } = await supabase.functions.invoke('ensure-auth-user', {
      body: { email },
    });
    if (error) {
      console.warn('[PasswordRecovery] ensure-auth-user falló:', error.message);
      return;
    }
    console.log('[PasswordRecovery] ensure-auth-user ok:', data);
  } catch (e) {
    console.warn('[PasswordRecovery] ensure-auth-user excepción:', e);
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
    'No se pudo completar la operación. Intentá nuevamente.',
    'unknown',
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
  });

  // Paso clave: si el proyecto usa login legacy (admins/clientes), es probable que no exista el user en auth.users
  // y Supabase no enviará mail (aunque resetPasswordForEmail devuelva "success" para evitar enumeración).
  await ensureAuthUserExists(normalizedEmail);

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo,
  });

  if (error) {
    console.error('[PasswordRecovery] resetPasswordForEmail error:', error);
    throw mapSupabaseAuthError(error.message);
  }

  console.log(
    '[PasswordRecovery] resetPasswordForEmail: request enviada (si el email existe en auth.users, llegará el correo).',
  );
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

  // Flujos posibles de Supabase:
  // 1) Implicit: #access_token=...&refresh_token=...
  // 2) PKCE: ?code=... (recomendado en SDKs nuevos) → exchangeCodeForSession
  // 3) token_hash (según template/config) → verifyOtp
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
