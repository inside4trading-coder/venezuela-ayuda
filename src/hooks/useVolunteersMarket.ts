import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCenters } from "@/hooks/useCenters";

export interface PublicVolunteer {
  id: string;
  full_name: string | null;
  state: string | null;
  city: string | null;
  skills: string[];
  role: "voluntario" | "voluntario_medico";
}

export interface MarketFilters {
  skills?: string[]; // intersección: voluntario debe tener al menos uno
  state?: string;
}

// SELECT explícitamente solo columnas no-sensibles. La RLS lo permite
// porque profiles_select_marketplace expone toda la fila, pero el cliente
// se autolimita para no traer phone, email, bio.
const PUBLIC_COLS = "id, full_name, state, city, skills, role";

export function useAvailableVolunteers(filters: MarketFilters = {}) {
  const [items, setItems] = useState<PublicVolunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("profiles")
        .select(PUBLIC_COLS)
        .in("role", ["voluntario", "voluntario_medico"]);
      if (filters.state) q = q.eq("state", filters.state);
      const { data, error } = await q;
      if (!active) return;
      if (error) {
        console.error("useAvailableVolunteers:", error);
        setItems([]);
      } else {
        // Normalizamos skills a [] si viene null y mostramos a todos los
        // voluntarios — los que no tienen skills aparecen con etiqueta
        // "Skills no especificados" en la card.
        let rows = (((data as unknown) as PublicVolunteer[]) ?? []).map((r) => ({
          ...r,
          skills: Array.isArray(r.skills) ? r.skills : [],
        }));
        if (filters.skills && filters.skills.length > 0) {
          // El filtro sí descarta voluntarios sin skills (no pueden matchear)
          rows = rows.filter((r) =>
            filters.skills!.some((s) => r.skills.includes(s)),
          );
        }
        setItems(rows);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [filters.state, JSON.stringify(filters.skills ?? [])]);

  return { items, loading };
}

export interface DemandingCenter {
  id: string;
  nombre: string;
  kind: string;
  ciudad: string;
  estadoVe: string;
  needed_roles: string[];
}

export function useDemandingCenters(filters: MarketFilters = {}) {
  const { centers, isLoading } = useCenters({
    ...(filters.state ? { query: filters.state } : {}),
  });

  const items = useMemo<DemandingCenter[]>(() => {
    const out: DemandingCenter[] = [];
    for (const c of centers) {
      const needed = (c as any).needed_roles as string[] | undefined;
      if (!Array.isArray(needed) || needed.length === 0) continue;
      if (filters.state && c.estadoVe && c.estadoVe !== filters.state) continue;
      if (filters.skills && filters.skills.length > 0) {
        const hasAny = filters.skills.some((s) => needed.includes(s));
        if (!hasAny) continue;
      }
      out.push({
        id: c.id,
        nombre: c.nombre,
        kind: c.kind,
        ciudad: c.ciudad,
        estadoVe: c.estadoVe,
        needed_roles: needed,
      });
    }
    return out;
  }, [centers, filters.state, JSON.stringify(filters.skills ?? [])]);

  return { items, loading: isLoading };
}

/** Coordinador invita a un voluntario específico a su centro */
export function useInviteVolunteer() {
  const [busy, setBusy] = useState(false);

  const invite = useCallback(
    async (params: {
      userId: string;
      centerId: string;
      message?: string;
    }): Promise<{ error: string | null }> => {
      setBusy(true);
      const { error } = await supabase.from("volunteer_applications").insert({
        center_id: params.centerId,
        user_id: params.userId,
        volunteer_id: null,
        message: params.message?.trim() || null,
        status: "pendiente",
        initiated_by: "center",
      });
      setBusy(false);
      return { error: error?.message ?? null };
    },
    [],
  );

  return { invite, busy };
}
