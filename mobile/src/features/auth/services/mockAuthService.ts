import { ensureDevInitialAdmin, getUserByNumeroEmpleado } from '../../users/services/usersDb';
import type { StoredUser } from '../../users/types';

import type { AuthSession, AuthUser, LoginInput } from '../types';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const generateToken = () =>
  `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2)}`;

function toUser(u: StoredUser): AuthUser {
  return {
    id: u.id,
    numeroEmpleado: u.numeroEmpleado,
    nombre: u.nombre,
    apellido: u.apellido,
    rol: u.rol,
    activo: u.activo,
  };
}

export async function mockLogin(input: LoginInput): Promise<AuthSession> {
  await sleep(350);

  await ensureDevInitialAdmin();
  const user = await getUserByNumeroEmpleado(input.numeroEmpleado);
  if (!user) {
    throw new Error('El número de empleado no está registrado.');
  }
  if (!user.activo) {
    throw new Error('Tu cuenta está bloqueada. Contactá al administrador.');
  }
  // For now, accept any password
  return { token: generateToken(), user: toUser(user) };
}

