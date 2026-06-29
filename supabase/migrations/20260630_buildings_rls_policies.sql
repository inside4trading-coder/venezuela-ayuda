-- ============================================================
-- Migration: Políticas RLS para la tabla public.buildings
--
-- Evita el fallo silencioso al intentar fusionar o geolocalizar
-- edificaciones desde el cliente web.
-- ============================================================

-- 1. Asegurar que RLS esté activado
alter table public.buildings enable row level security;

-- 2. Permitir lectura pública a cualquier usuario (anon y authenticated)
drop policy if exists "buildings_select_public" on public.buildings;
create policy "buildings_select_public" on public.buildings
  for select using (true);

-- 3. Permitir DML completo (insert, update, delete) solo a usuarios administradores
drop policy if exists "buildings_admin_dml" on public.buildings;
create policy "buildings_admin_dml" on public.buildings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

notify pgrst, 'reload schema';
