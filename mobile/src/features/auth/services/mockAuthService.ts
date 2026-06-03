import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getUserByCustomerNumber,
  getUserByEmail,
  readUsers,
  setUserPassword,
  upsertUser,
} from '../../users/services/usersDb';
import type { StoredUser } from '../../users/types';

import type {
  AuthSession,
  AuthUser,
  CreatePasswordInput,
  LoginInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from '../types';

type ResetCodeRecord = {
  email: string;
  code: string;
  createdAt: number;
};

const RESET_CODES_KEY = 'mock_auth_reset_codes_v1';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const generateToken = () =>
  `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2)}`;

const generateCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;

async function readResetCodes(): Promise<ResetCodeRecord[]> {
  const raw = await AsyncStorage.getItem(RESET_CODES_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed as ResetCodeRecord[];
}

async function writeResetCodes(records: ResetCodeRecord[]) {
  await AsyncStorage.setItem(RESET_CODES_KEY, JSON.stringify(records));
}

function toUser(u: StoredUser): AuthUser {
  return { customerNumber: u.customerNumber, email: u.email };
}

export async function mockLogin(input: LoginInput): Promise<AuthSession> {
  await sleep(350);

  const user = await getUserByCustomerNumber(input.customerNumber);
  if (!user) {
    throw new Error('El número de cliente no está registrado. Usá "Primer acceso".');
  }
  if (user.status === 'blocked') {
    throw new Error('Tu cuenta está bloqueada. Contactá al administrador.');
  }
  if (user.password !== input.password) {
    throw new Error('La contraseña es incorrecta.');
  }

  return { token: generateToken(), user: toUser(user) };
}

export async function mockCreatePassword(input: CreatePasswordInput): Promise<AuthSession> {
  await sleep(400);

  const users = await readUsers();
  const existing = users.find((u) => u.customerNumber === input.customerNumber);

  if (existing) {
    throw new Error('Este número de cliente ya tiene contraseña. Iniciá sesión.');
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const sameEmail = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (sameEmail) {
    throw new Error('Este email ya está asociado a otro número de cliente.');
  }

  const createdAt = Date.now();
  const created = await upsertUser({
    id: input.customerNumber,
    firstName: '',
    lastName: '',
    email: normalizedEmail,
    username: input.customerNumber,
    customerNumber: input.customerNumber,
    status: 'active',
    role: 'user',
    createdAt,
    updatedAt: createdAt,
    password: input.password,
  });

  return { token: generateToken(), user: toUser(created) };
}

export async function mockRequestPasswordReset(
  input: RequestPasswordResetInput,
): Promise<{ code: string }> {
  await sleep(450);

  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);
  if (!user) {
    throw new Error('No existe una cuenta con ese email.');
  }

  const code = generateCode();
  const records = await readResetCodes();

  const next = [
    ...records.filter((r) => r.email.toLowerCase() !== normalizedEmail),
    { email: normalizedEmail, code, createdAt: Date.now() },
  ];

  await writeResetCodes(next);
  return { code };
}

export async function mockResetPassword(input: ResetPasswordInput): Promise<void> {
  await sleep(450);

  const normalizedEmail = input.email.trim().toLowerCase();
  const records = await readResetCodes();
  const record = records.find((r) => r.email.toLowerCase() === normalizedEmail);

  if (!record || record.code !== input.code.trim()) {
    throw new Error('El código es inválido.');
  }

  const user = await getUserByEmail(normalizedEmail);
  if (!user) {
    throw new Error('No existe una cuenta con ese email.');
  }
  await setUserPassword(user.id, input.newPassword);

  const nextRecords = records.filter((r) => r.email.toLowerCase() !== normalizedEmail);
  await writeResetCodes(nextRecords);
}

