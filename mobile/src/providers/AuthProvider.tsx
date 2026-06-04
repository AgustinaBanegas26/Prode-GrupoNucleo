import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '../lib/supabase';

export interface SessionUser {
  id: string | number;
  cliente_id?: string;
  usuario?: string;
  nombre: string;
  role: 'client' | 'admin';
  mustChangePassword?: boolean;
}

type LoginResult = {
  mustChangePassword: boolean;
  tempUser?: SessionUser;
  role?: 'client' | 'admin';
};

type AuthContextValue = {
  user: SessionUser | null;
  role: 'client' | 'admin' | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  changePassword: (tempUser: SessionUser, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'prode_auth_session_v1';

function requiresPasswordChange(record: {
  primer_login?: boolean;
  must_change_password?: boolean;
}): boolean {
  return Boolean(record.must_change_password ?? record.primer_login);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [role, setRole] = useState<'client' | 'admin' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SessionUser;
          setUser(parsed);
          setRole(parsed.role);
        }
      } catch (e) {
        console.error('Error restoring auth session:', e);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const saveSession = async (sessionUser: SessionUser) => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    setRole(sessionUser.role);
  };

  const login = async (identifier: string, password: string): Promise<LoginResult> => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    if (
      !supabaseUrl ||
      supabaseUrl.includes('your-project-id') ||
      !supabaseKey ||
      supabaseKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
    ) {
      throw new Error(
        'Supabase no está configurado. Por favor, editá el archivo .env en la carpeta mobile con las credenciales reales de tu base de datos.',
      );
    }

    const cleanIdentifier = identifier.trim();
    const isSearchAdmin = !/^\d+$/.test(cleanIdentifier);

    if (isSearchAdmin) {
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('usuario', cleanIdentifier)
        .maybeSingle();

      if (error) {
        throw new Error(`Error de base de datos: ${error.message}`);
      }

      if (!admin) {
        throw new Error('Usuario no encontrado');
      }

      if (!admin.habilitado) {
        throw new Error('Usuario deshabilitado');
      }

      if (requiresPasswordChange(admin)) {
        if (password === 'AdminProde1670') {
          const tempUser: SessionUser = {
            id: admin.id,
            usuario: admin.usuario,
            nombre: admin.usuario,
            role: 'admin',
            mustChangePassword: true,
          };
          await saveSession(tempUser);
          return { mustChangePassword: true, tempUser, role: 'admin' };
        }
        throw new Error('Contraseña incorrecta');
      }

      const match = await bcrypt.compare(password, admin.password_hash || '');
      if (!match) {
        throw new Error('Contraseña incorrecta');
      }

      const sessionUser: SessionUser = {
        id: admin.id,
        usuario: admin.usuario,
        nombre: admin.usuario,
        role: 'admin',
        mustChangePassword: false,
      };

      await saveSession(sessionUser);
      return { mustChangePassword: false, role: 'admin' };
    }

    const clienteIdNumeric = Number(cleanIdentifier);
    const { data: client, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('cliente_id', clienteIdNumeric)
      .maybeSingle();

    if (error) {
      throw new Error(`Error de base de datos: ${error.message}`);
    }

    if (!client) {
      throw new Error('Usuario no encontrado');
    }

    if (!client.habilitado) {
      throw new Error('Usuario deshabilitado');
    }

    if (requiresPasswordChange(client)) {
      if (password === cleanIdentifier) {
        const tempUser: SessionUser = {
          id: client.id,
          cliente_id: client.cliente_id,
          nombre: client.nombre,
          role: 'client',
          mustChangePassword: true,
        };
        await saveSession(tempUser);
        return { mustChangePassword: true, tempUser, role: 'client' };
      }
      throw new Error('Contraseña incorrecta');
    }

    const match = await bcrypt.compare(password, client.password_hash || '');
    if (!match) {
      throw new Error('Contraseña incorrecta');
    }

    await supabase
      .from('clientes')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', client.id);

    const sessionUser: SessionUser = {
      id: client.id,
      cliente_id: client.cliente_id,
      nombre: client.nombre,
      role: 'client',
      mustChangePassword: false,
    };

    await saveSession(sessionUser);
    return { mustChangePassword: false, role: 'client' };
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      setUser(null);
      setRole(null);
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error on logout:', e);
    }
  };

  const changePassword = async (tempUser: SessionUser, newPassword: string) => {
    if (newPassword.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-ZÁÉÍÓÚÑ]/.test(newPassword)) {
      throw new Error('La contraseña debe incluir al menos una mayúscula');
    }
    if (!/[0-9]/.test(newPassword)) {
      throw new Error('La contraseña debe incluir al menos un número');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    if (tempUser.role === 'admin') {
      const { data, error } = await supabase
        .from('admins')
        .update({
          password_hash: hash,
          primer_login: false,
          must_change_password: false,
        })
        .eq('id', tempUser.id)
        .select();

      if (error) {
        throw new Error(`Error de base de datos al cambiar contraseña: ${error.message}`);
      }
      if (!data || data.length === 0) {
        throw new Error('Error al actualizar la contraseña del administrador en la base de datos');
      }
    } else {
      const { data, error } = await supabase
        .from('clientes')
        .update({
          password_hash: hash,
          primer_login: false,
          must_change_password: false,
          ultimo_acceso: new Date().toISOString(),
        })
        .eq('id', tempUser.id)
        .select();

      if (error) {
        throw new Error(`Error de base de datos al cambiar contraseña: ${error.message}`);
      }
      if (!data || data.length === 0) {
        throw new Error('Error al actualizar la contraseña del cliente en la base de datos');
      }
    }

    const sessionUser: SessionUser = {
      ...tempUser,
      mustChangePassword: false,
    };
    await saveSession(sessionUser);
  };

  const value = useMemo(
    () => ({
      user,
      role,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      changePassword,
    }),
    [user, role, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
