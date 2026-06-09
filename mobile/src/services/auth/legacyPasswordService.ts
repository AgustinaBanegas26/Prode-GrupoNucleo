import { supabase } from '../../lib/supabase';

export async function verifyLegacyPassword(
  role: 'client' | 'admin',
  userId: string,
  password: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_legacy_password', {
    p_role: role,
    p_user_id: userId,
    p_password: password,
  });

  if (error) {
    console.error('[LegacyPassword] verify_legacy_password error:', error.message);
    throw new Error('No se pudo verificar la contraseña.');
  }

  return Boolean(data);
}

export async function updateLegacyPassword(
  role: 'client' | 'admin',
  userId: string,
  newPassword: string,
  clienteId?: string,
): Promise<void> {
  const { data, error } = await supabase.rpc('update_legacy_password', {
    p_role: role,
    p_user_id: userId,
    p_new_password: newPassword,
    p_cliente_id: clienteId ?? null,
  });

  if (error) {
    console.error('[LegacyPassword] update_legacy_password error:', error.message);
    throw new Error(`Error al cambiar contraseña: ${error.message}`);
  }

  if (!data) {
    throw new Error('Error al cambiar contraseña: usuario no encontrado.');
  }
}

export async function syncLegacyPasswordByEmail(
  email: string,
  newPassword: string,
): Promise<void> {
  const { error } = await supabase.rpc('sync_legacy_password_by_email', {
    p_email: email,
    p_new_password: newPassword,
  });

  if (error) {
    console.warn('[LegacyPassword] sync_legacy_password_by_email error:', error.message);
  }
}
