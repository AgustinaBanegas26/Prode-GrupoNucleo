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
  return Linking.createURL('reset-password');
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

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo,
  });

  if (error) {
    throw mapSupabaseAuthError(error.message);
  }
}

/**
 * Establece la sesión de recuperación a partir del deep link del correo.
 */
export async function establishRecoverySessionFromUrl(url: string): Promise<boolean> {
  const params = parseUrlParams(url);
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const type = params.type;

  if (type && type !== 'recovery') {
    throw new PasswordRecoveryError('Enlace de recuperación inválido.', 'invalid_link');
  }

  if (!accessToken || !refreshToken) {
    return false;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw mapSupabaseAuthError(error.message);
  }

  return true;
}

/**
 * Verifica que exista una sesión activa de recuperación.
 */
export async function hasActiveRecoverySession(): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
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

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
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
    if (url.includes('type=recovery') || url.includes('access_token')) {
      onRecoveryUrl(url);
    }
  });

  Linking.getInitialURL().then((url) => {
    if (url && (url.includes('type=recovery') || url.includes('access_token'))) {
      onRecoveryUrl(url);
    }
  });

  return () => subscription.remove();
}
