import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppUser, StoredUser, UserRole } from '../types';

const USERS_KEY = 'app_users_v1';
const LEGACY_USERS_KEY = 'mock_auth_users_v1';

type LegacyUser = {
  customerNumber: string;
  email: string;
  password: string;
};

const now = () => Date.now();

const normalizeEmployeeNumber = (n: string) => n.trim();

function toStoredUser(u: unknown): StoredUser | null {
  if (!u || typeof u !== 'object') return null;
  const obj = u as Record<string, unknown>;

  const password = typeof obj.password === 'string' ? obj.password : '';
  const numeroEmpleado =
    typeof obj.numeroEmpleado === 'string'
      ? normalizeEmployeeNumber(obj.numeroEmpleado)
      : typeof obj.customerNumber === 'string'
        ? normalizeEmployeeNumber(obj.customerNumber)
        : '';

  if (!numeroEmpleado || !password) return null;

  const id = typeof obj.id === 'string' ? obj.id : numeroEmpleado;
  const nombre =
    typeof obj.nombre === 'string'
      ? obj.nombre
      : typeof obj.firstName === 'string'
        ? obj.firstName
        : '';
  const apellido =
    typeof obj.apellido === 'string'
      ? obj.apellido
      : typeof obj.lastName === 'string'
        ? obj.lastName
        : '';

  const activo =
    typeof obj.activo === 'boolean'
      ? obj.activo
      : obj.status === 'inactive' || obj.status === 'blocked'
        ? false
        : true;

  const rol = (() => {
    if (obj.rol === 'admin' || obj.rol === 'usuario') return obj.rol as UserRole;
    if (obj.role === 'admin') return 'admin' as const;
    return 'usuario' as const;
  })();

  const createdAt = typeof obj.createdAt === 'number' ? obj.createdAt : now();
  const updatedAt = typeof obj.updatedAt === 'number' ? obj.updatedAt : createdAt;

  return {
    id,
    numeroEmpleado,
    nombre,
    apellido,
    rol,
    activo,
    createdAt,
    updatedAt,
    password,
  };
}

async function readJsonArray(key: string): Promise<unknown[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed;
}

async function writeUsers(users: StoredUser[]) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function migrateLegacyUsersIfNeeded(): Promise<void> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (raw) return;

  const legacy = await readJsonArray(LEGACY_USERS_KEY);
  const migrated = legacy
    .map((u) => {
      const legacyUser = u as Partial<LegacyUser>;
      if (!legacyUser.customerNumber || !legacyUser.email || !legacyUser.password) return null;

      const createdAt = now();
      const user: StoredUser = {
        id: legacyUser.customerNumber,
        numeroEmpleado: legacyUser.customerNumber,
        nombre: '',
        apellido: '',
        rol: 'usuario',
        activo: true,
        createdAt,
        updatedAt: createdAt,
        password: legacyUser.password,
      };
      return user;
    })
    .filter((u): u is StoredUser => !!u);

  if (migrated.length > 0) {
    await writeUsers(migrated);
  } else {
    await writeUsers([]);
  }
}

async function ensureInitialAdminIfMissing(): Promise<void> {
  const users = await readUsers();
  const exists = users.some((u) => u.numeroEmpleado === '0001');
  if (exists) return;

  const createdAt = now();
  const initial: StoredUser = {
    id: '0001',
    numeroEmpleado: '0001',
    nombre: 'Admin',
    apellido: 'Dev',
    password: '1234',
    rol: 'admin',
    activo: true,
    createdAt,
    updatedAt: createdAt,
  };

  await writeUsers([...users, initial]);
}

export async function readUsers(): Promise<StoredUser[]> {
  await migrateLegacyUsersIfNeeded();
  const rawUsers = await readJsonArray(USERS_KEY);
  const users = rawUsers.map(toStoredUser).filter((u): u is StoredUser => !!u);
  return users;
}

export async function getUserByNumeroEmpleado(numeroEmpleado: string): Promise<StoredUser | null> {
  const normalized = normalizeEmployeeNumber(numeroEmpleado);
  const users = await readUsers();
  return users.find((u) => u.numeroEmpleado === normalized) ?? null;
}

export async function upsertUser(
  input: Omit<AppUser, 'createdAt' | 'updatedAt'> & {
    createdAt?: number;
    updatedAt?: number;
    password?: string;
  },
): Promise<StoredUser> {
  await ensureInitialAdminIfMissing();
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === input.id);
  const normalizedNumeroEmpleado = normalizeEmployeeNumber(input.numeroEmpleado);
  const numeroEmpleadoTaken = users.some((u) => u.numeroEmpleado === normalizedNumeroEmpleado && u.id !== input.id);
  if (numeroEmpleadoTaken) {
    throw new Error('Ya existe un usuario con ese número de empleado.');
  }

  const baseCreatedAt = input.createdAt ?? (idx >= 0 ? users[idx].createdAt : now());
  const next: StoredUser = {
    id: input.id,
    numeroEmpleado: normalizedNumeroEmpleado,
    nombre: input.nombre,
    apellido: input.apellido,
    rol: input.rol,
    activo: input.activo,
    createdAt: baseCreatedAt,
    updatedAt: input.updatedAt ?? now(),
    password: input.password ?? (idx >= 0 ? users[idx].password : '1234'),
  };

  const nextUsers = idx >= 0 ? [...users.slice(0, idx), next, ...users.slice(idx + 1)] : [...users, next];
  await writeUsers(nextUsers);
  return next;
}

export async function deleteUser(userId: string): Promise<void> {
  const users = await readUsers();
  await writeUsers(users.filter((u) => u.id !== userId));
}

export async function setUserPassword(userId: string, password: string): Promise<void> {
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return;
  const next: StoredUser = { ...users[idx], password, updatedAt: now() };
  await writeUsers([...users.slice(0, idx), next, ...users.slice(idx + 1)]);
}

export async function setUserActivo(userId: string, activo: boolean): Promise<void> {
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return;
  const next: StoredUser = { ...users[idx], activo, updatedAt: now() };
  await writeUsers([...users.slice(0, idx), next, ...users.slice(idx + 1)]);
}

export async function ensureDevInitialAdmin(): Promise<void> {
  await ensureInitialAdminIfMissing();
}
