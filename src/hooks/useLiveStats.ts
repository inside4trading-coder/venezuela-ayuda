import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface LiveStats {
  albergues: number;
  acopios: number;
  medicos: number;
  cocinas: number;
  distribucion: number;
  familiasEnAlbergues: number;
  itemsEnInventario: number;
  rutasActivas: number;
  voluntarios: number;
  donaciones: number;
  topNeeds: Array<{ nombre: string; count: number }>;
  lastUpdate: Date;
}

const REFRESH_MS = 60_000;

async function fetchStats(): Promise<LiveStats> {
  const [centers, inv, routes, vols, dons, needsRes] = await Promise.all([
    supabase
      .from("centers")
      .select("type, capacity_used")
      .not("verified_at", "is", null),
    supabase.from("inventory_items").select("quantity"),
    supabase
      .from("routes")
      .select("status")
      .in("status", ["planned", "in_transit"]),
    supabase.from("volunteers").select("status", { count: "exact", head: true }),
    supabase.from("donations").select("status", { count: "exact", head: true }),
    supabase.from("needs").select("nombre").not("nombre", "is", null),
  ]);
  if (needsRes.error) console.warn("useLiveStats needs error:", needsRes.error);

  const rows = (centers.data as Array<{ type: string | null; capacity_used: number | null }>) ?? [];
  const byType = {
    albergues: rows.filter((r) => r.type === "albergue").length,
    acopios: rows.filter((r) => r.type === "acopio").length,
    medicos: rows.filter((r) => r.type === "medico").length,
    cocinas: rows.filter((r) => r.type === "cocina").length,
    distribucion: rows.filter((r) => r.type === "distribucion").length,
  };
  const familias = rows
    .filter((r) => r.type === "albergue")
    .reduce((acc, r) => acc + (r.capacity_used ?? 0), 0);

  const items = ((inv.data as Array<{ quantity: number | null }>) ?? [])
    .reduce((acc, r) => acc + (r.quantity ?? 0), 0);

  // Top 5 necesidades agregadas: contar ocurrencias por nombre.
  const needsRows = (needsRes.data as Array<{ nombre: string | null }>) ?? [];
  const counts = new Map<string, number>();
  for (const r of needsRows) {
    const key = (r.nombre ?? "").trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const topNeeds = [...counts.entries()]
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  console.log("[liveStats]", {
    needsRowsTotal: needsRows.length,
    uniqueNombres: counts.size,
    topNeeds,
  });

  return {
    ...byType,
    familiasEnAlbergues: familias,
    itemsEnInventario: items,
    rutasActivas: (routes.data ?? []).length,
    voluntarios: vols.count ?? 0,
    donaciones: dons.count ?? 0,
    topNeeds,
    lastUpdate: new Date(),
  };
}

export function useLiveStats() {
  const [stats, setStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const s = await fetchStats();
        if (alive) setStats(s);
      } catch (err) {
        console.warn("useLiveStats:", err);
      }
    };
    tick();
    const id = setInterval(tick, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return stats;
}

const fmt = (n: number) =>
  n >= 1000 ? n.toLocaleString("es-VE") : n.toString();

/** Convierte stats en líneas humanas para el ticker. Omite las que dan 0. */
export function statsToTickerItems(s: LiveStats): string[] {
  const items: string[] = [];
  if (s.albergues > 0)
    items.push(
      s.familiasEnAlbergues > 0
        ? `${s.albergues} albergues · ${fmt(s.familiasEnAlbergues)} familias`
        : `${s.albergues} albergues activos`,
    );
  if (s.acopios > 0)
    items.push(
      s.itemsEnInventario > 0
        ? `${s.acopios} acopios · ${fmt(s.itemsEnInventario)} ítems en stock`
        : `${s.acopios} acopios activos`,
    );
  if (s.medicos > 0) items.push(`${s.medicos} puntos médicos`);
  if (s.cocinas > 0) items.push(`${s.cocinas} cocinas comunitarias`);
  if (s.distribucion > 0)
    items.push(
      s.rutasActivas > 0
        ? `${s.distribucion} centros de distribución · ${s.rutasActivas} rutas activas`
        : `${s.distribucion} centros de distribución`,
    );
  if (s.voluntarios > 0) items.push(`${fmt(s.voluntarios)} voluntarios`);
  if (s.donaciones > 0) items.push(`${fmt(s.donaciones)} donaciones registradas`);

  if (s.topNeeds.length > 0) {
    // Línea individual por cada necesidad top, con el contador de centros que la piden
    for (const n of s.topNeeds) {
      const label = n.nombre.length > 40 ? n.nombre.slice(0, 37) + "…" : n.nombre;
      items.push(`Necesita: ${label} (${n.count})`);
    }
  }

  const mins = Math.max(0, Math.round((Date.now() - s.lastUpdate.getTime()) / 60_000));
  items.push(
    mins === 0
      ? "Actualizado ahora"
      : `Actualizado hace ${mins} ${mins === 1 ? "min" : "min"}`,
  );
  return items;
}
