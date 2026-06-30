-- ============================================================
-- Creación de la Tabla de Solicitudes de Coordinación de Centros
-- ============================================================

-- 1. Tabla de Solicitudes
CREATE TABLE IF NOT EXISTS public.coordination_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  center_id   uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  phone       text NOT NULL,
  status      text NOT NULL DEFAULT 'pendiente',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coordination_requests_status_check CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
  CONSTRAINT coordination_requests_user_center_unique UNIQUE (user_id, center_id)
);

-- 2. Habilitar RLS
ALTER TABLE public.coordination_requests ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS
DROP POLICY IF EXISTS "coordination_requests_select_self" ON public.coordination_requests;
CREATE POLICY "coordination_requests_select_self" ON public.coordination_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "coordination_requests_select_admin" ON public.coordination_requests;
CREATE POLICY "coordination_requests_select_admin" ON public.coordination_requests
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "coordination_requests_insert_self" ON public.coordination_requests;
CREATE POLICY "coordination_requests_insert_self" ON public.coordination_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "coordination_requests_update_admin" ON public.coordination_requests;
CREATE POLICY "coordination_requests_update_admin" ON public.coordination_requests
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Trigger para actualizar el teléfono del coordinador en su perfil al insertar
CREATE OR REPLACE FUNCTION public.handle_coordination_request_insert()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET phone = NEW.phone
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_coordination_request_inserted ON public.coordination_requests;
CREATE TRIGGER on_coordination_request_inserted
  AFTER INSERT ON public.coordination_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_coordination_request_insert();

-- 5. Trigger para asignar automáticamente el center_id al perfil del coordinador al aprobar
CREATE OR REPLACE FUNCTION public.handle_coordination_request_approval()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'aprobado' AND OLD.status = 'pendiente' THEN
    UPDATE public.profiles
    SET center_id = NEW.center_id
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_coordination_request_approved ON public.coordination_requests;
CREATE TRIGGER on_coordination_request_approved
  AFTER UPDATE ON public.coordination_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_coordination_request_approval();
