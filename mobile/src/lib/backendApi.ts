const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');

export function getBackendUrl(): string {
  return BASE_URL;
}

export async function adminLogin(usuario: string, password: string): Promise<{ token: string }> {
  if (!BASE_URL) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL no configurada');
  }
  const res = await fetch(`${BASE_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || 'Error al iniciar sesión admin');
  }
  return { token: json.token };
}

export async function fetchAppVersion(): Promise<{
  version: string;
  versionCode: number;
  apkUrl: string | null;
  forceUpdate: boolean;
  changelog: string;
}> {
  if (!BASE_URL) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL no configurada');
  }
  const res = await fetch(`${BASE_URL}/app/version`);
  if (!res.ok) throw new Error('No se pudo obtener versión');
  return res.json();
}

export async function adminApiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  if (!BASE_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL no configurada');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
  return json as T;
}
