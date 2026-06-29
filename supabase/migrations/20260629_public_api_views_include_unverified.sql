-- ============================================================
-- Migration: ampliar las vistas públicas para incluir registros
-- NO verificados. Cada vista marca claramente cuáles no lo están
-- mediante el tag 'no_verificado' (y, donde aplica, el campo verified).
--
-- Las garantías de privacidad NO cambian:
--   - survivors_public sigue sin exponer cédula
--   - menores (<18) siguen anonimizados (person_name, age = NULL)
--   - sobrevivientes reunidos (reunited_at NOT NULL) siguen excluidos
-- ============================================================

-- ----------------------------------------------------------------
-- 1. survivors_public — ahora incluye no verificados
-- ----------------------------------------------------------------
create or replace view public.survivors_public as
select
  id                                                                    as source_record_id,
  case when age_approx is not null and age_approx < 18
       then null else full_name end                                     as person_name,
  case when age_approx is not null and age_approx < 18
       then null else age_approx end                                    as age,
  current_city                                                          as city,
  current_state                                                         as state,
  'VE'::text                                                            as country,
  location_name,
  estado_fisico                                                         as status,
  verified,
  created_at                                                            as observed_at,
  greatest(created_at, coalesce(reunited_at, created_at))               as updated_at,
  array_remove(array[
    case when age_approx is not null and age_approx < 18 then 'menor' end,
    case when gender is not null then gender end,
    case when location_type is not null then location_type end,
    case when not verified then 'no_verificado' end
  ], null)                                                              as tags
from public.survivors
where reunited_at is null;   -- los reunidos siguen excluidos

-- ----------------------------------------------------------------
-- 2. centers_public — ahora incluye no verificados
-- ----------------------------------------------------------------
create or replace view public.centers_public as
select
  id                                                                    as source_record_id,
  name                                                                  as title,
  type,
  status,
  address                                                               as location_name,
  city,
  state,
  'VE'::text                                                            as country,
  round(lat::numeric, 2)                                                as latitude,
  round(lng::numeric, 2)                                                as longitude,
  phone                                                                 as contact,
  capacity,
  capacity_used,
  verified_at,
  (verified_at is not null)                                             as verified,
  array_remove(array[
    type,
    status,
    case when verified_at is null then 'no_verificado' end
  ], null)                                                              as tags
from public.centers;

-- ----------------------------------------------------------------
-- 3. inventory_public — ahora incluye items de centros no verificados
-- ----------------------------------------------------------------
create or replace view public.inventory_public as
select
  i.id                                                                  as source_record_id,
  i.name                                                                as title,
  i.quantity,
  i.unit,
  i.status,
  c.city,
  c.state,
  c.name                                                                as organization,
  i.updated_at,
  (c.verified_at is not null)                                           as verified,
  array_remove(array[
    i.category,
    i.status,
    case when c.verified_at is null then 'centro_no_verificado' end
  ], null)                                                              as tags
from public.inventory_items i
join public.centers c on c.id = i.center_id;

-- ----------------------------------------------------------------
-- 4. volunteer_roles_public — ahora incluye roles de centros no verificados
-- Mantiene el requisito de tener al menos un rol abierto (sin roles, no hay
-- fila que mostrar).
-- ----------------------------------------------------------------
create or replace view public.volunteer_roles_public as
select
  c.id                                                                  as source_record_id,
  c.name                                                                as organization,
  unnest(c.needed_roles)                                                as title,
  c.city,
  c.state,
  coalesce(c.verified_at, c.created_at)                                 as updated_at,
  (c.verified_at is not null)                                           as verified,
  array_remove(array[
    case when c.verified_at is null then 'centro_no_verificado' end
  ], null)                                                              as tags
from public.centers c
where c.needed_roles is not null
  and array_length(c.needed_roles, 1) > 0;

-- ----------------------------------------------------------------
-- Recargar schema cache de PostgREST para que las nuevas columnas
-- (verified en centros/inventario/voluntarios) aparezcan en la API.
-- ----------------------------------------------------------------
notify pgrst, 'reload schema';
