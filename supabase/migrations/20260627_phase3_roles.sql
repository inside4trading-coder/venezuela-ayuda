-- ============================================================
-- Fase 3 — Roles, verificación de centros y RLS endurecido
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================
-- Idempotente. Asume que public.profiles ya existe con esquema:
--   id (PK, fk auth.users), role, full_name, phone, state, city,
--   organization, avatar_url, created_at, updated_at
-- Si tu profiles tiene otro esquema, revisa la sección 2 antes de correr.

-- ----------------------------------------------------------------
-- 0. set_updated_at (re-declarar por idempotencia)
-- ----------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------
-- 1. admin_emails — lista blanca de admins de plataforma
-- ----------------------------------------------------------------
create table if not exists public.admin_emails (
  email      text primary key,
  added_at   timestamptz not null default now(),
  added_by   uuid references auth.users(id) on delete set null
);

alter table public.admin_emails enable row level security;

insert into public.admin_emails(email) values ('hola@musacreativo.com')
on conflict (email) do nothing;

-- ----------------------------------------------------------------
-- 2. profiles — añadir columnas que faltan (no recrea la tabla)
-- ----------------------------------------------------------------
alter table public.profiles
  add column if not exists center_id uuid references public.centers(id) on delete set null;

-- Defaults sensatos por si alguna fila vieja tiene role NULL/vacío
update public.profiles
   set role = 'pending'
 where role is null or role = '';

alter table public.profiles enable row level security;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------
-- 3. Helpers SQL (usan p.id porque esa es la PK existente)
-- ----------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.is_coordinator_of(p_center_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'coordinador'
      and p.center_id = p_center_id
  );
$$;

-- ----------------------------------------------------------------
-- 4. Policies de admin_emails y profiles
-- ----------------------------------------------------------------
drop policy if exists "admin_emails_select_admin" on public.admin_emails;
create policy "admin_emails_select_admin"
  on public.admin_emails for select
  using (public.is_admin());

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role <> 'admin');

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

-- ----------------------------------------------------------------
-- 5. Trigger: crear profile al registrarse + auto-rol admin
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_role text := 'pending';
begin
  if exists (select 1 from public.admin_emails where email = new.email) then
    v_role := 'admin';
  end if;

  insert into public.profiles(id, role, full_name)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name',
             new.email)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Back-populate: users que ya existen sin profile + promover admins
insert into public.profiles(id, role, full_name)
select
  u.id,
  case when exists (select 1 from public.admin_emails a where a.email = u.email)
       then 'admin' else 'pending' end,
  coalesce(u.raw_user_meta_data->>'full_name',
           u.raw_user_meta_data->>'name',
           u.email)
from auth.users u
on conflict (id) do nothing;

-- Promover a admin a usuarios existentes cuyo email esté en admin_emails
update public.profiles p
   set role = 'admin'
  from auth.users u
 where p.id = u.id
   and exists (select 1 from public.admin_emails a where a.email = u.email)
   and p.role <> 'admin';

-- ----------------------------------------------------------------
-- 6. centers — verificación + ownership
-- ----------------------------------------------------------------
alter table public.centers
  add column if not exists verified_at timestamptz,
  add column if not exists created_by  uuid references auth.users(id) on delete set null;

update public.centers
   set verified_at = coalesce(verified_at, now())
 where verified_at is null;

create index if not exists idx_centers_verified on public.centers(verified_at);

drop policy if exists "centers_select_public"            on public.centers;
drop policy if exists "centers_select_verified_or_owner" on public.centers;
create policy "centers_select_verified_or_owner"
  on public.centers for select
  using (
    verified_at is not null
    or auth.uid() = created_by
    or public.is_admin()
  );

drop policy if exists "centers_insert_auth"          on public.centers;
drop policy if exists "centers_insert_authenticated" on public.centers;
create policy "centers_insert_authenticated"
  on public.centers for insert
  with check (
    auth.role() = 'authenticated'
    and created_by = auth.uid()
    and verified_at is null
  );

drop policy if exists "centers_update_auth"           on public.centers;
drop policy if exists "centers_update_coord_or_admin" on public.centers;
create policy "centers_update_coord_or_admin"
  on public.centers for update
  using (public.is_coordinator_of(id) or public.is_admin());

drop policy if exists "centers_delete_admin" on public.centers;
create policy "centers_delete_admin"
  on public.centers for delete
  using (public.is_admin());

-- ----------------------------------------------------------------
-- 7. inventory_items — solo coordinador del centro o admin
-- ----------------------------------------------------------------
drop policy if exists "inventory_insert_auth"        on public.inventory_items;
drop policy if exists "inventory_update_auth"        on public.inventory_items;
drop policy if exists "inventory_delete_auth"        on public.inventory_items;
drop policy if exists "inventory_insert_coord_admin" on public.inventory_items;
drop policy if exists "inventory_update_coord_admin" on public.inventory_items;
drop policy if exists "inventory_delete_coord_admin" on public.inventory_items;

create policy "inventory_insert_coord_admin"
  on public.inventory_items for insert
  with check (public.is_coordinator_of(center_id) or public.is_admin());

create policy "inventory_update_coord_admin"
  on public.inventory_items for update
  using (public.is_coordinator_of(center_id) or public.is_admin());

create policy "inventory_delete_coord_admin"
  on public.inventory_items for delete
  using (public.is_coordinator_of(center_id) or public.is_admin());

-- ----------------------------------------------------------------
-- 8. donations — donador crea las suyas; coord/admin las gestiona
-- ----------------------------------------------------------------
drop policy if exists "donations_insert_auth"   on public.donations;
drop policy if exists "donations_update_auth"   on public.donations;
drop policy if exists "donations_insert_donor"  on public.donations;
drop policy if exists "donations_update_owners" on public.donations;

create policy "donations_insert_donor"
  on public.donations for insert
  with check (
    auth.role() = 'authenticated'
    and donor_id = auth.uid()
  );

create policy "donations_update_owners"
  on public.donations for update
  using (
    donor_id = auth.uid()
    or public.is_coordinator_of(center_id)
    or public.is_admin()
  );

-- ----------------------------------------------------------------
-- 9. volunteers — voluntario gestiona su perfil; coord/admin sus filas
-- ----------------------------------------------------------------
drop policy if exists "volunteers_insert_auth"        on public.volunteers;
drop policy if exists "volunteers_update_auth"        on public.volunteers;
drop policy if exists "volunteers_insert_self"        on public.volunteers;
drop policy if exists "volunteers_update_self_or_mgr" on public.volunteers;

create policy "volunteers_insert_self"
  on public.volunteers for insert
  with check (
    auth.role() = 'authenticated'
    and (user_id = auth.uid()
         or public.is_coordinator_of(center_id)
         or public.is_admin())
  );

create policy "volunteers_update_self_or_mgr"
  on public.volunteers for update
  using (
    user_id = auth.uid()
    or public.is_coordinator_of(center_id)
    or public.is_admin()
  );
