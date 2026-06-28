import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface RescuedPerson {
  id: string;
  tipo: "busca_albergue" | "busca_familiar";
  contact_name: string;
  phone: string;
  current_state: string;
  people_count: number;
  has_children: boolean;
  has_elderly: boolean;
  has_medical: boolean;
  has_pets: boolean;
  nombre_buscado: string | null;
  ultima_ubicacion: string | null;
  status: "activo" | "en_proceso" | "resuelto" | "cerrado";
  assigned_center: string | null;
  registered_by: string | null;
  created_at: string;
}

export interface RescuedPersonsFilters {
  tipo?: "busca_albergue" | "busca_familiar";
  status?: "activo" | "en_proceso" | "resuelto" | "cerrado";
  current_state?: string;
}

export function useRescuedPersons(filters: RescuedPersonsFilters = {}) {
  const [items, setItems] = useState<RescuedPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        let q = supabase.from("rescued_persons").select("*");
        
        if (filters.tipo) {
          q = q.eq("tipo", filters.tipo);
        }
        if (filters.status) {
          q = q.eq("status", filters.status);
        }
        if (filters.current_state) {
          q = q.eq("current_state", filters.current_state);
        }

        q = q.order("created_at", { ascending: false });

        const { data, error } = await q;
        if (!active) return;

        if (error) {
          console.error("useRescuedPersons error:", error);
          setItems([]);
        } else {
          setItems((data as RescuedPerson[]) ?? []);
        }
      } catch (err) {
        console.error("useRescuedPersons exception:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [filters.tipo, filters.status, filters.current_state]);

  return { items, loading };
}
