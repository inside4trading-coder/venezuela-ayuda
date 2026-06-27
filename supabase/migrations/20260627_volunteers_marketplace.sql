-- ============================================================
-- Voluntarios marketplace: invitaciones bidireccionales +
-- exposición pública de perfiles voluntarios.
-- Run in: Supabase Dashboard → SQL Editor
-- Idempotente.
-- ============================================================

-- ----------------------------------------------------------------
-- 1. volunteer_applications — dirección de la postulación
-- ----------------------------------------------------------------
-- Si la migration del portal aún no se aplicó, esta crea la tabla
-- mínima necesaria antes de añadir la columna.
create table if not exists public.volunteer_applications (
  id           uuid primary key default gen_random_uuid(),
  volunteer_id uuid,
  user_id      uuid references auth.users(id) on delete set null,
  center_id    uuid references public.centers(id) on delete cascade,
  message      text,
  status       text default 'pendiente',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.volunteer_applications enable row level security;

alter table public.volunteer_applications
  add column if not exists initiated_by text not null default 'volunteer';

-- Drop CHECK previo si existía
do $$
declare v_name text;
begin
  select conname into v_name
  from pg_constraint
  where conrelid = 'public.volunteer_applications'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%initiated_by%';
  if v_name is not null then
    execute format('alter table public.volunteer_applications drop constraint %I', v_name);
  end if;
end$$;

alter table public.volunteer_applications
  add constraint volunteer_applications_initiated_by_check
  check (initiated_by in ('volunteer','center'));

create index if not exists idx_apps_initiated_by on public.volunteer_applications(initiated_by);

-- ----------------------------------------------------------------
-- 2. profiles — exposición pública de campos del marketplace
-- ----------------------------------------------------------------
-- Drop la policy SELECT actual (auto.uid=id OR is_admin) y la
-- reemplazamos por dos: una restringida al dueño/admin (para datos
-- sensibles como teléfono) y otra pública (filtrada en el cliente
-- pidiendo solo columnas no-sensibles).

drop policy if exists "profiles_select_self_or_admin"  on public.profiles;
drop policy if exists "profiles_select_marketplace"    on public.profiles;
drop policy if exists "profiles_select_owner_or_admin" on public.profiles;

create policy "profiles_select_owner_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- Marketplace público: cualquiera (anon incluido) puede leer perfiles
-- de voluntarios con al menos un skill. PostgREST devolverá la fila
-- completa; el cliente debe SELECT solo columnas no-sensibles
-- (id, full_name, state, city, skills, role).
create policy "profiles_select_marketplace"
  on public.profiles for select
  using (
    role in ('voluntario','voluntario_medico')
    and coalesce(array_length(skills, 1), 0) > 0
  );

-- ----------------------------------------------------------------
-- 3. Asegurar policies de volunteer_applications (idempotente)
-- ----------------------------------------------------------------
drop policy if exists "apps_select_owner_or_mgr" on public.volunteer_applications;
create policy "apps_select_owner_or_mgr"
  on public.volunteer_applications for select
  using (
    user_id = auth.uid()
    or public.is_coordinator_of(center_id)
    or public.is_admin()
  );

drop policy if exists "apps_insert_auth" on public.volunteer_applications;
create policy "apps_insert_auth"
  on public.volunteer_applications for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "apps_update_owner_or_mgr" on public.volunteer_applications;
drop policy if exists "apps_update_mgr"          on public.volunteer_applications;
create policy "apps_update_owner_or_mgr"
  on public.volunteer_applications for update
  using (
    user_id = auth.uid()
    or public.is_coordinator_of(center_id)
    or public.is_admin()
  );

drop policy if exists "apps_delete_owner_or_mgr" on public.volunteer_applications;
create policy "apps_delete_owner_or_mgr"
  on public.volunteer_applications for delete
  using (
    user_id = auth.uid()
    or public.is_coordinator_of(center_id)
    or public.is_admin()
  );

grant select, insert, update, delete
  on public.volunteer_applications to authenticated;
grant select on public.volunteer_applications to anon;

notify pgrst, 'reload schema';
