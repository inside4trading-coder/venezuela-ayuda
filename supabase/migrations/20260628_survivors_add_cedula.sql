-- Carga masiva de sobrevivientes: agrega columna cedula a survivors y relaja
-- current_state para permitir importar con datos mínimos (nombre + cédula +
-- lugar libre). El índice único parcial bloquea duplicados por cédula sin
-- romper filas anónimas (NULL).

alter table public.survivors
  add column if not exists cedula text;

alter table public.survivors
  alter column current_state drop not null;

create unique index if not exists survivors_cedula_unique_idx
  on public.survivors (cedula)
  where cedula is not null;
