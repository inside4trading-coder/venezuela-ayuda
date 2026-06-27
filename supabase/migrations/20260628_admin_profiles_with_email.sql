-- get_all_profiles_for_admin: lista completa de perfiles + email para el picker
-- de "Asignar coordinador" en /panel/admin. SECURITY DEFINER necesario para
-- leer auth.users.email; gate de seguridad: solo admins via is_admin().

-- DROP necesario: PostgreSQL no permite cambiar el tipo de retorno con
-- CREATE OR REPLACE si la firma anterior no incluía email.
drop function if exists public.get_all_profiles_for_admin();

create function public.get_all_profiles_for_admin()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  center_id uuid
)
language sql
security definer
set search_path = public, auth
as $$
  select p.id, p.full_name, u.email::text, p.role::text, p.center_id
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by p.full_name nulls last, u.email
  limit 500;
$$;

grant execute on function public.get_all_profiles_for_admin() to authenticated;
