import { useMemo } from "react";
import { CENTERS, type Center, type CenterKind, type CenterStatus } from "@/data/mock";

export interface CenterFilters {
  query?: string;
  status?: CenterStatus | "todos";
  needs?: string[];
  kinds?: CenterKind[];
}

export function useCenters(filters: CenterFilters = {}) {
  const { query = "", status = "todos", needs = [], kinds = [] } = filters;

  const centers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CENTERS.filter((c) => {
      if (kinds.length > 0 && !kinds.includes(c.kind)) return false;
      if (q && !`${c.nombre} ${c.ciudad} ${c.estadoVe}`.toLowerCase().includes(q)) return false;
      if (status !== "todos" && c.estado !== status) return false;
      if (needs.length > 0) {
        const centerNeedNames = c.necesita.map((n) => n.nombre.toLowerCase());
        const matchesAny = needs.some((n) =>
          centerNeedNames.some((cn) => cn.includes(n.toLowerCase())),
        );
        if (!matchesAny) return false;
      }
      return true;
    });
  }, [query, status, needs, kinds]);

  return { centers, total: CENTERS.length, isLoading: false } as {
    centers: Center[];
    total: number;
    isLoading: false;
  };
}

export function useCenter(id: string | undefined) {
  const center = useMemo(() => CENTERS.find((c) => c.id === id), [id]);
  return { center, isLoading: false };
}

export function countByKind(): Record<CenterKind, number> {
  const out: Record<CenterKind, number> = {
    albergue: 0,
    acopio: 0,
    medico: 0,
    cocina: 0,
    distribucion: 0,
  };
  for (const c of CENTERS) out[c.kind]++;
  return out;
}
