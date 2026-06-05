import { supabase } from '../../../lib/supabase';
import type { AppUser } from '../types';

const normalizeClienteId = (n: string) => n.trim();
const normalizeNombre = (n: string) => n.trim();
const normalizeEmail = (e: string | null | undefined) => (typeof e === 'string' ? e.trim().toLowerCase() : null);

function mapRowToUser(row: any): AppUser {
  return {
    id: String(row.id),
    clienteId: String(row.cliente_id),
    nombre: row.nombre,
    email: row.email ?? null,
    activo: !!row.habilitado,
    primerLogin: !!row.primer_login,
    ultimoAcceso: row.ultimo_acceso ? new Date(row.ultimo_acceso).getTime() : null,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : null,
  };
}

export async function readUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRowToUser);
}

export async function upsertUser(
  input: Omit<AppUser, 'createdAt' | 'ultimoAcceso'>,
): Promise<AppUser> {
  const id = String(input.id);
  const normalizedClienteId = normalizeClienteId(input.clienteId);
  const normalizedNombre = normalizeNombre(input.nombre);
  const normalizedEmail = normalizeEmail(input.email);

  if (!normalizedClienteId) throw new Error('clienteId es requerido');
  if (!normalizedNombre) throw new Error('nombre es requerido');

  // Check duplicado cliente_id en otro registro
  const { data: existing, error: checkError } = await supabase
    .from('clientes')
    .select('id')
    .eq('cliente_id', normalizedClienteId)
    .neq('id', id)
    .maybeSingle();
  if (checkError) throw checkError;
  if (existing?.id != null) {
    throw new Error('Ya existe un usuario con ese cliente_id.');
  }

  const { data, error } = await supabase
    .from('clientes')
    .upsert({
      id: Number(id),
      cliente_id: normalizedClienteId,
      nombre: normalizedNombre,
      email: normalizedEmail,
      habilitado: !!input.activo,
      // No tocamos password_hash aquí.
      // No tocamos primer_login aquí (se gestiona por reset/password recovery).
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return mapRowToUser(data);
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', Number(userId));
  if (error) throw error;
}

export async function resetUserToInitialPassword(userId: string): Promise<void> {
  // La app legacy usa contraseña inicial fija para clientes en primer ingreso.
  // Al resetear, se vuelve a "primer_login" y se borra el hash.
  const { error } = await supabase
    .from('clientes')
    .update({
      password_hash: null,
      primer_login: true,
      password_actualizada: false,
      fecha_cambio_password: null,
      must_change_password: true,
    })
    .eq('id', Number(userId));
  if (error) throw error;
}

export async function setUserActivo(userId: string, activo: boolean): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .update({ habilitado: !!activo })
    .eq('id', Number(userId));
  if (error) throw error;
}

export async function ensureDevInitialAdmin(): Promise<void> {
  // This is a no-op for now - we'll handle initial admin in Supabase
}
