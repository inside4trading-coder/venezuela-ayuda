import { useState, useEffect } from "react";
import type { Survivor } from "./useSurvivors";

export interface ExternalSurvivorsFilters {
  search?: string;
  state?: string;
  page?: number;
  pageSize?: number;
}

export function useExternalSurvivors(filters: ExternalSurvivorsFilters = {}) {
  const [items, setItems] = useState<Survivor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const search = filters.search ?? "";
  const state = filters.state ?? "";

  useEffect(() => {
    let active = true;
    const fetchExternal = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL("https://ayudaavzla.com/api/v1/personas");
        if (search.trim()) {
          url.searchParams.set("q", search.trim());
        }
        if (state) {
          url.searchParams.set("zona", state);
        }
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(pageSize));

        const res = await fetch(url.toString());
        if (!res.ok) {
          throw new Error("Error al consultar el registro de ayudaavzla.com");
        }
        const data = await res.json();
        if (!active) return;

        if (data.ok) {
          const adapted: Survivor[] = (data.items || []).map((item: any) => ({
            id: `ayudaavzla-${item.id}`,
            full_name: item.nombre || "Sin nombre",
            cedula: item.cedula,
            age_approx: item.edad,
            gender: item.genero,
            estado_fisico: mapEstado(item.estado_actual),
            location_type: "Externo",
            location_name: item.ubicacion_actual || item.ultima_ubicacion || "No especificada",
            current_state: item.zona || "Desconocido",
            current_city: item.ubicacion_actual,
            descripcion: item.descripcion || (item.reportado_por ? `Reportado por: ${item.reportado_por}` : null),
            source_url: item.foto_url || null,
            verified: true,
            registered_by: "ayudaavzla.com",
            created_at: item.creado_en,
            reunited_at: item.estado_actual === "reunido" ? item.actualizado_en : null,
            reunited_by: null,
            reunited_note: null,
          }));
          setItems(adapted);
          setTotalCount(data.total || 0);
        } else {
          setItems([]);
          setTotalCount(0);
        }
      } catch (err: any) {
        console.error("useExternalSurvivors error:", err);
        if (active) {
          setError(err.message || "Error de red");
          setItems([]);
          setTotalCount(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchExternal();
    return () => {
      active = false;
    };
  }, [search, state, page, pageSize]);

  return { items, totalCount, loading, error };
}

function mapEstado(estado: string): Survivor["estado_fisico"] {
  const normalized = (estado || "").toLowerCase();
  if (normalized === "a_salvo") return "estable";
  if (normalized === "herido") return "herido_leve";
  if (normalized === "fallecido") return "fallecido";
  if (normalized === "buscando") return "estable"; // default to stable if searching
  return "estable";
}
