-- =====================================================================
-- 013) PASSWORD RECOVERY — Legacy tables (admins/clientes) + Supabase Auth
-- =====================================================================
-- Agrega columnas requeridas para recuperación por email y "must_change_password"
-- sin romper compatibilidad con el login legacy (bcrypt en admins/clientes).
-- Idempotente.
-- =====================================================================

-- Admins
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'admins'
  ) then
    alter table public.admins
      add column if not exists email text unique,
      add column if not exists must_change_password boolean not null default true;

    update public.admins
    set must_change_password = coalesce(primer_login, true)
    where must_change_password is distinct from coalesce(primer_login, true);
  end if;
end $$;

-- Clientes
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'clientes'
  ) then
    alter table public.clientes
      add column if not exists email text unique,
      add column if not exists must_change_password boolean not null default true;

    update public.clientes
    set must_change_password = coalesce(primer_login, true)
    where must_change_password is distinct from coalesce(primer_login, true);
  end if;
end $$;

