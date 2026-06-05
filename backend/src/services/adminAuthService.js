'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getSupabaseAdmin } = require('./supabaseAdmin');

/**
 * Valida admin legacy (admins.usuario + password_hash) y emite JWT compatible con requireAdmin.
 */
async function loginAdmin(usuario, password) {
  const supabase = getSupabaseAdmin();

  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('usuario', usuario.trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!admin) throw new Error('Usuario no encontrado');
  if (!admin.habilitado) throw new Error('Usuario deshabilitado');

  if (admin.primer_login && password === 'admingn123!') {
    // permitir primer login con contraseña inicial
  } else {
    const match = await bcrypt.compare(password, admin.password_hash || '');
    if (!match) throw new Error('Contraseña incorrecta');
  }

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error('SUPABASE_JWT_SECRET no configurado');

  const token = jwt.sign(
    {
      sub: String(admin.id),
      role: 'admin',
      user_metadata: { role: 'admin' },
      app_metadata: { role: 'admin' },
    },
    secret,
    { expiresIn: '12h' },
  );

  return {
    token,
    admin: {
      id: String(admin.id),
      usuario: admin.usuario,
      nombre: admin.nombre ?? admin.usuario,
    },
  };
}

module.exports = { loginAdmin };
