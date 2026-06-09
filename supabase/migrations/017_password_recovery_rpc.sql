-- =====================================================================
-- 017) PASSWORD RECOVERY — RPC para verificar email en tablas legacy
-- =====================================================================
-- Permite a la app (anon) verificar si un email está registrado antes de
-- solicitar recuperación, sin exponer datos sensibles de los usuarios.
-- =====================================================================

create or replace function public.check_recovery_email(p_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admins
    where lower(trim(email)) = lower(trim(p_email))
    union all
    select 1
    from public.clientes
    where lower(trim(email)) = lower(trim(p_email))
  );
$$;

revoke all on function public.check_recovery_email(text) from public;
grant execute on function public.check_recovery_email(text) to anon, authenticated;
