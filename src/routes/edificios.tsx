import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Search } from "lucide-react";
import { searchAddress } from "@/lib/nominatim";

export interface Building {
  id: string; // UUID in supabase is string
  edificio: string;
  zona: string | null;
  torre: string | null;
  estatus: string | null;
  created_at: string;
}

export const Route = createFileRoute("/edificios")({
  head: () => ({
    meta: [
      { title: "Edificios registrados · Venezuela Ayuda" },
      {
        name: "description",
        content: "Registro y estatus de edificaciones y estructuras afectadas tras el sismo.",
      },
    ],
  }),
  component: EdificiosPage,
});

function parseBuildingName(name: string): { cleanName: string; parsedZone: string | null } {
  const match = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return {
      cleanName: match[1].trim(),
      parsedZone: match[2].trim(),
    };
  }
  return {
    cleanName: name.trim(),
    parsedZone: null,
  };
}

function getStatusBadge(status: string | null) {
  const normalized = (status || "").toLowerCase().trim();
  switch (normalized) {
    case "perdida_total":
      return {
        label: "Pérdida total",
        classes: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900"
      };
    case "danos_graves":
      return {
        label: "Daños graves",
        classes: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900"
      };
    case "danos_leves":
      return {
        label: "Daños leves",
        classes: "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900"
      };
    case "habitable":
      return {
        label: "Habitable",
        classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
      };
    case "sin_datos":
    default:
      return {
        label: "Sin información",
        classes: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
      };
  }
}

function EdificiosPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    async function fetchBuildings() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("buildings")
          .select("*")
          .order("edificio", { ascending: true });

        if (error) {
          console.error("Error fetching buildings:", error);
        } else {
          setBuildings(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBuildings();
  }, []);

  const filteredBuildings = useMemo(() => {
    return buildings.filter((b) => {
      const { cleanName, parsedZone } = parseBuildingName(b.edificio);
      const zone = b.zona || parsedZone || "Zona no registrada";

      const matchesSearch =
        cleanName.toLowerCase().includes(search.toLowerCase()) ||
        zone.toLowerCase().includes(search.toLowerCase());

      const statusVal = b.estatus || "sin_datos";
      const matchesStatus =
        !selectedStatus || statusVal.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [buildings, search, selectedStatus]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-10 animate-fade-in">
      <header className="text-center space-y-3 max-w-[720px] mx-auto">
        <h1 className="font-display font-semibold text-[32px] sm:text-[40px] leading-tight tracking-tight">
          Edificaciones registradas
        </h1>
        <p className="text-[15px] text-[var(--color-text-muted)]">
          Registro y estatus de edificaciones y estructuras afectadas tras el sismo. Confirma si tu edificio está listado y conoce su estado de evaluación.
        </p>
      </header>

      {/* Disclaimer banner */}
      <div className="rounded-xl border border-amber-250 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 text-[13px] text-amber-800 dark:text-amber-300 flex items-start gap-3 shadow-sm max-w-4xl mx-auto">
        <span className="text-lg leading-none mt-0.5" aria-hidden="true">⚠️</span>
        <div>
          <p className="font-semibold font-display">Información en proceso de evaluación</p>
          <p className="mt-0.5 text-amber-700 dark:text-amber-400">
            La mayoría de las edificaciones no cuentan aún con un estatus oficial de habitabilidad por parte de las autoridades competentes. Esta lista se publica con carácter informativo para que las familias confirmen que su estructura está bajo seguimiento.
          </p>
        </div>
      </div>

      {/* Buscador y Filtro */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_240px] gap-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-muted)]">
              <Search className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre de edificio o zona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-9 pr-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[#E11D2A] focus:ring-2 focus:ring-[#E11D2A]/30 transition-all shadow-sm"
            />
          </div>
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-11 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] text-[var(--color-text-main)] focus:outline-none focus:border-[#E11D2A] focus:ring-2 focus:ring-[#E11D2A]/30 transition-all cursor-pointer shadow-sm"
            >
              <option value="">Todos los estatus</option>
              <option value="sin_datos">Sin información</option>
              <option value="habitable">Habitable</option>
              <option value="danos_leves">Daños leves</option>
              <option value="danos_graves">Daños graves</option>
              <option value="perdida_total">Pérdida total</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center px-1 text-[13px] text-[var(--color-text-muted)]">
          <p>
            Mostrando {filteredBuildings.length} de {buildings.length || 51} edificios
          </p>
        </div>
      </div>

      {/* Grid de Edificios */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <BuildingSkeleton key={i} />
            ))}
          </div>
        ) : filteredBuildings.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-[var(--color-border)] p-12 text-center bg-[var(--color-surface)] shadow-sm max-w-lg mx-auto space-y-4">
            <p className="text-[14px] text-[var(--color-text-muted)]">
              No se encontraron edificaciones que coincidan con los filtros aplicados.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedStatus("");
              }}
              className="px-4 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-md text-[13px] font-display font-semibold transition-all cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredBuildings.map((b) => (
              <BuildingCard key={b.id} building={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BuildingSkeleton() {
  return (
    <div className="bg-white dark:bg-[var(--color-surface)] border border-gray-150 dark:border-[var(--color-border)] rounded-xl p-5 space-y-4 animate-pulse shadow-sm h-36 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 self-end"></div>
    </div>
  );
}

function BuildingCard({ building }: { building: Building }) {
  const { cleanName, parsedZone } = parseBuildingName(building.edificio);
  const initialZone = building.zona || parsedZone;
  const isUnregistered = !initialZone || initialZone === "null" || initialZone === "";
  const [displayZone, setDisplayZone] = useState<string>(
    isUnregistered ? "Zona no registrada" : initialZone!
  );
  const [coords, setCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [loadingGeocode, setLoadingGeocode] = useState(false);

  const geocode = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoadingGeocode(true);
    try {
      let query = `${cleanName}, La Guaira, Venezuela`;
      let results = await searchAddress(query);

      if (results.length === 0) {
        query = `${cleanName}, Venezuela`;
        results = await searchAddress(query);
      }

      if (results.length > 0) {
        const matched = results[0];
        const addr = matched.address;
        const resolved =
          addr.suburb ||
          addr.neighbourhood ||
          addr.city ||
          addr.town ||
          addr.village ||
          addr.state ||
          "Venezuela";

        if (resolved && resolved !== "null") {
          setDisplayZone(resolved);
        }
        setCoords({ lat: matched.lat, lon: matched.lon });
      } else {
        setDisplayZone("Ubicación no encontrada");
      }
    } catch (err) {
      console.error("Geocoding error for building:", cleanName, err);
      setDisplayZone("Error al geolocalizar");
    } finally {
      setLoadingGeocode(false);
    }
  };

  const status = getStatusBadge(building.estatus);
  const mapUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`
    : null;

  return (
    <article className="bg-white dark:bg-[var(--color-surface)] border border-gray-150 dark:border-[var(--color-border)] rounded-xl p-5 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full shadow-sm animate-fade-in">
      <div className="space-y-1">
        <h3 className="font-display font-semibold text-[16px] text-[var(--color-text-main)] leading-snug">
          {cleanName}
        </h3>
        <div className="text-[13px] text-[var(--color-text-muted)] flex items-center gap-1.5 flex-wrap min-h-[20px]">
          <span className="text-[14px]">📍</span>
          {isUnregistered && displayZone === "Zona no registrada" ? (
            <button
              onClick={geocode}
              disabled={loadingGeocode}
              className="inline-flex items-center gap-1 text-[12px] text-[#1f6fb2] hover:text-[#154d7d] dark:text-sky-400 dark:hover:text-sky-300 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingGeocode ? (
                <span className="animate-pulse">Buscando geolocalización...</span>
              ) : (
                <span>Geolocalizar</span>
              )}
            </button>
          ) : (
            <span className="capitalize">{displayZone}</span>
          )}

          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-[12px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-450 dark:hover:text-emerald-355 font-semibold hover:underline ml-1"
            >
              (Ver mapa)
            </a>
          )}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
        <span className="text-[11px] text-[var(--color-text-muted)]">Estado:</span>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${status.classes}`}>
          {status.label}
        </span>
      </div>
    </article>
  );
}
