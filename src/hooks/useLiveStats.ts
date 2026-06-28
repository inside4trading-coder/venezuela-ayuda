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
  survivors?: Array<{ full_name: string; location_name: string | null; estado_fisico: string }>;
  lastUpdate: Date;
}

const REFRESH_MS = 60_000;

async function fetchStats(): Promise<LiveStats> {
  const [centers, inv, routes, vols, dons, needsRes, survivorsRes] = await Promise.all([
    supabase
      .from("centers")
      .select("type, capacity_used")
      .not("verified_at", "is", null),
    supabase.from("inventory_items").select("quantity"),
    supabase
      .from("routes")
      .select("status")
      .in("status", ["planned", "in_transit"]),
    // Voluntarios: conteo desde profiles por rol (fuente única de verdad)
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["voluntario", "voluntario_medico"]),
    supabase.from("donations").select("status", { count: "exact", head: true }),
    supabase.from("needs").select("nombre").not("nombre", "is", null),
    supabase
      .from("survivors")
      .select("full_name, location_name, estado_fisico")
      .eq("verified", true)
      .limit(20)
      .order("created_at", { ascending: false }),
  ]);
  if (needsRes.error) console.warn("useLiveStats needs error:", needsRes.error);
  if (survivorsRes.error) console.warn("useLiveStats survivors error:", survivorsRes.error);

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

  const survivorsRows = (survivorsRes.data as Array<{ full_name: string; location_name: string | null; estado_fisico: string }>) ?? [];

  return {
    ...byType,
    familiasEnAlbergues: familias,
    itemsEnInventario: items,
    rutasActivas: (routes.data ?? []).length,
    voluntarios: vols.count ?? 0,
    donaciones: dons.count ?? 0,
    topNeeds,
    survivors: survivorsRows,
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

  const needItems: string[] = [];
  if (s.topNeeds.length > 0) {
    for (const n of s.topNeeds) {
      const label = n.nombre.length > 40 ? n.nombre.slice(0, 37) + "…" : n.nombre;
      needItems.push(`Necesita: ${label} (${n.count})`);
    }
  }

  const survivorItems: string[] = (s.survivors ?? []).map((surv) => {
    const isCritical = surv.estado_fisico === "herido_grave" || surv.estado_fisico === "critico";
    const prefix = isCritical ? "🔴 " : "";
    const loc = surv.location_name ? surv.location_name.trim() : "Desconocida";
    return `${prefix}Sobreviviente: ${surv.full_name.trim()} · ${loc}`;
  });

  const mixedItems: string[] = [];
  const maxLength = Math.max(needItems.length, survivorItems.length);
  for (let i = 0; i < maxLength; i++) {
    if (i < needItems.length) {
      mixedItems.push(needItems[i]);
    }
    if (i < survivorItems.length) {
      mixedItems.push(survivorItems[i]);
    }
  }

  items.push(...mixedItems);

  const mins = Math.max(0, Math.round((Date.now() - s.lastUpdate.getTime()) / 60_000));
  items.push(
    mins === 0
      ? "Actualizado ahora"
      : `Actualizado hace ${mins} ${mins === 1 ? "min" : "min"}`,
  );
  return items;
}
