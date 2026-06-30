-- ============================================================
-- Migration: Funciones de sincronización masiva para datos externos
--
-- Crea funciones RPC con SECURITY DEFINER para que el panel de
-- administración pueda importar masivamente centros, necesidades,
-- inventarios y sobrevivientes de ayudaavzla.com evadiendo
-- limitaciones del RLS cliente de forma segura.
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Sincronizar Sobrevivientes
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_external_survivors(batch jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  v_id uuid;
  v_created_at timestamptz;
  v_reunited_at timestamptz;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(batch)
  LOOP
    -- Generar UUID determinista basado en el ID externo
    v_id := cast(md5('ayudaavzla-persona-' || (item->>'id')) as uuid);
    v_created_at := coalesce((item->>'creado_en')::timestamptz, now());
    v_reunited_at := CASE WHEN item->>'estado_actual' = 'reunido' THEN coalesce((item->>'actualizado_en')::timestamptz, now()) END;

    INSERT INTO public.survivors (
      id, full_name, cedula, age_approx, gender, estado_fisico,
      location_type, location_name, current_state, current_city,
      descripcion, source_url, verified, registered_by, created_at,
      reunited_at
    ) VALUES (
      v_id,
      coalesce(item->>'nombre', 'Sin nombre'),
      item->>'cedula',
      (item->>'edad')::integer,
      coalesce(item->>'genero', 'no_especificado'),
      CASE (item->>'estado_actual')
        WHEN 'a_salvo' THEN 'estable'
        WHEN 'herido' THEN 'herido_leve'
        WHEN 'fallecido' THEN 'fallecido'
        ELSE 'estable'
      END,
      'Externo',
      coalesce(item->>'ubicacion_actual', item->>'ultima_ubicacion', 'No especificada'),
      coalesce(item->>'zona', 'Desconocido'),
      item->>'ubicacion_actual',
      coalesce(item->>'descripcion', CASE WHEN item->>'reportado_por' IS NOT NULL THEN 'Reportado por: ' || (item->>'reportado_por') END),
      item->>'foto_url',
      true,
      null, -- registered_by es de tipo UUID; para registros externos se inserta NULL
      v_created_at,
      v_reunited_at
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      cedula = coalesce(EXCLUDED.cedula, survivors.cedula),
      age_approx = coalesce(EXCLUDED.age_approx, survivors.age_approx),
      gender = coalesce(EXCLUDED.gender, survivors.gender),
      estado_fisico = EXCLUDED.estado_fisico,
      location_name = EXCLUDED.location_name,
      current_state = EXCLUDED.current_state,
      current_city = EXCLUDED.current_city,
      descripcion = coalesce(EXCLUDED.descripcion, survivors.descripcion),
      source_url = coalesce(EXCLUDED.source_url, survivors.source_url),
      reunited_at = coalesce(EXCLUDED.reunited_at, survivors.reunited_at);
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------
-- 2. Sincronizar Centros (Lugares) junto con sus necesidades/inventarios
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_external_centers(batch jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  v_id uuid;
  v_created_at timestamptz;
  v_necesita text;
  v_tiene text;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(batch)
  LOOP
    -- Generar UUID determinista basado en el ID externo
    v_id := cast(md5('ayudaavzla-lugar-' || (item->>'id')) as uuid);
    v_created_at := coalesce((item->>'creado_en')::timestamptz, now());
    v_necesita := item->>'necesita_actual';
    v_tiene := item->>'tiene_actual';

    -- Upsert del centro
    INSERT INTO public.centers (
      id, name, type, status, address, city, state,
      lat, lng, phone, verified, verified_at, created_at, created_by
    ) VALUES (
      v_id,
      coalesce(item->>'nombre', 'Centro sin nombre'),
      CASE (item->>'tipo')
        WHEN 'refugio' THEN 'albergue'
        WHEN 'acopio' THEN 'acopio'
        WHEN 'comedor' THEN 'cocina'
        WHEN 'salud' THEN 'medico'
        WHEN 'distribucion' THEN 'distribucion'
        ELSE 'acopio'
      END,
      'activo',
      coalesce(item->>'direccion', 'No especificada'),
      coalesce(item->>'zona', 'Desconocido'),
      coalesce(item->>'zona', 'Desconocido'),
      (item->>'lat')::double precision,
      (item->>'lon')::double precision,
      item->>'contacto',
      true,
      v_created_at,
      v_created_at,
      null
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      status = EXCLUDED.status,
      address = EXCLUDED.address,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      lat = coalesce(EXCLUDED.lat, centers.lat),
      lng = coalesce(EXCLUDED.lng, centers.lng),
      phone = coalesce(EXCLUDED.phone, centers.phone),
      verified = EXCLUDED.verified,
      verified_at = EXCLUDED.verified_at;

    -- Upsert de Necesidades en bloque de texto
    IF v_necesita IS NOT NULL AND trim(v_necesita) <> '' THEN
      DELETE FROM public.needs WHERE center_id = v_id;
      
      INSERT INTO public.needs (id, center_id, nombre, nivel, cantidad_aprox)
      VALUES (
        cast(md5('ayudaavzla-necesidad-' || (item->>'id')) as uuid),
        v_id,
        v_necesita,
        'medio',
        'Ver detalle'
      );
    END IF;

    -- Upsert de Inventario en bloque de texto
    IF v_tiene IS NOT NULL AND trim(v_tiene) <> '' THEN
      DELETE FROM public.inventory_items WHERE center_id = v_id;

      INSERT INTO public.inventory_items (id, center_id, name, category, quantity, unit, status, updated_at)
      VALUES (
        cast(md5('ayudaavzla-inventario-' || (item->>'id')) as uuid),
        v_id,
        v_tiene,
        'otros',
        1,
        'grupo',
        'ok',
        v_created_at
      );
    END IF;
  END LOOP;
END;
$$;

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
