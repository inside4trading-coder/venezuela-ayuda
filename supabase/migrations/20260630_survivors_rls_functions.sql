-- ============================================================
-- Migration: Cambiar funciones de calidad de datos a SECURITY DEFINER
--
-- Permite que los administradores ejecuten la fusión y limpieza de
-- sobrevivientes duplicados saltando los filtros RLS.
-- ============================================================

ALTER FUNCTION public.find_duplicate_survivors() SECURITY DEFINER;
ALTER FUNCTION public.merge_survivors(uuid, uuid) SECURITY DEFINER;
ALTER FUNCTION public.merge_exact_duplicate_survivors() SECURITY DEFINER;

-- Recargar esquema de PostgREST para aplicar cambios
notify pgrst, 'reload schema';
