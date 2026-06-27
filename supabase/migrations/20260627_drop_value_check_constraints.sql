-- ============================================================
-- Dropea CHECK constraints de valor (status/type/kind/nivel/etc.)
-- en tablas de public, excepto profiles_role_check.
-- ============================================================
-- Razón: política "sin obligatorios" — las restricciones a sets
-- cerrados de valores son barreras de adopción. El frontend valida
-- visualmente y la app tolera valores libres.
-- Run in: Supabase Dashboard → SQL Editor

do $$
declare r record;
begin
  for r in
    select tc.constraint_name, tc.table_name
    from information_schema.table_constraints tc
    where tc.constraint_type = 'CHECK'
      and tc.table_schema = 'public'
      and tc.constraint_name <> 'profiles_role_check'
      and (
        tc.constraint_name ilike '%status%'
        or tc.constraint_name ilike '%type%'
        or tc.constraint_name ilike '%kind%'
        or tc.constraint_name ilike '%nivel%'
        or tc.constraint_name ilike '%level%'
        or tc.constraint_name ilike '%priority%'
      )
  loop
    execute format('alter table public.%I drop constraint %I',
                   r.table_name, r.constraint_name);
    raise notice 'dropped %.%', r.table_name, r.constraint_name;
  end loop;
end$$;

notify pgrst, 'reload schema';
