-- ============================================================
-- Añade el rol "data_entry": registra centros sin auto-vincularse.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Drop CHECK constraint existente y aplicar nuevo con data_entry
do $$
declare v_name text;
begin
  select conname into v_name
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%role%';
  if v_name is not null then
    execute format('alter table public.profiles drop constraint %I', v_name);
  end if;
end$$;

alter table public.profiles
  add constraint profiles_role_check check (role in (
    'pending','donador','empresa','diaspora','voluntario','voluntario_medico',
    'transportista','coordinador','data_entry','autoridad','observador','admin'
  ));

-- 2. data_entry verificado puede actualizar profiles para asignar
--    coordinadores. Reutilizamos is_admin para esto (más simple que
--    crear un helper extra; los admins ya pueden y data_entry no
--    necesita modificar profiles, solo crear centros).

notify pgrst, 'reload schema';
