import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type {
  Center,
  CenterKind,
  CenterStatus,
  NeedLevel,
  Need,
} from "@/data/mock";

export interface CenterFilters {
  query?: string;
  status?: CenterStatus | "todos";
  needs?: string[];
  kinds?: CenterKind[];
}

// Cache a nivel módulo — un solo fetch por sesión
let _cache: Center[] | null = null;
let _promise: Promise<Center[]> | null = null;

function mapRow(row: any): Center {
  const kind = row.type as CenterKind;

  // Mapear el estado de Supabase a los estados de la UI
  let estado: CenterStatus = "activo";
  if (row.status === "critico") {
    estado = "urgente";
  } else if (row.status === "lleno") {
    estado = "capacidad-llena";
  } else if (row.status === "inactivo") {
    estado = "cerrado";
  } else if (
    row.status === "urgente" ||
    row.status === "activo" ||
    row.status === "capacidad-llena" ||
    row.status === "cerrado"
  ) {
    estado = row.status as CenterStatus;
  }

  // Mapear las necesidades. Defensive: PostgREST puede devolver array,
  // object (one-to-one inferido) o null. Normalizamos a array.
  const rawNeeds = Array.isArray(row.needs)
    ? row.needs
    : row.needs && typeof row.needs === "object"
    ? [row.needs]
    : [];
  const necesita: Need[] = rawNeeds.map((n: any) => {
    let nivel: NeedLevel = "medio";
    if (n.nivel === "critico") {
      nivel = "critico";
    } else if (n.nivel === "alto") {
      nivel = "alto";
    } else if (n.nivel === "medio" || n.nivel === "bajo") {
      nivel = "medio";
    }

    return {
      nombre: n.nombre ?? "",
      nivel,
      cantidadAprox: n.cantidad_aprox ?? "",
    };
  });

  const tieneUrgente = necesita
    .filter((n) => n.nivel === "critico")
    .map((n) => n.nombre);

  const base = {
    id: row.id,
    nombre: row.name ?? "",
    kind,
    estado,
    ciudad: row.city ?? "",
    estadoVe: row.state ?? "",
    direccion: row.address ?? "",
    espacio: "Instalación de ayuda",
    coordinador: "Coordinador del centro",
    telefono: row.phone ?? "",
    email: "contacto@venezuelaayuda.org",
    horario: "Lun–Dom 8:00 – 18:00",
    necesita,
    tieneUrgente,
    tieneSuficiente: [] as string[],
    actualizadoHaceMin: 0,
    lat: row.lat,
    lng: row.lng,
  };

  switch (kind) {
    case "albergue":
      return {
        ...base,
        kind: "albergue",
        familiasActuales: row.capacity_used ?? 0,
        capacidadMax: row.capacity ?? 100,
        capacidadPct: row.capacity
          ? Math.round(((row.capacity_used ?? 0) / row.capacity) * 100)
          : 0,
        familiasHoy: 0,
        voluntariosActivos: 0,
      };
    case "acopio":
      return {
        ...base,
        kind: "acopio",
        itemsEnInventario: row.capacity_used ?? 0,
        salidasSemana: 0,
        m2Almacen: row.capacity ?? 100,
        vehiculosDisponibles: 0,
      };
    case "medico":
      return {
        ...base,
        kind: "medico",
        atencionesHoy: row.capacity_used ?? 0,
        medicosActivos: 0,
        medicamentosCriticos: [] as string[],
        tieneQuirofano: false,
      };
    case "cocina":
      return {
        ...base,
        kind: "cocina",
        racionesDia: row.capacity_used ?? 0,
        racionesCapacidad: row.capacity ?? 100,
        cocinerosActivos: 0,
        proximaEntrega: "No programada",
      };
    case "distribucion":
      return {
        ...base,
        kind: "distribucion",
        familiasRuta: row.capacity ?? 0,
        entregasHoy: row.capacity_used ?? 0,
        zonasCubiertas: [] as string[],
        vehiculosActivos: 0,
      };
    default:
      return base as any;
  }
}

async function fetchAll(): Promise<Center[]> {
  if (_cache) return _cache;
  if (_promise) return _promise;

  _promise = (async () => {
    try {
      // Intentamos con el embed de needs. Si no hay FK declarada,
      // PostgREST falla; en ese caso reintentamos sin el embed.
      let { data, error } = await supabase.from("centers").select(`
          id, name, type, status, address, city, state,
          lat, lng, phone, capacity, capacity_used, verified_at,
          needs ( id, nombre, nivel, cantidad_aprox )
        `);

      if (error) {
        console.warn("centers select with needs embed failed:", error.message);
        const retry = await supabase.from("centers").select(`
          id, name, type, status, address, city, state,
          lat, lng, phone, capacity, capacity_used, verified_at
        `);
        if (retry.error) throw retry.error;
        data = retry.data;
      }
      _cache = (data ?? []).map(mapRow);
      return _cache;
    } catch (err) {
      _promise = null;
      console.error("centers fetch failed:", err);
      throw err;
    }
  })();

  return _promise;
}

export function useCenters(filters: CenterFilters = {}) {
  const { query = "", status = "todos", needs = [], kinds = [] } = filters;
  const [all, setAll] = useState<Center[]>(_cache ?? []);
  const [isLoading, setIsLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) return;
    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAll();
        if (active) setAll(data);
      } catch (err) {
        console.error("Error fetching centers:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("centers-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "centers" },
        () => {
          _cache = null;
          fetchAll().then(setAll);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "needs" },
        () => {
          _cache = null;
          fetchAll().then(setAll);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const centers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((c) => {
      if (kinds.length > 0 && !kinds.includes(c.kind)) return false;
      if (
        q &&
        !`${c.nombre} ${c.ciudad} ${c.estadoVe}`.toLowerCase().includes(q)
      )
        return false;
      if (status !== "todos" && c.estado !== status) return false;
      if (needs.length > 0) {
        const centerNeedNames = c.necesita.map((n) => n.nombre.toLowerCase());
        if (
          !needs.some((n) =>
            centerNeedNames.some((cn) => cn.includes(n.toLowerCase())),
          )
        )
          return false;
      }
      return true;
    });
  }, [all, query, status, needs, kinds]);

  return { centers, total: all.length, isLoading };
}

export function useCenter(id: string | undefined) {
  const [center, setCenter] = useState<Center | undefined>(
    _cache?.find((c) => c.id === id),
  );
  const [isLoading, setIsLoading] = useState(
    !!id && !_cache?.find((c) => c.id === id),
  );

  useEffect(() => {
    if (!id) return;
    if (_cache) {
      const found = _cache.find((c) => c.id === id);
      if (found) {
        setCenter(found);
        return;
      }
    }

    let active = true;
    const fetchSingle = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("centers")
          .select(`
            id, name, type, status, address, city, state,
            lat, lng, phone, capacity, capacity_used, verified_at,
            needs ( id, nombre, nivel, cantidad_aprox )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        if (active && data) {
          setCenter(mapRow(data));
        }
      } catch (err) {
        console.error("Error fetching center:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchSingle();
    return () => {
      active = false;
    };
  }, [id]);

  return { center, isLoading };
}

export function countByKind(): Record<CenterKind, number> {
  const out: Record<CenterKind, number> = {
    albergue: 0,
    acopio: 0,
    medico: 0,
    cocina: 0,
    distribucion: 0,
  };
  if (_cache) {
    for (const c of _cache) {
      out[c.kind] = (out[c.kind] ?? 0) + 1;
    }
  }
  return out;
}
