import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { adminLogin } from '../lib/backendApi';
import { supabase } from '../lib/supabase';
import { registerPushToken } from '../services/pushNotifications';

export interface SessionUser {
  id: string;
  cliente_id?: string;
  admin_id?: string;
  usuario?: string;
  nombre: string;
  role: 'client' | 'admin';
  mustChangePassword?: boolean;
  adminToken?: string;
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

async function setSupabaseAdminToken(token?: string) {
  if (!token) return;
  try {
    await supabase.auth.setAuth(token);
  } catch (e) {
    console.warn('[Auth] setSupabaseAdminToken failed:', e);
  }
}

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
          if (parsed.role === 'admin' && parsed.adminToken) {
            await setSupabaseAdminToken(parsed.adminToken);
          }
        }
      } catch (e) {
        console.error('Error restoring auth session:', e);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  // Watch for forced logout when user is disabled by admin
  useEffect(() => {
    if (!user) return;

    const table = user.role === 'client' ? 'clientes' : 'admins';
    const idField = user.role === 'client' ? 'id' : 'id';
    const numericId = Number(user.id);
    const filter = isNaN(numericId)
      ? `id=eq.${user.id}`
      : `id=eq.${numericId}`;

    const channel = supabase
      .channel(`auth-watch-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table, filter },
        (payload: any) => {
          const row = payload?.new;
          if (!row) return;
          if (row.habilitado === false) {
            // Account disabled by admin — force logout
            AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
            setUser(null);
            setRole(null);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const saveSession = async (sessionUser: SessionUser) => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    setRole(sessionUser.role);

    if (sessionUser.role === 'admin' && sessionUser.adminToken) {
      await setSupabaseAdminToken(sessionUser.adminToken);
    } else {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore if already signed out
      }
    }

    try {
      if (sessionUser.role === 'client' && sessionUser.cliente_id) {
        await registerPushToken({
          userRole: 'client',
          clienteId: sessionUser.cliente_id,
        });
      } else if (sessionUser.role === 'admin') {
        await registerPushToken({
          userRole: 'admin',
          adminId: sessionUser.admin_id ?? sessionUser.id,
        });
      }
    } catch (e) {
      console.warn('[Auth] push register:', e);
    }
  };

  const login = async (identifier: string, password: string): Promise<LoginResult> => {
    const cleanIdentifier = identifier.trim();

    // If identifier contains letters → admin login. Pure numbers → client login.
    const isAdmin = /[a-zA-Z]/.test(cleanIdentifier);

    if (isAdmin) {
      // ── ADMIN LOGIN ──────────────────────────────────────────────
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('usuario', cleanIdentifier)
        .maybeSingle();

      if (error) throw new Error(`Error de base de datos: ${error.message}`);
      if (!admin) throw new Error('Usuario no encontrado');
      if (!admin.habilitado) throw new Error('Usuario deshabilitado. Contactá al administrador.');

      if (admin.primer_login) {
        // Initial password for admins: admingn123!
        if (password !== 'admingn123!') throw new Error('Contraseña incorrecta');

        const tempUser: SessionUser = {
          id: String(admin.id),
          admin_id: String(admin.admin_id ?? admin.id),
          usuario: admin.usuario,
          nombre: admin.nombre ?? admin.usuario,
          role: 'admin',
          mustChangePassword: true,
        };
        await saveSession(tempUser);
        return { mustChangePassword: true, tempUser, role: 'admin' };
      }

      if (admin.must_change_password) {
        const tempUser: SessionUser = {
          id: String(admin.id),
          admin_id: String(admin.admin_id ?? admin.id),
          usuario: admin.usuario,
          nombre: admin.nombre ?? admin.usuario,
          role: 'admin',
          mustChangePassword: true,
        };
        await saveSession(tempUser);
        return { mustChangePassword: true, tempUser, role: 'admin' };
      }

      const match = await bcrypt.compare(password, admin.password_hash || '');
      if (!match) throw new Error('Contraseña incorrecta');

      let adminToken: string | undefined;
      try {
        const jwt = await adminLogin(cleanIdentifier, password);
        adminToken = jwt.token;
      } catch (e) {
        console.warn('[AUTH] admin JWT no disponible:', e);
      }

      const sessionUser: SessionUser = {
        id: String(admin.id),
        admin_id: String(admin.admin_id ?? admin.id),
        usuario: admin.usuario,
        nombre: admin.nombre ?? admin.usuario,
        role: 'admin',
        adminToken,
      };

      await saveSession(sessionUser);
      return { mustChangePassword: false, role: 'admin' };

    } else {
      // ── CLIENT LOGIN ─────────────────────────────────────────────
      // cliente_id puede ser INTEGER o TEXT en la DB — intentamos con número primero
      const clienteIdValue = /^\d+$/.test(cleanIdentifier)
        ? Number(cleanIdentifier)
        : cleanIdentifier;
      console.log('[AUTH] buscando cliente_id:', clienteIdValue, typeof clienteIdValue);
      const { data: client, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('cliente_id', clienteIdValue)
        .maybeSingle();

      console.log('[AUTH] resultado query:', JSON.stringify({ data: client, error }));

      if (error) throw new Error(`Error de base de datos: ${error.message}`);
      if (!client) throw new Error('Usuario no encontrado');
      if (!client.habilitado) throw new Error('Usuario deshabilitado. Contactá al administrador.');

      console.log('[AUTH] primer_login:', client.primer_login, '| password ingresada:', password);

      if (client.primer_login) {
        // Initial password for clients: clientesgn123
        if (password !== 'clientesgn123') throw new Error('Contraseña incorrecta');

        const tempUser: SessionUser = {
          id: String(client.id),
          cliente_id: String(client.cliente_id),
          nombre: client.nombre,
          role: 'client',
          mustChangePassword: true,
        };
        await saveSession(tempUser);
        return { mustChangePassword: true, tempUser, role: 'client' };
      }

      if (client.must_change_password) {
        const tempUser: SessionUser = {
          id: String(client.id),
          cliente_id: String(client.cliente_id),
          nombre: client.nombre,
          role: 'client',
          mustChangePassword: true,
        };
        await saveSession(tempUser);
        return { mustChangePassword: true, tempUser, role: 'client' };
      }

      const match = await bcrypt.compare(password, client.password_hash || '');
      if (!match) throw new Error('Contraseña incorrecta');

      // Update last access
      await supabase
        .from('clientes')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', client.id);

      const sessionUser: SessionUser = {
        id: String(client.id),
        cliente_id: String(client.cliente_id),
        nombre: client.nombre,
        role: 'client',
      };

      try {
        await supabase.auth.signOut();
      } catch {
        // ignore previous admin session cleanup errors
      }

      await saveSession(sessionUser);
      return { mustChangePassword: false, role: 'client' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem(SESSION_KEY);
      setUser(null);
      setRole(null);
    } catch (e) {
      console.error('Error on logout:', e);
    }
  };

  const changePassword = async (tempUser: SessionUser, newPassword: string) => {
    console.log('[CHANGE_PW] iniciando para user:', JSON.stringify(tempUser));

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    console.log('[CHANGE_PW] hash generado');

    if (tempUser.role === 'admin') {
      console.log('[CHANGE_PW] actualizando admins, id:', tempUser.id);
      const { data, error } = await supabase
        .from('admins')
        .update({ password_hash: hash, primer_login: false, must_change_password: false })
        .eq('id', tempUser.id)
        .select();

      console.log('[CHANGE_PW] resultado admins:', JSON.stringify({ data, error }));
      if (error) throw new Error(`Error al cambiar contraseña: ${error.message}`);
    } else {
      console.log('[CHANGE_PW] actualizando clientes, id:', tempUser.id, 'cliente_id:', tempUser.cliente_id);
      // Intentar con id primero, si no matchea usar cliente_id
      const { data, error } = await supabase
        .from('clientes')
        .update({
          password_hash: hash,
          primer_login: false,
          must_change_password: false,
          ultimo_acceso: new Date().toISOString(),
          password_actualizada: true,
          fecha_cambio_password: new Date().toISOString(),
        })
        .eq('id', tempUser.id)
        .select();

      console.log('[CHANGE_PW] resultado clientes:', JSON.stringify({ data, error }));
      if (error) throw new Error(`Error al cambiar contraseña: ${error.message}`);

      // Si no actualizó ninguna fila, intentar con cliente_id
      if (!data || data.length === 0) {
        console.log('[CHANGE_PW] sin filas con id, reintentando con cliente_id:', tempUser.cliente_id);
        const { data: data2, error: error2 } = await supabase
          .from('clientes')
          .update({
            password_hash: hash,
            primer_login: false,
            must_change_password: false,
            ultimo_acceso: new Date().toISOString(),
            password_actualizada: true,
            fecha_cambio_password: new Date().toISOString(),
          })
          .eq('cliente_id', tempUser.cliente_id)
          .select();

        console.log('[CHANGE_PW] resultado clientes (cliente_id):', JSON.stringify({ data: data2, error: error2 }));
        if (error2) throw new Error(`Error al cambiar contraseña: ${error2.message}`);
      }
    }

    const updatedUser = { ...tempUser, mustChangePassword: false };
    await saveSession(updatedUser);
    console.log('[CHANGE_PW] sesión actualizada, mustChangePassword=false');
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
