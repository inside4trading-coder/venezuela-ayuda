-- ============================================================
-- Fase 3 sprint 2 — Actores extendidos (empresa, transportista,
-- diáspora, autoridad, voluntario médico) + verificación de perfiles
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================
-- Idempotente. Asume que la migration 20260627_phase3_roles.sql ya corrió.

-- ----------------------------------------------------------------
-- 1. profiles — nuevos campos contextuales
-- ----------------------------------------------------------------
alter table public.profiles
  add column if not exists company_name        text,
  add column if not exists tax_id              text,  -- RIF
  add column if not exists country             text,  -- para diáspora (ISO 3166-1 alpha-2)
  add column if not exists vehicle_type        text,  -- moto, sedán, pickup, camión, 4x4
  add column if not exists vehicle_capacity_kg numeric,
  add column if not exists license_plate       text,
  add column if not exists skills              text[] default '{}',
  add column if not exists zones               text[] default '{}',
  add column if not exists verified_at         timestamptz,
  add column if not exists verification_note   text,
  add column if not exists bio                 text;

-- ----------------------------------------------------------------
-- 2. Roles extendidos — drop check viejo si existe (de Fase 2),
--    aplicar nuevo set.
-- ----------------------------------------------------------------
do $$
declare
  v_constraint_name text;
begin
  select conname into v_constraint_name
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%role%';

  if v_constraint_name is not null then
    execute format('alter table public.profiles drop constraint %I', v_constraint_name);
  end if;
end$$;

-- Normalizar roles legacy antes de aplicar el check (por si hay valores fuera del set)
update public.profiles
   set role = 'pending'
 where role not in (
   'pending','donador','empresa','diaspora','voluntario','voluntario_medico',
   'transportista','coordinador','autoridad','observador','admin'
 );

alter table public.profiles
  add constraint profiles_role_check check (role in (
    'pending','donador','empresa','diaspora','voluntario','voluntario_medico',
    'transportista','coordinador','autoridad','observador','admin'
  ));

-- ----------------------------------------------------------------
-- 3. Helpers SQL extendidos
-- ----------------------------------------------------------------
-- is_authority(): autoridad VERIFICADA (puede validar centros)
create or replace function public.is_authority()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'autoridad'
      and p.verified_at is not null
  );
$$;

-- Helper para chequeos en cliente sin recurrir a profiles directamente
-- (los paneles llaman a este helper para saber si su perfil está activo)
create or replace function public.is_profile_active(p_user_id uuid default null)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = coalesce(p_user_id, auth.uid())
      and (
        -- Roles que NO requieren verificación están siempre activos
        p.role in ('donador','empresa','diaspora','voluntario','transportista','coordinador','observador','admin')
        -- Roles con verificación deben tener verified_at
        or (p.role in ('voluntario_medico','autoridad') and p.verified_at is not null)
      )
  );
$$;

-- ----------------------------------------------------------------
-- 4. centers — autoridades verificadas también pueden aprobar
-- ----------------------------------------------------------------
drop policy if exists "centers_update_coord_or_admin"        on public.centers;
drop policy if exists "centers_update_coord_admin_authority" on public.centers;
create policy "centers_update_coord_admin_authority"
  on public.centers for update
  using (
    public.is_coordinator_of(id)
    or public.is_admin()
    or public.is_authority()
  );

-- ----------------------------------------------------------------
-- 5. donations — añadir campos para empresa / diáspora
-- ----------------------------------------------------------------
alter table public.donations
  add column if not exists currency        text default 'USD',  -- 'USD' | 'VES' | 'EUR' | etc.
  add column if not exists from_country    text,                -- ISO alpha-2 (para diáspora)
  add column if not exists company_name    text,                -- snapshot al momento de la donación
  add column if not exists tax_id          text,                -- snapshot RIF
  add column if not exists receipt_url     text;                -- futuro: URL de constancia PDF

-- ----------------------------------------------------------------
-- 6. routes — tabla nueva para transportistas
-- ----------------------------------------------------------------
create table if not exists public.routes (
  id              uuid primary key default gen_random_uuid(),
  carrier_id      uuid references auth.users(id) on delete set null,  -- transportista
  origin_center   uuid references public.centers(id) on delete set null,
  dest_center     uuid references public.centers(id) on delete set null,
  origin_label    text,
  dest_label      text,
  cargo_summary   text,
  status          text not null default 'planned'
                  check (status in ('planned','in_transit','delivered','cancelled')),
  scheduled_for   timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.routes enable row level security;

create index if not exists idx_routes_carrier on public.routes(carrier_id);
create index if not exists idx_routes_status  on public.routes(status);

-- Lectura pública (transparencia)
drop policy if exists "routes_select_public" on public.routes;
create policy "routes_select_public"
  on public.routes for select
  using (true);

-- El transportista crea sus propias rutas; admin y autoridad también
drop policy if exists "routes_insert_carrier_or_mgr" on public.routes;
create policy "routes_insert_carrier_or_mgr"
  on public.routes for insert
  with check (
    auth.role() = 'authenticated'
    and (
      carrier_id = auth.uid()
      or public.is_admin()
      or public.is_authority()
    )
  );

-- Actualizar: el carrier, el coordinador del centro origen/destino, admin o autoridad
drop policy if exists "routes_update_owners" on public.routes;
create policy "routes_update_owners"
  on public.routes for update
  using (
    carrier_id = auth.uid()
    or public.is_coordinator_of(origin_center)
    or public.is_coordinator_of(dest_center)
    or public.is_admin()
    or public.is_authority()
  );

drop policy if exists "routes_delete_owners" on public.routes;
create policy "routes_delete_owners"
  on public.routes for delete
  using (
    carrier_id = auth.uid()
    or public.is_admin()
  );

-- ----------------------------------------------------------------
-- 7. profiles — los pendientes de verificación se ven en /panel/admin
-- ----------------------------------------------------------------
-- Index para búsquedas por rol + estado de verificación
create index if not exists idx_profiles_role_verification
  on public.profiles(role, verified_at);
