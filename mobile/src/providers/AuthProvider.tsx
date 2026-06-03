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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [role, setRole] = useState<'client' | 'admin' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore session on app mount
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
    console.log("SESSION CREATED", sessionUser);
  };

  const login = async (identifier: string, password: string): Promise<LoginResult> => {
    console.log("LOGIN START");
    console.log("usuario ingresado:", identifier);

    // Validate environment variables first to avoid silent connection failures
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || supabaseUrl.includes('your-project-id') || !supabaseKey || supabaseKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')) {
      throw new Error('Supabase no está configurado. Por favor, editá el archivo .env en la carpeta mobile con las credenciales reales de tu base de datos.');
    }

    try {
      const cleanIdentifier = identifier.trim();

      // If the identifier contains letters, it is treated as an admin login. Otherwise, client.
      const isSearchAdmin = !/^\d+$/.test(cleanIdentifier);

      if (isSearchAdmin) {
        console.log("Buscando admin en Supabase:", cleanIdentifier);
        const { data: admin, error } = await supabase
          .from('admins')
          .select('*')
          .eq('usuario', cleanIdentifier)
          .maybeSingle();

        console.log("resultado de consulta Supabase (admin):", admin);
        if (error) {
          console.log("Error Supabase:", error);
          throw new Error(`Error de base de datos: ${error.message}`);
        }

        if (!admin) {
          throw new Error('Usuario no encontrado');
        }

        console.log("ADMIN FOUND", admin);
        console.log("valor de primer_login:", admin.primer_login);

        if (!admin.habilitado) {
          throw new Error('Usuario deshabilitado');
        }

        if (admin.primer_login) {
          console.log("FIRST LOGIN DETECTED (admin)");
          if (password === 'AdminProde1670') {
            console.log("PASSWORD VALID (temporal admin password)");
            const tempUser: SessionUser = {
              id: admin.id,
              usuario: admin.usuario,
              nombre: admin.usuario,
              role: 'admin',
            };
            return { mustChangePassword: true, tempUser, role: 'admin' };
          } else {
            console.log("PASSWORD INVALID (temporal admin password)");
            throw new Error('Contraseña incorrecta');
          }
        }

        // Compare using bcrypt
        const match = await bcrypt.compare(password, admin.password_hash || '');
        console.log("resultado de bcrypt.compare:", match);

        if (!match) {
          console.log("PASSWORD INVALID");
          throw new Error('Contraseña incorrecta');
        }

        console.log("PASSWORD VALID");
        const sessionUser: SessionUser = {
          id: admin.id,
          usuario: admin.usuario,
          nombre: admin.usuario,
          role: 'admin',
        };

        await saveSession(sessionUser);
        return { mustChangePassword: false, role: 'admin' };
      } else {
        console.log("Buscando cliente en Supabase:", cleanIdentifier);
        // cliente_id is an integer column in Supabase — cast to number to match types
        const clienteIdNumeric = Number(cleanIdentifier);
        console.log("cliente_id como número:", clienteIdNumeric);
        const { data: client, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('cliente_id', clienteIdNumeric)
          .maybeSingle();

        console.log("resultado de consulta Supabase (client):", client);
        if (error) {
          console.log("Error Supabase:", error);
          throw new Error(`Error de base de datos: ${error.message}`);
        }

        if (!client) {
          throw new Error('Usuario no encontrado');
        }

        console.log("CLIENT FOUND", client);
        console.log("valor de primer_login:", client.primer_login);

        if (!client.habilitado) {
          throw new Error('Usuario deshabilitado');
        }

        if (client.primer_login) {
          console.log("FIRST LOGIN DETECTED (client)");
          if (password === cleanIdentifier) {
            console.log("PASSWORD VALID (temporal client password)");
            const tempUser: SessionUser = {
              id: client.id,
              cliente_id: client.cliente_id,
              nombre: client.nombre,
              role: 'client',
            };
            return { mustChangePassword: true, tempUser, role: 'client' };
          } else {
            console.log("PASSWORD INVALID (temporal client password)");
            throw new Error('Contraseña incorrecta');
          }
        }

        // Compare using bcrypt
        const match = await bcrypt.compare(password, client.password_hash || '');
        console.log("resultado de bcrypt.compare:", match);

        if (!match) {
          console.log("PASSWORD INVALID");
          throw new Error('Contraseña incorrecta');
        }

        console.log("PASSWORD VALID");

        // Update last access timestamp
        const { error: updateErr } = await supabase
          .from('clientes')
          .update({ ultimo_acceso: new Date().toISOString() })
          .eq('id', client.id);

        if (updateErr) {
          console.error('Error updating last access:', updateErr);
        }

        const sessionUser: SessionUser = {
          id: client.id,
          cliente_id: client.cliente_id,
          nombre: client.nombre,
          role: 'client',
        };

        await saveSession(sessionUser);
        return { mustChangePassword: false, role: 'client' };
      }
    } catch (e) {
      console.log("Error en login provider:", e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      setUser(null);
      setRole(null);
      console.log("SESSION CLEARED ON LOGOUT");
    } catch (e) {
      console.error('Error on logout:', e);
    }
  };

  const changePassword = async (tempUser: SessionUser, newPassword: string) => {
    console.log("changePassword START");
    try {
      if (newPassword.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      console.log("Generando bcrypt hash...");
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);

      if (tempUser.role === 'admin') {
        console.log("Actualizando admins table...");
        const { data, error } = await supabase
          .from('admins')
          .update({
            password_hash: hash,
            primer_login: false,
          })
          .eq('id', tempUser.id)
          .select();

        console.log("Resultado update admin:", data);
        if (error) {
          console.log("Error update admin:", error);
          throw new Error(`Error de base de datos al cambiar contraseña: ${error.message}`);
        }

        if (!data || data.length === 0) {
          throw new Error('Error al actualizar la contraseña del administrador en la base de datos');
        }
      } else {
        console.log("Actualizando clientes table...");
        const { data, error } = await supabase
          .from('clientes')
          .update({
            password_hash: hash,
            primer_login: false,
            ultimo_acceso: new Date().toISOString(),
          })
          .eq('id', tempUser.id)
          .select();

        console.log("Resultado update cliente:", data);
        if (error) {
          console.log("Error update cliente:", error);
          throw new Error(`Error de base de datos al cambiar contraseña: ${error.message}`);
        }

        if (!data || data.length === 0) {
          throw new Error('Error al actualizar la contraseña del cliente en la base de datos');
        }
      }

      // Create session upon successful creation
      await saveSession(tempUser);
    } catch (e) {
      console.log("Error en changePassword provider:", e);
      throw e;
    }
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
