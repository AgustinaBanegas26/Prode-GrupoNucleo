import { supabase } from '../../../lib/supabase';
import type { AppUser, UserRole } from '../types';

type StoredUser = AppUser & {
  password?: string;
};

const normalizeEmployeeNumber = (n: string) => n.trim();

function mapRowToUser(row: any): AppUser {
  return {
    id: row.id,
    numeroEmpleado: row.numero_empleado,
    nombre: row.nombre,
    apellido: row.apellido,
    email: row.email,
    empresa: row.empresa,
    rol: row.rol as UserRole,
    activo: row.activo,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function readUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapRowToUser);
}

export async function getUserByNumeroEmpleado(numeroEmpleado: string): Promise<AppUser | null> {
  const normalized = normalizeEmployeeNumber(numeroEmpleado);
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('numero_empleado', normalized)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRowToUser(data) : null;
}

export async function upsertUser(
  input: Omit<AppUser, 'createdAt' | 'updatedAt'>,
): Promise<AppUser> {
  const normalizedNumeroEmpleado = normalizeEmployeeNumber(input.numeroEmpleado);
  
  // Check if numero_empleado is already taken by another user
  const { data: existing, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('numero_empleado', normalizedNumeroEmpleado)
    .neq('id', input.id)
    .maybeSingle();
  
  if (checkError) throw checkError;
  if (existing) {
    throw new Error('Ya existe un usuario con ese número de empleado.');
  }

  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: input.id,
      numero_empleado: normalizedNumeroEmpleado,
      nombre: input.nombre,
      apellido: input.apellido,
      email: input.email,
      empresa: input.empresa,
      rol: input.rol,
      activo: input.activo,
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return mapRowToUser(data);
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  if (error) throw error;
}

export async function setUserPassword(userId: string, password: string): Promise<void> {
  // For now, we'll handle password differently since we don't store it in the same table
  // We could add a separate passwords table or use Supabase Auth later
  // For this version, we'll just log it
  console.log(`Setting password for user ${userId} to ${password}`);
}

export async function setUserActivo(userId: string, activo: boolean): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ activo })
    .eq('id', userId);
  if (error) throw error;
}
