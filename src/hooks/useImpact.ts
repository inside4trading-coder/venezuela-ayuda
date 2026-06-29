import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CenterKind } from "@/data/mock";

export interface DemandItem {
  nombre: string;
  total: number;
  nivel?: string;
}

export interface ActivityEntry {
  centro: string;
  accion: string;
  haceMin: number;
}

export interface ImpactMetrics {
  centrosActivos: number;
  centrosActivosExternos?: number;
  necesidadesActivas: number;
  voluntarios: number;
  sobrevivientes: number;
  sobrevivientesExternos?: number;
  estados: number;
  porTipo: Record<
    CenterKind,
    { total: number; metricaLabel: string; metricaValor: number }
  >;
}

const EMPTY_METRICS: ImpactMetrics = {
  centrosActivos: 0,
  centrosActivosExternos: 0,
  necesidadesActivas: 0,
  voluntarios: 0,
  sobrevivientes: 0,
  sobrevivientesExternos: 0,
  estados: 0,
  porTipo: {
    albergue: { total: 0, metricaLabel: "familias alojadas", metricaValor: 0 },
    acopio: { total: 0, metricaLabel: "items movidos / sem", metricaValor: 0 },
    medico: { total: 0, metricaLabel: "atenciones / sem", metricaValor: 0 },
    cocina: { total: 0, metricaLabel: "raciones / día", metricaValor: 0 },
    distribucion: { total: 0, metricaLabel: "entregas / sem", metricaValor: 0 },
  },
};

/**
 * Ítems estándar/canónicos para la vista agregada de /necesidades.
 * Los nombres libres (texto largo, medicamentos específicos, etc.) se muestran
 * solo en el detalle de cada centro, no aquí.
 * TODO (Opción B): reemplazar por campo is_standard=true en tabla needs.
 */
const STANDARD_NEEDS = new Set([
  "Medicamentos básicos",
  "Kit primeros auxilios",
  "Agua potable",
  "Colchonetas/frazadas",
  "Pañales",
  "Alimentos no perecederos",
  "Medicamentos crónicos",
  "Ropa niños",
  "Guantes",
  "Guantes descartables",
  "Inyectadoras",
  "Ropa adulto",
  "Zapatos",
]);

export function useImpact() {
  const [metrics, setMetrics] = useState<ImpactMetrics>(EMPTY_METRICS);
  const [topDemand, setTopDemand] = useState<DemandItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      try {
        const { data: centers } = await supabase
          .from("centers")
          .select("id, type, status, state, capacity_used")
          .or("status.is.null,status.neq.cerrado");

        const { count: voluntariosCount } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .in("role", ["voluntario", "voluntario_medico"]);

        const { count: survivorsCount } = await supabase
          .from("survivors")
          .select("*", { count: "exact", head: true })
          .eq("verified", true);

        // Solo needs estándar para la vista agregada de /necesidades.
        // Los ítems de texto libre siguen visible en el detalle de cada centro.
        const { data: needsData } = await supabase
          .from("needs")
          .select("nombre, nivel")
          .in("nombre", Array.from(STANDARD_NEEDS));

        const { data: activityData } = await supabase
          .from("activity_log")
          .select("center_id, message, created_at, centers(name)")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!active) return;

        const centersArr = centers ?? [];

        const porTipo: ImpactMetrics["porTipo"] = {
          albergue: { total: 0, metricaLabel: "familias alojadas", metricaValor: 0 },
          acopio: { total: 0, metricaLabel: "items movidos / sem", metricaValor: 0 },
          medico: { total: 0, metricaLabel: "atenciones / sem", metricaValor: 0 },
          cocina: { total: 0, metricaLabel: "raciones / día", metricaValor: 0 },
          distribucion: { total: 0, metricaLabel: "entregas / sem", metricaValor: 0 },
        };
        for (const c of centersArr) {
          const k = c.type as CenterKind;
          if (!porTipo[k]) continue;
          porTipo[k].total += 1;
          porTipo[k].metricaValor += c.capacity_used ?? 0;
        }

        const NIVEL_RANK: Record<string, number> = {
          critico: 3,
          alto: 2,
          medio: 1,
          bajo: 0,
        };
        const demandMap: Record<string, { total: number; nivelMax: string }> = {};
        for (const n of needsData ?? []) {
          if (!n.nombre) continue;
          const existing = demandMap[n.nombre];
          const nivelRank = NIVEL_RANK[n.nivel ?? "medio"] ?? 1;
          if (!existing) {
            demandMap[n.nombre] = { total: 1, nivelMax: n.nivel ?? "medio" };
          } else {
            existing.total += 1;
            if (nivelRank > (NIVEL_RANK[existing.nivelMax] ?? 0)) {
              existing.nivelMax = n.nivel ?? "medio";
            }
          }
        }

        const demand: DemandItem[] = Object.entries(demandMap)
          .map(([nombre, { total, nivelMax }]) => ({ nombre, total, nivel: nivelMax }))
          .sort((a, b) => {
            if (b.total !== a.total) return b.total - a.total;
            const ra = NIVEL_RANK[a.nivel ?? "medio"] ?? 1;
            const rb = NIVEL_RANK[b.nivel ?? "medio"] ?? 1;
            if (rb !== ra) return rb - ra;
            return a.nombre.localeCompare(b.nombre, "es");
          });

        const now = Date.now();
        const activity: ActivityEntry[] = (activityData ?? []).map((a: any) => ({
          centro: a.centers?.name ?? "Centro",
          accion: a.message ?? "",
          haceMin: Math.round(
            (now - new Date(a.created_at).getTime()) / 60000,
          ),
        }));

        const estadosUnicos = new Set(centersArr.map((c) => c.state)).size;

        let extCentros = 0;
        let extSurvivors = 0;
        try {
          const res = await fetch("https://ayudaavzla.com/api/v1/metricas");
          if (res.ok) {
            const extData = await res.json();
            if (extData.ok) {
              extCentros = extData.lugares?.total || 0;
              extSurvivors = extData.personas?.total || 0;
            }
          }
        } catch (e) {
          console.error("Error fetching external metrics:", e);
        }

        setMetrics({
          centrosActivos: centersArr.length,
          centrosActivosExternos: extCentros,
          necesidadesActivas: needsData?.length ?? 0,
          voluntarios: voluntariosCount ?? 0,
          sobrevivientes: survivorsCount ?? 0,
          sobrevivientesExternos: extSurvivors,
          estados: estadosUnicos,
          porTipo,
        });
        setTopDemand(demand);
        setRecentActivity(activity);
      } catch (err) {
        console.error("useImpact error:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return {
    metrics,
    topDemand,
    recentActivity,
    porTipo: metrics.porTipo,
    isLoading,
  };
}
