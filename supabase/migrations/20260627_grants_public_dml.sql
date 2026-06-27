-- ============================================================
-- Grants DML para authenticated/anon en todas las tablas de public.
-- Necesario porque tablas creadas con SQL custom no heredan grants
-- automáticos. Sin esto, PostgREST devuelve 403
-- "permission denied for table X" antes de evaluar RLS.
-- ============================================================
-- Run in: Supabase Dashboard → SQL Editor

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to authenticated;

-- Futuras tablas heredan los grants automáticamente
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

notify pgrst, 'reload schema';
