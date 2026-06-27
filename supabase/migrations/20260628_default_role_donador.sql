-- Cambia el rol inicial de cada cuenta nueva de 'pending' a 'donador'
-- y migra a 'donador' a los usuarios que quedaron en 'pending' antes del fix.
-- El trigger on_auth_user_created sigue activo sin cambios — solo se reemplaza
-- el cuerpo de la función.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_role text := 'donador';
begin
  if exists (select 1 from public.admin_emails where email = new.email) then
    v_role := 'admin';
  end if;
  insert into public.profiles(id, role, full_name)
  values (
    new.id,
    v_role,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.email
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

update public.profiles
set role = 'donador'
where role = 'pending';
