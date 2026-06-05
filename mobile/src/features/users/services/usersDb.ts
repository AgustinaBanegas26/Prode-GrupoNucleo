import { supabase } from '../../../lib/supabase';
import type { AppUser } from '../types';

const normalizeClienteId = (n: string) => n.trim();
const normalizeNombre = (n: string) => n.trim();

function isNewUser(id: string | undefined): boolean {
  if (!id || id.trim() === '') return true;
  const n = Number(id);
  return !Number.isFinite(n) || n <= 0;
}

function mapRowToUser(row: Record<string, unknown>): AppUser {
  return {
    id: String(row.id),
    clienteId: String(row.cliente_id),
    nombre: String(row.nombre ?? ''),
    email: null,
    activo: !!row.habilitado,
    primerLogin: !!row.primer_login,
    ultimoAcceso: row.ultimo_acceso ? new Date(String(row.ultimo_acceso)).getTime() : null,
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
  };
}

export async function readUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, cliente_id, nombre, habilitado, primer_login, ultimo_acceso, created_at, avatar_url')
    .order('nombre', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRowToUser);
}

export async function upsertUser(
  input: Omit<AppUser, 'createdAt' | 'ultimoAcceso'>,
): Promise<AppUser> {
  const normalizedClienteId = normalizeClienteId(input.clienteId);
  const normalizedNombre = normalizeNombre(input.nombre);

  if (!normalizedClienteId) throw new Error('El ID de cliente es requerido');
  if (!normalizedNombre) throw new Error('El nombre es requerido');

  const newUser = isNewUser(input.id);

  let dupQuery = supabase
    .from('clientes')
    .select('id')
    .eq('cliente_id', normalizedClienteId);

  if (!newUser) {
    dupQuery = dupQuery.neq('id', Number(input.id));
  }

  const { data: existing, error: checkError } = await dupQuery.maybeSingle();
  if (checkError) throw new Error(checkError.message);
  if (existing?.id != null) {
    throw new Error('Ya existe un usuario con ese ID de cliente.');
  }

  if (newUser) {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        cliente_id: normalizedClienteId,
        nombre: normalizedNombre,
        habilitado: !!input.activo,
        primer_login: true,
        password_hash: null,
      })
      .select('id, cliente_id, nombre, habilitado, primer_login, ultimo_acceso, created_at, avatar_url')
      .single();

    if (error) throw new Error(error.message);
    return mapRowToUser(data);
  }

  const { data, error } = await supabase
    .from('clientes')
    .update({
      cliente_id: normalizedClienteId,
      nombre: normalizedNombre,
      habilitado: !!input.activo,
    })
    .eq('id', Number(input.id))
    .select('id, cliente_id, nombre, habilitado, primer_login, ultimo_acceso, created_at, avatar_url')
    .single();

  if (error) throw new Error(error.message);
  return mapRowToUser(data);
}

export async function deleteUser(userId: string): Promise<void> {
  const id = Number(userId);
  if (!Number.isFinite(id)) throw new Error('ID de usuario inválido');

  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function resetUserToInitialPassword(userId: string): Promise<void> {
  const id = Number(userId);
  if (!Number.isFinite(id)) throw new Error('ID de usuario inválido');

  const { error } = await supabase
    .from('clientes')
    .update({
      password_hash: null,
      primer_login: true,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function setUserActivo(userId: string, activo: boolean): Promise<void> {
  const id = Number(userId);
  if (!Number.isFinite(id)) throw new Error('ID de usuario inválido');

  const { error } = await supabase
    .from('clientes')
    .update({ habilitado: !!activo })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function ensureDevInitialAdmin(): Promise<void> {
  // no-op
}
