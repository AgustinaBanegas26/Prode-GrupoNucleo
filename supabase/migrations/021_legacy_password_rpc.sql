-- Verificación y actualización de contraseñas legacy en el servidor (pgcrypto).
-- Evita bcrypt/crypto en React Native / Expo.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.verify_legacy_password(
  p_role text,
  p_user_id text,
  p_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  IF p_role = 'admin' THEN
    SELECT password_hash INTO stored_hash
    FROM public.admins
    WHERE id::text = p_user_id;
  ELSIF p_role = 'client' THEN
    SELECT password_hash INTO stored_hash
    FROM public.clientes
    WHERE id::text = p_user_id;
  ELSE
    RETURN false;
  END IF;

  IF stored_hash IS NULL OR stored_hash = '' THEN
    RETURN false;
  END IF;

  RETURN stored_hash = crypt(p_password, stored_hash);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_legacy_password(
  p_role text,
  p_user_id text,
  p_new_password text,
  p_cliente_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_hash text;
  rows_affected int;
BEGIN
  new_hash := crypt(p_new_password, gen_salt('bf', 10));

  IF p_role = 'admin' THEN
    UPDATE public.admins
    SET
      password_hash = new_hash,
      primer_login = false,
      must_change_password = false,
      updated_at = now()
    WHERE id::text = p_user_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
  END IF;

  IF p_role = 'client' THEN
    UPDATE public.clientes
    SET
      password_hash = new_hash,
      primer_login = false,
      must_change_password = false,
      ultimo_acceso = now(),
      password_actualizada = true,
      fecha_cambio_password = now()
    WHERE id::text = p_user_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;

    IF rows_affected = 0 AND p_cliente_id IS NOT NULL THEN
      UPDATE public.clientes
      SET
        password_hash = new_hash,
        primer_login = false,
        must_change_password = false,
        ultimo_acceso = now(),
        password_actualizada = true,
        fecha_cambio_password = now()
      WHERE cliente_id::text = p_cliente_id;
      GET DIAGNOSTICS rows_affected = ROW_COUNT;
    END IF;

    RETURN rows_affected > 0;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_legacy_password_by_email(
  p_email text,
  p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text;
  new_hash text;
  rows_affected int;
BEGIN
  normalized_email := lower(trim(p_email));
  IF normalized_email = '' THEN
    RETURN false;
  END IF;

  new_hash := crypt(p_new_password, gen_salt('bf', 10));

  UPDATE public.admins
  SET
    password_hash = new_hash,
    primer_login = false,
    must_change_password = false,
    updated_at = now()
  WHERE lower(trim(email)) = normalized_email;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  IF rows_affected > 0 THEN
    RETURN true;
  END IF;

  UPDATE public.clientes
  SET
    password_hash = new_hash,
    primer_login = false,
    must_change_password = false,
    ultimo_acceso = now(),
    password_actualizada = true,
    fecha_cambio_password = now()
  WHERE lower(trim(email)) = normalized_email;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  RETURN rows_affected > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_legacy_password(text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.update_legacy_password(text, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.sync_legacy_password_by_email(text, text) FROM public;

GRANT EXECUTE ON FUNCTION public.verify_legacy_password(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_legacy_password(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_legacy_password_by_email(text, text) TO anon, authenticated;
