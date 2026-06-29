-- ============================================================
-- Migration: vistas públicas para endpoint-agent-kit
-- Crea 5 vistas en public.*_public que filtran PII y aplican
-- WHERE defensivos. Las tablas base no se tocan; el SPA sigue
-- consultándolas directamente.
--
-- Esquema común del kit (19 campos): title, summary, person_name,
-- cedula, age, organization, location_name, city, state, country,
-- latitude, longitude, contact, status, verified, observed_at,
-- updated_at, source_record_id, tags.
-- ============================================================

-- ----------------------------------------------------------------
-- 1. survivors_public  (perfil: persona-desaparecida)
-- Filtros: sólo verificados, sólo no reunidos.
-- PII: cedula EXCLUIDA. Para menores (< 18) se enmascara nombre y edad.
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
    case when location_type is not null then location_type end
  ], null)                                                              as tags
from public.survivors
where reunited_at is null
  and verified = true;

-- ----------------------------------------------------------------
-- 2. centers_public  (perfil: general)
-- Sólo centros verificados. Coordenadas redondeadas a ~1 km.
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
  array_remove(array[type, status], null)                               as tags
from public.centers
where verified_at is not null;

-- ----------------------------------------------------------------
-- 3. inventory_public  (perfil: general)
-- Necesidades por centro verificado.
-- ----------------------------------------------------------------
create or replace view public.inventory_public as
select
  i.id                                                                  as source_record_id,
  i.name                                                                as title,
  i.category                                                            as tags_category,
  i.quantity,
  i.unit,
  i.status,
  c.city,
  c.state,
  c.name                                                                as organization,
  i.updated_at
from public.inventory_items i
join public.centers c on c.id = i.center_id
where c.verified_at is not null;

-- ----------------------------------------------------------------
-- 4. volunteer_roles_public  (perfil: general)
-- Roles abiertos por centro. NO expone voluntarios individuales.
-- ----------------------------------------------------------------
create or replace view public.volunteer_roles_public as
select
  c.id                                                                  as source_record_id,
  c.name                                                                as organization,
  unnest(c.needed_roles)                                                as title,
  c.city,
  c.state,
  c.verified_at                                                         as updated_at
from public.centers c
where c.verified_at is not null
  and c.needed_roles is not null
  and array_length(c.needed_roles, 1) > 0;

-- ----------------------------------------------------------------
-- Grants: las vistas son legibles por anon y authenticated.
-- RLS de las tablas base sigue aplicando (no hay bypass).
-- ----------------------------------------------------------------
grant select on public.survivors_public        to anon, authenticated;
grant select on public.centers_public          to anon, authenticated;
grant select on public.inventory_public        to anon, authenticated;
grant select on public.volunteer_roles_public  to anon, authenticated;
