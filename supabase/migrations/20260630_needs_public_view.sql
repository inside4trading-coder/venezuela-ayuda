-- ============================================================
-- Migration: vista pública `needs_public` — qué pide cada centro
--
-- Diferencia clave con `inventory_public`:
--   - inventory_items = lo que el centro TIENE en stock
--   - needs           = lo que el centro PIDE/REQUIERE
--
-- Tabla base `public.needs` se asume creada (no hay CREATE TABLE en
-- el repo; fue creada manualmente en Dashboard). Columnas leídas por
-- el SPA: id, center_id, nombre, nivel, cantidad_aprox.
--
-- Sigue el patrón de las otras vistas *_public: incluye centros no
-- verificados, los marca con verified=false + tag 'centro_no_verificado'.
-- ============================================================

create or replace view public.needs_public as
select
  n.id                                                                  as source_record_id,
  n.nombre                                                              as title,
  n.cantidad_aprox                                                      as summary,
  c.name                                                                as organization,
  c.city,
  c.state,
  'VE'::text                                                            as country,
  coalesce(c.verified_at, c.created_at)                                 as observed_at,
  coalesce(c.verified_at, c.created_at)                                 as updated_at,
  (c.verified_at is not null)                                           as verified,
  array_remove(array[
    n.nivel::text,
    case when n.nivel::text in ('critico','alto') then 'urgente' end,
    case when c.verified_at is null then 'centro_no_verificado' end
  ], null)                                                              as tags
from public.needs n
join public.centers c on c.id = n.center_id;

grant select on public.needs_public to anon, authenticated;

notify pgrst, 'reload schema';
