-- SQL Script to set up the administrators table for PRODE CORPORATIVO MUNDIAL 2026.
-- Run this script in the Supabase SQL Editor.

-- 1. Create the 'admins' table if it does not exist
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL, -- Set to NULL initially since they must configure it on first login
    primer_login BOOLEAN DEFAULT TRUE NOT NULL,
    habilitado BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Insert the initial administrator user
-- Note: 'primer_login = true' will trigger password creation on first login, using 'AdminProde1670' as the temporal validation.
INSERT INTO admins (usuario, password_hash, primer_login, habilitado)
VALUES ('AdminGN', NULL, TRUE, TRUE)
ON CONFLICT (usuario) DO NOTHING;
