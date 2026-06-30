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
          q = q.eq("location_name", locationName);
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
