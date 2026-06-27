import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CenterKind } from "@/data/mock";

export interface DemandItem {
  nombre: string;
  total: number;
}

export interface ActivityEntry {
  centro: string;
  accion: string;
  haceMin: number;
}

export interface ImpactMetrics {
  centrosActivos: number;
  familiasAtendidas: number;
  voluntarios: number;
  estados: number;
  porTipo: Record<
    CenterKind,
    { total: number; metricaLabel: string; metricaValor: number }
  >;
}

const EMPTY_METRICS: ImpactMetrics = {
  centrosActivos: 0,
  familiasAtendidas: 0,
  voluntarios: 0,
  estados: 0,
  porTipo: {
    albergue: { total: 0, metricaLabel: "familias alojadas", metricaValor: 0 },
    acopio: { total: 0, metricaLabel: "items movidos / sem", metricaValor: 0 },
    medico: { total: 0, metricaLabel: "atenciones / sem", metricaValor: 0 },
    cocina: { total: 0, metricaLabel: "raciones / d\u00eda", metricaValor: 0 },
    distribucion: { total: 0, metricaLabel: "entregas / sem", metricaValor: 0 },
  },
};

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
        // Centros activos y conteo por tipo
        const { data: centers } = await supabase
          .from("centers")
          .select("id, type, status, state, capacity_used")
          .neq("status", "cerrado");

        // Voluntarios activos
        const { count: voluntariosCount } = await supabase
          .from("volunteers")
          .select("id", { count: "exact", head: true })
          .eq("status", "active");

        // Top demanda desde tabla needs
        const { data: needsData } = await supabase
          .from("needs")
          .select("nombre")
          .not("nombre", "is", null);

        // Actividad reciente — columnas reales: center_id, message, created_at
        // Join con centers para obtener el nombre
        const { data: activityData } = await supabase
          .from("activity_log")
          .select("center_id, message, created_at, centers(name)")
          .order("created_at", { ascending: false })
          .limit(10);

        // Donaciones para familias atendidas
        const { count: donationsCount } = await supabase
          .from("donations")
          .select("id", { count: "exact", head: true })
          .eq("status", "delivered");

        if (!active) return;

        const centersArr = centers ?? [];

        // Calcular m\u00e9tricas por tipo
        const porTipo: ImpactMetrics["porTipo"] = {
          albergue: { total: 0, metricaLabel: "familias alojadas", metricaValor: 0 },
          acopio: { total: 0, metricaLabel: "items movidos / sem", metricaValor: 0 },
          medico: { total: 0, metricaLabel: "atenciones / sem", metricaValor: 0 },
          cocina: { total: 0, metricaLabel: "raciones / d\u00eda", metricaValor: 0 },
          distribucion: { total: 0, metricaLabel: "entregas / sem", metricaValor: 0 },
        };
        for (const c of centersArr) {
          const k = c.type as CenterKind;
          if (!porTipo[k]) continue;
          porTipo[k].total += 1;
          porTipo[k].metricaValor += c.capacity_used ?? 0;
        }

        // Top demand: agrupar por nombre y contar
        const demandMap: Record<string, number> = {};
        for (const n of needsData ?? []) {
          if (n.nombre) {
            demandMap[n.nombre] = (demandMap[n.nombre] ?? 0) + 1;
          }
        }
        const demand: DemandItem[] = Object.entries(demandMap)
          .map(([nombre, total]) => ({ nombre, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 8);

        // Actividad reciente con nombre del centro via join
        const now = Date.now();
        const activity: ActivityEntry[] = (activityData ?? []).map((a: any) => ({
          centro: a.centers?.name ?? "Centro",
          accion: a.message ?? "",
          haceMin: Math.round(
            (now - new Date(a.created_at).getTime()) / 60000,
          ),
        }));

        const estadosUnicos = new Set(centersArr.map((c) => c.state)).size;

        setMetrics({
          centrosActivos: centersArr.length,
          familiasAtendidas: donationsCount ?? 0,
          voluntarios: voluntariosCount ?? 0,
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
