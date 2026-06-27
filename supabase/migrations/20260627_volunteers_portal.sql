-- ============================================================
-- Voluntarios como portal de empleo: roles que necesita cada centro
-- + postulaciones voluntario→centro
-- Run in: Supabase Dashboard → SQL Editor
-- Idempotente.
-- ============================================================

-- ----------------------------------------------------------------
-- 1. volunteers — campos que el form público envía pero no existían
-- ----------------------------------------------------------------
alter table public.volunteers
  add column if not exists roles        text[] default '{}',
  add column if not exists availability text,
  add column if not exists state        text,
  add column if not exists city         text,
  add column if not exists notes        text;

-- ----------------------------------------------------------------
-- 2. centers — qué tipos de voluntario necesita
-- ----------------------------------------------------------------
alter table public.centers
  add column if not exists needed_roles text[] default '{}';

create index if not exists idx_centers_needed_roles
  on public.centers using gin(needed_roles);

-- ----------------------------------------------------------------
-- 3. volunteers RLS — permitir insert anónimo (form público)
-- ----------------------------------------------------------------
drop policy if exists "volunteers_insert_self"        on public.volunteers;
drop policy if exists "volunteers_insert_anon_or_auth" on public.volunteers;

create policy "volunteers_insert_anon_or_auth"
  on public.volunteers for insert
  with check (true);

-- ----------------------------------------------------------------
-- 4. volunteer_applications — la postulación voluntario→centro
-- ----------------------------------------------------------------
create table if not exists public.volunteer_applications (
  id           uuid primary key default gen_random_uuid(),
  volunteer_id uuid references public.volunteers(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  center_id    uuid references public.centers(id) on delete cascade,
  message      text,
  status       text default 'pendiente',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.volunteer_applications enable row level security;

create index if not exists idx_apps_center on public.volunteer_applications(center_id);
create index if not exists idx_apps_user   on public.volunteer_applications(user_id);
create index if not exists idx_apps_status on public.volunteer_applications(status);

-- Trigger updated_at
drop trigger if exists volunteer_applications_updated_at on public.volunteer_applications;
create trigger volunteer_applications_updated_at
  before update on public.volunteer_applications
  for each row execute function public.set_updated_at();

-- Policies
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

drop policy if exists "apps_update_mgr" on public.volunteer_applications;
create policy "apps_update_mgr"
  on public.volunteer_applications for update
  using (
    public.is_coordinator_of(center_id)
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

-- ----------------------------------------------------------------
-- 5. GRANTs
-- ----------------------------------------------------------------
grant select, insert, update, delete
  on public.volunteer_applications to authenticated;
grant select on public.volunteer_applications to anon;

notify pgrst, 'reload schema';
