import type { AuthSession, AuthUser, LoginInput } from '../types';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const generateToken = () =>
  `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2)}`;

export async function mockLogin(input: LoginInput): Promise<AuthSession> {
  await sleep(150);
  // Este proyecto usa AuthProvider (login legacy contra tablas admins/clientes).
  // Este mock se mantiene solo para compatibilidad de imports antiguos.
  throw new Error('mockAuthService deshabilitado');
}

