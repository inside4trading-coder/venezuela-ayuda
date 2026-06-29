-- ============================================================
-- Migration: Crear funciones de calidad de datos para sobrevivientes
--
-- Usa SECURITY DEFINER para que las operaciones DELETE/UPDATE
-- dentro de estas funciones no estén sujetas a RLS, permitiendo
-- que los administradores fusionen registros correctamente.
-- ============================================================

-- ----------------------------------------------------------------
-- 0. Eliminar funciones existentes para poder recrearlas con la
--    firma correcta (Postgres no permite cambiar OUT parameters)
-- ----------------------------------------------------------------
DROP FUNCTION IF EXISTS public.find_duplicate_survivors();
DROP FUNCTION IF EXISTS public.merge_survivors(uuid, uuid);
DROP FUNCTION IF EXISTS public.merge_exact_duplicate_survivors();

-- ----------------------------------------------------------------
-- 1. Encontrar posibles duplicados por similitud de nombre
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_duplicate_survivors()
RETURNS TABLE (
  id_a        uuid,
  id_b        uuid,
  name_a      text,
  name_b      text,
  cedula_a    text,
  cedula_b    text,
  location_a  text,
  location_b  text,
  similitud   float
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id          AS id_a,
    b.id          AS id_b,
    a.full_name   AS name_a,
    b.full_name   AS name_b,
    a.cedula      AS cedula_a,
    b.cedula      AS cedula_b,
    a.location_name AS location_a,
    b.location_name AS location_b,
    similarity(lower(a.full_name), lower(b.full_name)) AS similitud
  FROM public.survivors a
  JOIN public.survivors b
    ON a.id < b.id
   AND similarity(lower(a.full_name), lower(b.full_name)) >= 0.7
   AND a.reunited_at IS NULL
   AND b.reunited_at IS NULL
  ORDER BY similitud DESC, a.full_name
  LIMIT 200;
$$;

-- ----------------------------------------------------------------
-- 2. Fusionar dos registros: conservar uno, eliminar el duplicado
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merge_survivors(
  keep_id    uuid,
  discard_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Copiar cédula del descartado si el conservado no la tiene
  UPDATE public.survivors
  SET cedula = (SELECT cedula FROM public.survivors WHERE id = discard_id)
  WHERE id = keep_id
    AND cedula IS NULL
    AND (SELECT cedula FROM public.survivors WHERE id = discard_id) IS NOT NULL;

  -- Eliminar el duplicado
  DELETE FROM public.survivors WHERE id = discard_id;
END;
$$;

-- ----------------------------------------------------------------
-- 3. Limpieza automática: fusionar pares con similitud >= 0.95
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merge_exact_duplicate_survivors()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pair    RECORD;
  keep_id   uuid;
  discard_id uuid;
  merged_count integer := 0;
BEGIN
  FOR pair IN
    SELECT
      a.id   AS id_a,
      b.id   AS id_b,
      a.cedula AS cedula_a,
      b.cedula AS cedula_b,
      similarity(lower(a.full_name), lower(b.full_name)) AS sim
    FROM public.survivors a
    JOIN public.survivors b
      ON a.id < b.id
     AND similarity(lower(a.full_name), lower(b.full_name)) >= 0.95
     AND a.reunited_at IS NULL
     AND b.reunited_at IS NULL
    ORDER BY sim DESC
  LOOP
    -- Preferir el que tenga cédula; si ambos la tienen o ninguno, conservar id_a
    IF pair.cedula_a IS NULL AND pair.cedula_b IS NOT NULL THEN
      keep_id    := pair.id_b;
      discard_id := pair.id_a;
    ELSE
      keep_id    := pair.id_a;
      discard_id := pair.id_b;
    END IF;

    -- Copiar cédula si hace falta
    UPDATE public.survivors
    SET cedula = (SELECT cedula FROM public.survivors WHERE id = discard_id)
    WHERE id = keep_id
      AND cedula IS NULL
      AND (SELECT cedula FROM public.survivors WHERE id = discard_id) IS NOT NULL;

    DELETE FROM public.survivors WHERE id = discard_id;

    merged_count := merged_count + 1;
  END LOOP;

  RETURN merged_count;
END;
$$;

-- ----------------------------------------------------------------
-- 4. RLS: asegurar que la tabla tenga políticas correctas
-- ----------------------------------------------------------------
ALTER TABLE public.survivors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS survivors_select_public    ON public.survivors;
DROP POLICY IF EXISTS survivors_admin_dml        ON public.survivors;
DROP POLICY IF EXISTS survivors_update_reunited  ON public.survivors;

-- Lectura pública (cualquier usuario puede listar sobrevivientes)
CREATE POLICY survivors_select_public ON public.survivors
  FOR SELECT USING (true);

-- Escritura/borrado solo para autenticados (las funciones SECURITY DEFINER
-- los acreditan automáticamente con los privilegios del owner)
CREATE POLICY survivors_authenticated_dml ON public.survivors
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
