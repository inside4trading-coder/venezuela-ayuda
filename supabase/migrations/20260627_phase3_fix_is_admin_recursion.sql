-- ============================================================
-- Fix: is_admin() causaba infinite_recursion (42P17)
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================
-- La policy "profiles_select_self_or_admin" llamaba a is_admin(),
-- y is_admin() hacía SELECT sobre profiles → Postgres aborta.
-- Reescribimos is_admin() para consultar admin_emails ∞ auth.users,
-- sin tocar profiles.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join public.admin_emails a on a.email = u.email
    where u.id = auth.uid()
  );
$$;
