-- ============================================================
-- Migration: volunteers, donations, inventory_items
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ----------------------------------------------------------------
-- 1. volunteers
-- ----------------------------------------------------------------
create table if not exists public.volunteers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  center_id   uuid references public.centers(id) on delete set null,
  name        text not null,
  phone       text,
  email       text,
  role        text,                       -- 'coordinador' | 'apoyo' | 'medico' | etc.
  status      text not null default 'active',  -- 'active' | 'inactive'
  created_at  timestamptz not null default now()
);

alter table public.volunteers enable row level security;

-- Lectura pública (el contador de voluntarios es público)
create policy "volunteers_select_public"
  on public.volunteers for select
  using (true);

-- Solo admins/coordinadores pueden insertar / actualizar
create policy "volunteers_insert_auth"
  on public.volunteers for insert
  with check (auth.role() = 'authenticated');

create policy "volunteers_update_auth"
  on public.volunteers for update
  using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 2. donations
-- ----------------------------------------------------------------
create table if not exists public.donations (
  id           uuid primary key default gen_random_uuid(),
  donor_id     uuid references auth.users(id) on delete set null,
  center_id    uuid references public.centers(id) on delete set null,
  type         text not null default 'fisica',  -- 'fisica' | 'monetaria'
  description  text,
  amount       numeric,                  -- para donaciones monetarias (USD)
  status       text not null default 'pending',
    -- 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled'
  created_at   timestamptz not null default now(),
  delivered_at timestamptz
);

alter table public.donations enable row level security;

-- Lectura pública para métricas de impacto
create policy "donations_select_public"
  on public.donations for select
  using (true);

-- Solo autenticados pueden registrar donaciones
create policy "donations_insert_auth"
  on public.donations for insert
  with check (auth.role() = 'authenticated');

create policy "donations_update_auth"
  on public.donations for update
  using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 3. inventory_items
-- ----------------------------------------------------------------
create table if not exists public.inventory_items (
  id          uuid primary key default gen_random_uuid(),
  center_id   uuid not null references public.centers(id) on delete cascade,
  name        text not null,
  category    text,                      -- 'alimentos' | 'medicamentos' | 'ropa' | 'higiene' | etc.
  quantity    numeric not null default 0,
  unit        text not null default 'unidades',  -- 'kg' | 'litros' | 'cajas' | etc.
  status      text not null default 'ok',        -- 'ok' | 'bajo' | 'critico'
  updated_at  timestamptz not null default now()
);

alter table public.inventory_items enable row level security;

-- Lectura pública
create policy "inventory_select_public"
  on public.inventory_items for select
  using (true);

-- Solo autenticados pueden gestionar inventario
create policy "inventory_insert_auth"
  on public.inventory_items for insert
  with check (auth.role() = 'authenticated');

create policy "inventory_update_auth"
  on public.inventory_items for update
  using (auth.role() = 'authenticated');

create policy "inventory_delete_auth"
  on public.inventory_items for delete
  using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 4. Índices de rendimiento
-- ----------------------------------------------------------------
create index if not exists idx_volunteers_status    on public.volunteers(status);
create index if not exists idx_volunteers_center    on public.volunteers(center_id);
create index if not exists idx_donations_status     on public.donations(status);
create index if not exists idx_donations_center     on public.donations(center_id);
create index if not exists idx_inventory_center     on public.inventory_items(center_id);
create index if not exists idx_inventory_status     on public.inventory_items(status);

-- ----------------------------------------------------------------
-- 5. Trigger: auto-actualizar updated_at en inventory_items
-- ----------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger inventory_items_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();
