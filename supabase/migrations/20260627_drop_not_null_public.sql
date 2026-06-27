-- ============================================================
-- Hacer nullable todas las columnas NOT NULL del schema public,
-- excepto las que son PRIMARY KEY (estas no se pueden hacer nullable).
-- Mantiene CHECK constraints, defaults y foreign keys intactos.
-- ============================================================
-- Run in: Supabase Dashboard → SQL Editor
-- Idempotente: si una columna ya es nullable, alter no falla.

do $$
declare
  r record;
  v_count int := 0;
begin
  for r in
    select c.table_schema, c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema
     and t.table_name   = c.table_name
    where c.table_schema = 'public'
      and c.is_nullable  = 'NO'
      and t.table_type   = 'BASE TABLE'
      -- Excluir PKs
      and not exists (
        select 1
        from information_schema.table_constraints tc
        join information_schema.key_column_usage kcu
          on kcu.constraint_name = tc.constraint_name
         and kcu.table_schema     = tc.table_schema
        where tc.constraint_type = 'PRIMARY KEY'
          and tc.table_schema    = c.table_schema
          and tc.table_name      = c.table_name
          and kcu.column_name    = c.column_name
      )
  loop
    execute format(
      'alter table %I.%I alter column %I drop not null',
      r.table_schema, r.table_name, r.column_name
    );
    raise notice 'DROP NOT NULL → %.%.%',
      r.table_schema, r.table_name, r.column_name;
    v_count := v_count + 1;
  end loop;

  raise notice 'Total columnas afectadas: %', v_count;
end$$;

-- Verificar resultado
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and is_nullable = 'NO'
order by table_name, column_name;
-- ↑ Lo único que debería quedar son las PKs (típicamente columnas `id`).
