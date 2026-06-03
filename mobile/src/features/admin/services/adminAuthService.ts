export type AdminAuthResult =
  | { ok: true; token: string; username: string }
  | { ok: false };

export type AdminAuthService = {
  signIn: (username: string, password: string) => Promise<AdminAuthResult>;
};

const generateToken = () =>
  `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

export const devAdminAuthService: AdminAuthService = {
  async signIn(username, password) {
    if (username === 'admin' && password === '1234') {
      return { ok: true, token: generateToken(), username };
    }
    return { ok: false };
  },
};

