import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Select } from "@/components/ui-vh/Field";
import { ESTADOS_VENEZUELA } from "@/data/mock";
import { useSurvivors, type Survivor } from "@/hooks/useSurvivors";
import { SurvivorDetailDialog } from "@/components/rescatados/SurvivorDetailDialog";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";


export const Route = createFileRoute("/rescatados")({
  head: () => ({
    meta: [
      { title: "Encuentra a tus familiares · Venezuela Ayuda" },
      {
        name: "description",
        content:
          "Buscador del registro consolidado de sobrevivientes reportados en hospitales y refugios tras el sismo.",
      },
    ],
  }),
  component: RescatadosPage,
});

function getEstadoFisicoBadge(estado: string) {
  switch (estado) {
    case "estable":
      return { label: "Estable", classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" };
    case "herido_leve":
      return { label: "Herido Leve", classes: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900" };
    case "herido_grave":
      return { label: "Herido Grave", classes: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900" };
    case "critico":
      return { label: "Crítico", classes: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900" };
    case "fallecido":
      return { label: "Fallecido", classes: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700" };
    default:
      return { label: estado || "Sin estado", classes: "bg-gray-100 text-gray-800 border-gray-200" };
  }
}

function RescatadosPage() {
  const [selectedSurvivor, setSelectedSurvivor] = useState<Survivor | null>(null);
  const [survivorSearch, setSurvivorSearch] = useState<string>("");
  const [survivorState, setSurvivorState] = useState<string>("");
  const [survivorPhysicalState, setSurvivorPhysicalState] = useState<string>("");
  const [survivorLocation, setSurvivorLocation] = useState<string>("");
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);
  const [survivorPage, setSurvivorPage] = useState<number>(1);
  const [hideReunited, setHideReunited] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let active = true;
    supabase
      .from("survivors")
      .select("location_name")
      .eq("verified", true)
      .not("location_name", "is", null)
      .then(({ data }) => {
        if (!active) return;
        if (data) {
          const names = Array.from(new Set(data.map((d) => d.location_name))) as string[];
          setUniqueLocations(names.filter(Boolean).sort());
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const localFilters = useMemo(
    () => ({
      search: survivorSearch || undefined,
      state: survivorState || undefined,
      estado_fisico: survivorPhysicalState || undefined,
      location_name: survivorLocation || undefined,
      page: survivorPage,
      pageSize: 10,
      hideReunited,
      refreshKey,
    }),
    [
      survivorSearch,
      survivorState,
      survivorPhysicalState,
      survivorLocation,
      survivorPage,
      hideReunited,
      refreshKey,
    ],
  );

  const { items: survivors, totalCount: totalSurvivors, loading: loadingSurvivors } =
    useSurvivors(localFilters);

  const totalPages = Math.max(1, Math.ceil(totalSurvivors / 10));

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-10">
      <header className="text-center space-y-3 max-w-[720px] mx-auto">
        <h1 className="font-display font-semibold text-[32px] sm:text-[40px] leading-tight tracking-tight">
          Encuentra a tus familiares
        </h1>
        <p className="text-[15px] text-[var(--color-text-muted)]">
          Registro consolidado de sobrevivientes reportados en hospitales,
          albergues y refugios tras el sismo. Busca por nombre y confirma
          identidad con la cédula antes de movilizarte.
        </p>
      </header>

      <section className="space-y-6">
        <div>
          <h2 className="font-display font-semibold text-[22px] tracking-tight">
            Lista de sobrevivientes registrados
          </h2>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
            Información cargada desde reportes oficiales de centros médicos y albergues.
          </p>
        </div>



        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
            </span>
            <input
              type="text"
              placeholder="Buscar sobreviviente por nombre..."
              value={survivorSearch}
              onChange={(e) => {
                setSurvivorSearch(e.target.value);
                setSurvivorPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 border-hair border-[var(--color-border)] bg-[var(--color-surface)] text-[14px] rounded-md text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>

          <Select
            value={survivorState}
            onChange={(e) => {
              setSurvivorState(e.target.value);
              setSurvivorPage(1);
            }}
          >
            <option value="">Todos los Estados (Región)</option>
            {ESTADOS_VENEZUELA.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Select
            value={survivorPhysicalState}
            onChange={(e) => {
              setSurvivorPhysicalState(e.target.value);
              setSurvivorPage(1);
            }}
          >
            <option value="">Todos los Estados Físicos</option>
            <option value="estable">Estable</option>
            <option value="herido_leve">Herido Leve</option>
            <option value="herido_grave">Herido Grave</option>
            <option value="critico">Crítico</option>
            <option value="fallecido">Fallecido</option>
          </Select>

          <Select
            value={survivorLocation}
            onChange={(e) => {
              setSurvivorLocation(e.target.value);
              setSurvivorPage(1);
            }}
          >
            <option value="">Todos los Centros / Ubicaciones</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </Select>
        </div>

        <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideReunited}
            onChange={(e) => {
              setHideReunited(e.target.checked);
              setSurvivorPage(1);
            }}
            className="accent-emerald-600 w-4 h-4 cursor-pointer"
          />
          Ocultar reunidos con familia
        </label>


        {loadingSurvivors ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando sobrevivientes...</p>
        ) : survivors.length === 0 ? (
          <div className="p-8 border border-dashed border-[var(--color-border)] rounded-lg text-center text-[13px] text-[var(--color-text-muted)] bg-[var(--color-surface)]">
            No se encontraron sobrevivientes verificados con estos filtros.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Ubicación</th>
                    <th className="p-3">Estado Físico</th>
                    <th className="p-3">Fecha de Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {survivors.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSurvivor(s)}
                      className="hover:bg-[var(--color-surface-alt)]/50 transition-colors cursor-pointer"
                    >
                      <td className="p-3 font-semibold text-[var(--color-text-main)]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{s.full_name}</span>
                          {s.reunited_at && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                              ✓ Reunido
                            </span>
                          )}
                          {(s.registered_by === "ayudaavzla.com" || s.location_type === "Externo") && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-100 text-sky-850 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-900 font-mono">
                              ayudaavzla.com
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="block text-[var(--color-text-main)]">
                          {s.location_name || "Desconocido"}
                        </span>
                        <span className="block text-[11px] text-[var(--color-text-muted)]">
                          {s.current_city ? `${s.current_city}, ` : ""}{s.current_state}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getEstadoFisicoBadge(s.estado_fisico).classes}`}>
                          {getEstadoFisicoBadge(s.estado_fisico).label}
                        </span>
                      </td>
                      <td className="p-3 text-[var(--color-text-muted)]">
                        {new Date(s.created_at).toLocaleDateString("es-VE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 pt-2">
                <span className="text-[12px] text-[var(--color-text-muted)]">
                  Página <span className="font-semibold text-[var(--color-text-main)]">{survivorPage}</span> de{" "}
                  <span className="font-semibold text-[var(--color-text-main)]">{totalPages}</span> ({totalSurvivors} registros)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSurvivorPage((p) => Math.max(1, p - 1))}
                    disabled={survivorPage === 1}
                    className="p-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-50 hover:bg-[var(--color-surface-alt)] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSurvivorPage((p) => Math.min(totalPages, p + 1))}
                    disabled={survivorPage === totalPages}
                    className="p-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-50 hover:bg-[var(--color-surface-alt)] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <SurvivorDetailDialog
        survivor={selectedSurvivor}
        onClose={() => setSelectedSurvivor(null)}
        onUpdated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
