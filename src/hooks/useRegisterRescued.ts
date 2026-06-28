import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface RegisterRescuedParams {
  tipo: "busca_albergue" | "busca_familiar";
  contact_name: string;
  phone: string;
  current_state: string;
  people_count?: number;
  has_children?: boolean;
  has_elderly?: boolean;
  has_medical?: boolean;
  has_pets?: boolean;
  nombre_buscado?: string;
  ultima_ubicacion?: string;
}

export function useRegisterRescued() {
  const [loading, setLoading] = useState(false);

  const register = useCallback(async (params: RegisterRescuedParams) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rescued_persons")
      .insert({
        tipo: params.tipo,
        contact_name: params.contact_name,
        phone: params.phone,
        current_state: params.current_state,
        people_count: params.people_count ?? 1,
        has_children: params.has_children ?? false,
        has_elderly: params.has_elderly ?? false,
        has_medical: params.has_medical ?? false,
        has_pets: params.has_pets ?? false,
        nombre_buscado: params.nombre_buscado || null,
        ultima_ubicacion: params.ultima_ubicacion || null,
        status: "activo",
      })
      .select()
      .single();
    setLoading(false);
    return { data, error };
  }, []);

  return { register, loading };
}
