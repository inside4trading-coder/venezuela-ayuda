import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Select } from "@/components/ui-vh/Field";
import { ESTADOS_VENEZUELA } from "@/data/mock";
import { useSurvivors, type Survivor } from "@/hooks/useSurvivors";
import { useExternalSurvivors } from "@/hooks/useExternalSurvivors";
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
  const [source, setSource] = useState<"local" | "external">("local");
  const [selectedSurvivor, setSelectedSurvivor] = useState<Survivor | null>(null);
  const [survivorSearch, setSurvivorSearch] = useState<string>("");
  const [survivorState, setSurvivorState] = useState<string>("");
  const [survivorPage, setSurvivorPage] = useState<number>(1);
  const [hideReunited, setHideReunited] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const localFilters = useMemo(
    () => ({
      search: survivorSearch || undefined,
      state: survivorState || undefined,
      page: survivorPage,
      pageSize: 10,
      hideReunited,
      refreshKey,
    }),
    [survivorSearch, survivorState, survivorPage, hideReunited, refreshKey],
  );

  const externalFilters = useMemo(
    () => ({
      search: survivorSearch || undefined,
      state: survivorState || undefined,
      page: survivorPage,
      pageSize: 10,
    }),
    [survivorSearch, survivorState, survivorPage],
  );

  const { items: localSurvivors, totalCount: localTotal, loading: localLoading } =
    useSurvivors(localFilters);

  const { items: externalSurvivors, totalCount: externalTotal, loading: externalLoading, error: externalError } =
    useExternalSurvivors(externalFilters);

  const survivors = useMemo(() => {
    if (source === "local") {
      return localSurvivors;
    } else {
      if (hideReunited) {
        return externalSurvivors.filter((s) => !s.reunited_at);
      }
      return externalSurvivors;
    }
  }, [source, localSurvivors, externalSurvivors, hideReunited]);

  const totalSurvivors = source === "local" ? localTotal : (hideReunited ? survivors.length : externalTotal);
  const loadingSurvivors = source === "local" ? localLoading : externalLoading;

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

        {/* Pestañas de Origen */}
        <div className="flex border-b border-[var(--color-border)] mb-6">
          <button
            onClick={() => {
              setSource("local");
              setSurvivorPage(1);
            }}
            className={`px-5 py-3 text-[14px] font-display font-medium border-b-2 transition-all -mb-px cursor-pointer ${
              source === "local"
                ? "border-emerald-600 text-emerald-600 font-semibold"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            }`}
          >
            Registro Consolidado (Local + Importados)
          </button>
          <button
            onClick={() => {
              setSource("external");
              setSurvivorPage(1);
            }}
            className={`px-5 py-3 text-[14px] font-display font-medium border-b-2 transition-all -mb-px flex items-center gap-2 cursor-pointer ${
              source === "external"
                ? "border-[#1f6fb2] text-[#1f6fb2] font-semibold"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            }`}
          >
            Red ayudaavzla.com
            <span className="text-[10px] bg-sky-100 text-sky-855 dark:bg-sky-950 dark:text-sky-300 px-1.5 py-0.5 rounded font-mono font-normal">
              Externo
            </span>
          </button>
        </div>

        {/* Alerta informativa para la base externa */}
        {source === "external" && (
          <div className="rounded-xl border border-sky-200 dark:border-sky-950 bg-sky-50 dark:bg-sky-950/20 p-4 text-[13px] text-sky-800 dark:text-sky-300 flex items-start gap-3 shadow-sm">
            <span className="text-lg leading-none mt-0.5" aria-hidden="true">ℹ️</span>
            <div>
              <p className="font-semibold font-display">Conexión directa a ayudaavzla.com</p>
              <p className="mt-0.5 text-sky-700 dark:text-sky-400">
                Estás consultando en tiempo real la base de datos abierta de ayudaavzla.com. Esta información es administrada por voluntarios externos. Si encuentras a un familiar, por favor confirma sus datos con el centro de ayuda de origen.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_240px] gap-4">
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
            <option value="">Todos los Estados</option>
            {ESTADOS_VENEZUELA.map((s) => (
              <option key={s} value={s}>
                {s}
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

        {source === "external" && externalError && (
          <div className="p-4 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 rounded-lg text-sm">
            {externalError}
          </div>
        )}

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
                          {s.registered_by === "ayudaavzla.com" && (
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
