-- Recuperación de contraseña y cambio obligatorio en primer ingreso
-- Ejecutar en Supabase SQL Editor

-- Admins: email para Supabase Auth + flag de cambio obligatorio
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE NOT NULL;

-- Sincronizar must_change_password con primer_login existente
UPDATE admins
SET must_change_password = COALESCE(primer_login, TRUE)
WHERE must_change_password IS DISTINCT FROM COALESCE(primer_login, TRUE);

-- Clientes (si la tabla existe en tu proyecto)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clientes'
  ) THEN
    ALTER TABLE clientes
      ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE NOT NULL;

    EXECUTE $sql$
      UPDATE clientes
      SET must_change_password = COALESCE(primer_login, TRUE)
      WHERE must_change_password IS DISTINCT FROM COALESCE(primer_login, TRUE)
    $sql$;
  END IF;
END $$;

-- Perfiles vinculados a Supabase Auth (opcional, recomendado)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nombre TEXT NOT NULL DEFAULT '',
  role TEXT CHECK (role IN ('client', 'admin')),
  cliente_id TEXT,
  usuario TEXT,
  must_change_password BOOLEAN DEFAULT FALSE NOT NULL,
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  client_id UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
