import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppUser, StoredUser, UserRole, UserStatus } from '../types';

const USERS_KEY = 'app_users_v1';
const LEGACY_USERS_KEY = 'mock_auth_users_v1';

type LegacyUser = {
  customerNumber: string;
  email: string;
  password: string;
};

const now = () => Date.now();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function toStoredUser(u: unknown): StoredUser | null {
  if (!u || typeof u !== 'object') return null;
  const obj = u as Record<string, unknown>;

  const customerNumber = typeof obj.customerNumber === 'string' ? obj.customerNumber : '';
  const email = typeof obj.email === 'string' ? normalizeEmail(obj.email) : '';
  const password = typeof obj.password === 'string' ? obj.password : '';

  if (!customerNumber || !email || !password) return null;

  const id = typeof obj.id === 'string' ? obj.id : customerNumber;
  const firstName = typeof obj.firstName === 'string' ? obj.firstName : '';
  const lastName = typeof obj.lastName === 'string' ? obj.lastName : '';
  const username = typeof obj.username === 'string' ? obj.username : customerNumber;
  const status = (obj.status === 'inactive' || obj.status === 'blocked' || obj.status === 'active'
    ? obj.status
    : 'active') as UserStatus;
  const role = (obj.role === 'admin' || obj.role === 'user' ? obj.role : 'user') as UserRole;
  const createdAt = typeof obj.createdAt === 'number' ? obj.createdAt : now();
  const updatedAt = typeof obj.updatedAt === 'number' ? obj.updatedAt : createdAt;

  return {
    id,
    firstName,
    lastName,
    email,
    username,
    customerNumber,
    status,
    role,
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
        firstName: '',
        lastName: '',
        email: normalizeEmail(legacyUser.email),
        username: legacyUser.customerNumber,
        customerNumber: legacyUser.customerNumber,
        status: 'active',
        role: 'user',
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

export async function readUsers(): Promise<StoredUser[]> {
  await migrateLegacyUsersIfNeeded();
  const rawUsers = await readJsonArray(USERS_KEY);
  return rawUsers.map(toStoredUser).filter((u): u is StoredUser => !!u);
}

export async function getUserByCustomerNumber(customerNumber: string): Promise<StoredUser | null> {
  const users = await readUsers();
  return users.find((u) => u.customerNumber === customerNumber) ?? null;
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = normalizeEmail(email);
  const users = await readUsers();
  return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function upsertUser(
  input: Omit<AppUser, 'createdAt' | 'updatedAt'> & { createdAt?: number; updatedAt?: number; password?: string },
): Promise<StoredUser> {
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === input.id);

  const baseCreatedAt = input.createdAt ?? (idx >= 0 ? users[idx].createdAt : now());
  const next: StoredUser = {
    id: input.id,
    firstName: input.firstName,
    lastName: input.lastName,
    email: normalizeEmail(input.email),
    username: input.username,
    customerNumber: input.customerNumber,
    status: input.status,
    role: input.role,
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

export async function setUserStatus(userId: string, status: UserStatus): Promise<void> {
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return;
  const next: StoredUser = { ...users[idx], status, updatedAt: now() };
  await writeUsers([...users.slice(0, idx), next, ...users.slice(idx + 1)]);
}
