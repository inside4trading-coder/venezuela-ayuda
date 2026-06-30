import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Survivor {
  id: string;
  full_name: string;
  cedula: string | null;
  age_approx: number | null;
  gender: string | null;
  estado_fisico: "estable" | "herido_leve" | "herido_grave" | "critico" | "fallecido";
  location_type: string | null;
  location_name: string | null;
  current_state: string;
  current_city: string | null;
  descripcion: string | null;
  source_url: string | null;
  verified: boolean;
  registered_by: string | null;
  created_at: string;
  reunited_at: string | null;
  reunited_by: string | null;
  reunited_note: string | null;
}

export interface SurvivorsFilters {
  state?: string;
  estado_fisico?: string;
  location_name?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  hideReunited?: boolean;
  refreshKey?: number;
}

export function useSurvivors(filters: SurvivorsFilters = {}) {
  const [items, setItems] = useState<Survivor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const state = filters.state;
  const estadoFisico = filters.estado_fisico;
  const locationName = filters.location_name;
  const searchName = filters.search;
  const hideReunited = filters.hideReunited ?? false;
  const refreshKey = filters.refreshKey ?? 0;

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        let q = supabase
          .from("survivors")
          .select("*", { count: "exact" })
          .eq("verified", true);

        if (state) {
          q = q.eq("current_state", state);
        }
        if (estadoFisico) {
          q = q.eq("estado_fisico", estadoFisico);
        }
        if (locationName) {
          if (locationName === "Hospital Dr. José María Vargas") {
            q = q.ilike("location_name", "%vargas%");
          } else if (locationName === "Hospital Pérez Carreño") {
            q = q.or("location_name.ilike.%perez carreco%,location_name.ilike.%perez carreño%,location_name.ilike.%carreño%,location_name.ilike.%carreco%");
          } else if (locationName === "Parque del Oeste Alí Primera") {
            q = q.or("location_name.ilike.%ali primera%,location_name.ilike.%parque del oeste%");
          } else if (locationName === "Refugio Campo de Golf Caribe") {
            q = q.or("location_name.ilike.%golf caribe%,location_name.ilike.%caribean golf%,location_name.ilike.%campo de golf%");
          } else if (locationName === "Hospital Domingo Luciani") {
            q = q.ilike("location_name", "%luciani%");
          } else if (locationName === "Hospital Universitario de Caracas") {
            q = q.ilike("location_name", "%universitario%");
          } else if (locationName === "Hospital Ana Francisca Pérez de León II") {
            q = q.ilike("location_name", "%perez de leon%");
          } else if (locationName === "Hospital Periférico de Catia") {
            q = q.or("location_name.ilike.%periferico de catia%,location_name.ilike.%periférico de catia%");
          } else if (locationName === "Cruz Roja") {
            q = q.ilike("location_name", "%cruz roja%");
          } else if (locationName === "Refugio La Lucha") {
            q = q.ilike("location_name", "%lucha%");
          } else if (locationName === "Refugio Belo Horizonte") {
            q = q.or("location_name.ilike.%belo horizonte%,location_name.ilike.%bello horizonte%");
          } else if (locationName === "Otro / Registro Externo") {
            q = q.not("location_name", "ilike", "%vargas%")
                 .not("location_name", "ilike", "%perez carreco%")
                 .not("location_name", "ilike", "%perez carreño%")
                 .not("location_name", "ilike", "%carreño%")
                 .not("location_name", "ilike", "%carreco%")
                 .not("location_name", "ilike", "%ali primera%")
                 .not("location_name", "ilike", "%parque del oeste%")
                 .not("location_name", "ilike", "%golf caribe%")
                 .not("location_name", "ilike", "%caribean golf%")
                 .not("location_name", "ilike", "%campo de golf%")
                 .not("location_name", "ilike", "%luciani%")
                 .not("location_name", "ilike", "%universitario%")
                 .not("location_name", "ilike", "%perez de leon%")
                 .not("location_name", "ilike", "%periferico de catia%")
                 .not("location_name", "ilike", "%periférico de catia%")
                 .not("location_name", "ilike", "%cruz roja%")
                 .not("location_name", "ilike", "%lucha%")
                 .not("location_name", "ilike", "%belo horizonte%")
                 .not("location_name", "ilike", "%bello horizonte%");
          } else {
            q = q.ilike("location_name", `%${locationName.trim()}%`);
          }
        }
        if (searchName && searchName.trim()) {
          q = q.ilike("full_name", `%${searchName.trim()}%`);
        }
        if (hideReunited) {
          q = q.is("reunited_at", null);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        q = q.order("created_at", { ascending: false }).range(from, to);

        const { data, error, count } = await q;
        if (!active) return;

        if (error) {
          console.error("useSurvivors error:", error);
          setItems([]);
          setTotalCount(0);
        } else {
          setItems((data as Survivor[]) ?? []);
          setTotalCount(count ?? 0);
        }
      } catch (err) {
        console.error("useSurvivors exception:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [state, estadoFisico, locationName, searchName, page, pageSize, hideReunited, refreshKey]);

  return { items, totalCount, loading };
}
