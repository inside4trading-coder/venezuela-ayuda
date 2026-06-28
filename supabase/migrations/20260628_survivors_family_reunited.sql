-- Marcar sobrevivientes como reunidos con su familia.
-- 3 columnas: timestamp del reencuentro, quién lo marcó (auditoría),
-- y nota explicativa obligatoria a nivel aplicación.

alter table public.survivors
  add column if not exists reunited_at timestamptz,
  add column if not exists reunited_by uuid references auth.users(id) on delete set null,
  add column if not exists reunited_note text;

-- Índice parcial para acelerar filtro "ocultar reunidos" en /rescatados.
create index if not exists survivors_not_reunited_idx
  on public.survivors (created_at desc)
  where reunited_at is null;

-- Habilitar RLS si no estaba.
alter table public.survivors enable row level security;

-- SELECT público (anon + authenticated). Mantiene el comportamiento actual
-- del listado público de sobrevivientes.
drop policy if exists survivors_select_public on public.survivors;
create policy survivors_select_public on public.survivors
  for select using (true);

-- UPDATE para cualquier usuario authenticated. El frontend solo edita los
-- campos de reencuentro (reunited_at/by/note) y envía reunited_by = auth.uid().
drop policy if exists survivors_update_reunited on public.survivors;
create policy survivors_update_reunited on public.survivors
  for update to authenticated using (true) with check (true);
