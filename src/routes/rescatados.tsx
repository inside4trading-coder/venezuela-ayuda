import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Field, TextInput, Select } from "@/components/ui-vh/Field";
import { ESTADOS_VENEZUELA } from "@/data/mock";
import { useRescuedPersons } from "@/hooks/useRescuedPersons";
import { useAvailableCenters } from "@/hooks/useAvailableCenters";
import { useRegisterRescued } from "@/hooks/useRegisterRescued";
import { useSearchPerson } from "@/hooks/useSearchPerson";
import { useSurvivors } from "@/hooks/useSurvivors";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Users, Search, Home, ChevronLeft, ChevronRight, HelpCircle, Check } from "lucide-react";

export const Route = createFileRoute("/rescatados")({
  head: () => ({
    meta: [
      { title: "Rescatados y Albergues · Venezuela Ayuda" },
      {
        name: "description",
        content:
          "Marketplace de albergues y buscador de sobrevivientes en zonas afectadas.",
      },
    ],
  }),
  component: RescatadosMarketplace,
});

function timeAgo(dateString: string): string {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs)) return "Recientemente";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "hace un momento";
    if (diffMins < 60) return `hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours} hr`;
    const diffDays = Math.floor(diffHours / 24);
    return `hace ${diffDays} días`;
  } catch (e) {
    return "Recientemente";
  }
}

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
      return { label: estado, classes: "bg-gray-100 text-gray-800 border-gray-200" };
  }
}

function getCenterKindLabel(kind: string) {
  switch (kind) {
    case "albergue":
      return "🏠 Albergue";
    case "acopio":
      return "📦 Centro de Acopio";
    case "medico":
      return "🏥 Asistencia Médica";
    case "cocina":
      return "🍳 Cocina Comunitaria";
    case "distribucion":
      return "🚚 Distribución";
    default:
      return kind;
  }
}

function RescatadosMarketplace() {
  const [activeForm, setActiveForm] = useState<"albergue" | "familiar" | null>(null);

  // Formulario A - Busca albergue
  const [formA, setFormA] = useState({
    contact_name: "",
    phone: "",
    people_count: 1,
    has_children: false,
    has_elderly: false,
    has_medical: false,
    has_pets: false,
    current_state: "Distrito Capital",
  });

  const { register: registerRescued, busy: registeringA } = useRegisterRescued();

  // Formulario B - Busca familiar o sobreviviente
  const [formB, setFormB] = useState({
    nombre_buscado: "",
    phone: "",
    current_state: "",
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchingB, setSearchingB] = useState(false);

  // Marketplace filter
  const [selectedStateMarket, setSelectedStateMarket] = useState<string>("");

  const rescuedFilters = useMemo(
    () => ({
      tipo: "busca_albergue" as const,
      status: "activo" as const,
      current_state: selectedStateMarket || undefined,
    }),
    [selectedStateMarket]
  );

  const availableCentersFilters = useMemo(
    () => ({
      state: selectedStateMarket || undefined,
    }),
    [selectedStateMarket]
  );

  const { items: rescuedFamilies, loading: loadingRescued } = useRescuedPersons(rescuedFilters);
  const { centers: availableCenters, loading: loadingCenters } = useAvailableCenters(availableCentersFilters);

  // Sección buscador de sobrevivientes
  const [survivorSearch, setSurvivorSearch] = useState<string>("");
  const [survivorState, setSurvivorState] = useState<string>("");
  const [survivorPage, setSurvivorPage] = useState<number>(1);

  const survivorFilters = useMemo(
    () => ({
      search: survivorSearch || undefined,
      state: survivorState || undefined,
      page: survivorPage,
      pageSize: 10,
    }),
    [survivorSearch, survivorState, survivorPage]
  );

  const { items: survivors, totalCount: totalSurvivors, loading: loadingSurvivors } = useSurvivors(survivorFilters);

  const totalPages = Math.max(1, Math.ceil(totalSurvivors / 10));

  const handleSubmitA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formA.contact_name.trim()) {
      toast.error("El nombre completo es obligatorio.");
      return;
    }
    if (!formA.phone.trim()) {
      toast.error("El número de WhatsApp es obligatorio.");
      return;
    }

    const { error } = await registerRescued({
      tipo: "busca_albergue",
      contact_name: formA.contact_name.trim(),
      phone: formA.phone.trim(),
      people_count: formA.people_count,
      has_children: formA.has_children,
      has_elderly: formA.has_elderly,
      has_medical: formA.has_medical,
      has_pets: formA.has_pets,
      current_state: formA.current_state,
    });

    if (error) {
      toast.error("Error al registrar: " + error);
    } else {
      toast.success("Solicitud de albergue registrada con éxito.");
      setFormA({
        contact_name: "",
        phone: "",
        people_count: 1,
        has_children: false,
        has_elderly: false,
        has_medical: false,
        has_pets: false,
        current_state: "Distrito Capital",
      });
      setActiveForm(null);
    }
  };

  const handleSearchB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formB.nombre_buscado.trim()) {
      toast.error("El nombre de quien buscas es obligatorio.");
      return;
    }
    if (!formB.phone.trim()) {
      toast.error("Tu WhatsApp es obligatorio.");
      return;
    }

    setSearchingB(true);
    setSearched(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;

      // 1. Invocar RPC
      const { data, error } = await supabase.rpc("search_person", {
        search_name: formB.nombre_buscado.trim(),
        search_state: formB.current_state && formB.current_state.trim() !== "" ? formB.current_state.trim() : null,
      });

      if (error) {
        toast.error("Error al buscar: " + error.message);
        return;
      }

      setSearchResults(data ?? []);
      setSearched(true);

      // 2. Si no hay resultados, registrar en rescatados
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase
          .from("rescued_persons")
          .insert({
            tipo: "busca_familiar",
            contact_name: `Búsqueda de familiar`,
            phone: formB.phone.trim(),
            current_state: formB.current_state || "Desconocido",
            nombre_buscado: formB.nombre_buscado.trim(),
            status: "activo",
            registered_by: userId,
          });

        if (insertError) {
          console.error("Error al registrar búsqueda:", insertError);
        } else {
          toast.info("Búsqueda no encontrada. Registramos tu solicitud para notificarte si aparece.");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error de conexión al servidor.");
    } finally {
      setSearchingB(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-12">
      {/* Sección Hero */}
      <header className="text-center space-y-4 max-w-[800px] mx-auto">
        <h1 className="font-display font-semibold text-[32px] sm:text-[40px] leading-tight tracking-tight">
          Módulo de Rescate y Albergues
        </h1>
        <p className="text-[15px] text-[var(--color-text-muted)]">
          Canal de coordinación rápido para familias afectadas y sobrevivientes. Solicita albergue de forma inmediata o consulta reportes de centros de salud.
        </p>

        {/* Dos botones grandes de acción */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[640px] mx-auto">
          <button
            onClick={() => setActiveForm(activeForm === "albergue" ? null : "albergue")}
            className="flex flex-col items-center justify-center p-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 transition-all shadow-sm hover:shadow-md cursor-pointer group"
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🏠</span>
            <span className="font-display font-semibold text-[16px] text-[#c8102e] dark:text-red-400">
              Necesito un albergue
            </span>
            <span className="text-[12px] text-red-700/80 dark:text-red-300/80 mt-1">
              Pide asistencia para ti o tu grupo familiar
            </span>
          </button>

          <button
            onClick={() => setActiveForm(activeForm === "familiar" ? null : "familiar")}
            className="flex flex-col items-center justify-center p-6 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 transition-all shadow-sm hover:shadow-md cursor-pointer group"
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔍</span>
            <span className="font-display font-semibold text-[16px] text-[#1a56db] dark:text-blue-400">
              Busco a un familiar o sobreviviente
            </span>
            <span className="text-[12px] text-blue-700/80 dark:text-blue-300/80 mt-1">
              Consulta el registro consolidado de albergues
            </span>
          </button>
        </div>
      </header>

      {/* Formularios Expansibles */}
      {activeForm && (
        <section className="bg-[var(--color-surface)] border-hair border-[var(--color-border)] rounded-xl p-6 sm:p-8 max-w-[600px] mx-auto shadow-sm transition-all">
          {activeForm === "albergue" ? (
            <form onSubmit={handleSubmitA} className="space-y-6">
              <div className="border-b border-[var(--color-border)] pb-3">
                <h3 className="font-display font-semibold text-[18px] text-[#c8102e] dark:text-red-400">
                  Formulario de Solicitud de Albergue
                </h3>
                <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                  Tu solicitud será visible públicamente para los coordinadores de los centros de ayuda.
                </p>
              </div>

              <Field label="Tu nombre completo">
                <TextInput
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={formA.contact_name}
                  onChange={(e) => setFormA({ ...formA, contact_name: e.target.value })}
                  required
                />
              </Field>

              <Field label="WhatsApp / Teléfono de contacto">
                <TextInput
                  type="tel"
                  placeholder="Ej. +58 412 1234567"
                  value={formA.phone}
                  onChange={(e) => setFormA({ ...formA, phone: e.target.value })}
                  required
                />
              </Field>

              <div>
                <label className="block mb-2 text-[13px] text-[var(--color-text-main)]">
                  ¿Cuántas personas requieren albergue?
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormA({ ...formA, people_count: num })}
                      className={`px-4 py-2 text-[13px] rounded-md font-medium border transition-all cursor-pointer ${
                        formA.people_count === num
                          ? "bg-[var(--color-critical)] text-white border-[var(--color-critical)] shadow-sm"
                          : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)]"
                      }`}
                    >
                      {num === 5 ? "5+" : num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2 text-[13px] text-[var(--color-text-main)]">
                  Necesidades especiales en el grupo
                </label>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                  <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-main)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formA.has_children}
                      onChange={(e) => setFormA({ ...formA, has_children: e.target.checked })}
                      className="accent-[var(--color-critical)] w-4 h-4 cursor-pointer"
                    />
                    <span>🧒 Hay niños</span>
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-main)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formA.has_elderly}
                      onChange={(e) => setFormA({ ...formA, has_elderly: e.target.checked })}
                      className="accent-[var(--color-critical)] w-4 h-4 cursor-pointer"
                    />
                    <span>👴 Adultos mayores</span>
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-main)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formA.has_medical}
                      onChange={(e) => setFormA({ ...formA, has_medical: e.target.checked })}
                      className="accent-[var(--color-critical)] w-4 h-4 cursor-pointer"
                    />
                    <span>🏥 Atención médica</span>
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-main)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formA.has_pets}
                      onChange={(e) => setFormA({ ...formA, has_pets: e.target.checked })}
                      className="accent-[var(--color-critical)] w-4 h-4 cursor-pointer"
                    />
                    <span>🐾 Mascotas</span>
                  </label>
                </div>
              </div>

              <Field label="Estado venezolano donde te encuentras">
                <Select
                  value={formA.current_state}
                  onChange={(e) => setFormA({ ...formA, current_state: e.target.value })}
                >
                  {ESTADOS_VENEZUELA.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>

              <button
                type="submit"
                disabled={registeringA}
                className="w-full h-11 rounded-md bg-[var(--color-critical)] text-white text-[14px] font-display font-semibold transition-opacity disabled:opacity-50 hover:opacity-95 cursor-pointer shadow-sm"
              >
                {registeringA ? "GUARDANDO SOLICITUD..." : "PEDIR ALBERGUE AHORA"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSearchB} className="space-y-6">
              <div className="border-b border-[var(--color-border)] pb-3">
                <h3 className="font-display font-semibold text-[18px] text-[#1a56db] dark:text-blue-400">
                  Buscar familiar o sobreviviente
                </h3>
                <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                  Ingresa los detalles para contrastar con las bases oficiales y los registros de la plataforma.
                </p>
              </div>

              <Field label="Nombre completo de quien buscas">
                <TextInput
                  type="text"
                  placeholder="Ej. María Rodríguez"
                  value={formB.nombre_buscado}
                  onChange={(e) => setFormB({ ...formB, nombre_buscado: e.target.value })}
                  required
                />
              </Field>

              <Field label="Tu número de WhatsApp (para avisarte si hay novedades)">
                <TextInput
                  type="tel"
                  placeholder="Ej. +58 414 7654321"
                  value={formB.phone}
                  onChange={(e) => setFormB({ ...formB, phone: e.target.value })}
                  required
                />
              </Field>

              <Field label="Último estado conocido (opcional)">
                <Select
                  value={formB.current_state}
                  onChange={(e) => setFormB({ ...formB, current_state: e.target.value })}
                >
                  <option value="">Cualquier estado / Desconocido</option>
                  {ESTADOS_VENEZUELA.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>

              <button
                type="submit"
                disabled={searchingB}
                className="w-full h-11 rounded-md bg-[#1a56db] text-white text-[14px] font-display font-semibold transition-opacity disabled:opacity-50 hover:bg-[#1a56db]/90 cursor-pointer shadow-sm"
              >
                {searchingB ? "BUSCANDO EN REGISTROS..." : "BUSCAR AHORA"}
              </button>

              {/* Resultados de búsqueda B */}
              {searched && (
                <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
                  <h4 className="font-display font-semibold text-[14px] text-[var(--color-text-main)]">
                    Resultados encontrados ({searchResults.length})
                  </h4>
                  {searchResults.length === 0 ? (
                    <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 text-[13px] text-orange-800 dark:text-orange-300">
                      No encontramos coincidencias directas. Tu búsqueda ha quedado registrada de forma activa en nuestro sistema y te avisaremos si aparece información.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {searchResults.map((r, idx) => (
                        <div
                          key={r.id || idx}
                          className="p-3 border-hair border-[var(--color-border)] bg-[var(--color-bg)] rounded-lg text-[13px] space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-[14px] text-[var(--color-text-main)]">
                              {r.full_name}
                            </span>
                            {r.source === "survivor" ? (
                              <span className="px-2 py-0.5 text-[11px] rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium">
                                Lista Oficial
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[11px] rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-medium">
                                Plataforma
                              </span>
                            )}
                          </div>
                          {r.source === "survivor" ? (
                            <div className="space-y-1">
                              <p className="text-[var(--color-text-main)] leading-relaxed">
                                📋 En lista oficial — <span className="font-medium">{r.location || "N/A"}</span>, {r.current_state}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[12px] text-[var(--color-text-muted)]">Estado físico:</span>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getEstadoFisicoBadge(r.status_info).classes}`}>
                                  {getEstadoFisicoBadge(r.status_info).label}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[var(--color-text-main)] leading-relaxed">
                              📍 Registrado en plataforma — <span className="font-medium">{r.location || "Sin ubicación exacta"}</span>, {r.current_state}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
        </section>
      )}

      {/* Marketplace Público */}
      <section className="space-y-6 pt-4">
        {/* Selector compartido */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
          <div>
            <h2 className="font-display font-semibold text-[22px] tracking-tight">
              Marketplace de Coordinación de Albergue
            </h2>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
              Conexión directa entre familias buscando resguardo y centros con disponibilidad activa.
            </p>
          </div>
          <div className="w-full sm:w-[240px]">
            <label className="block text-[12px] text-[var(--color-text-muted)] mb-1">
              Filtrar ambas columnas por Estado:
            </label>
            <Select
              value={selectedStateMarket}
              onChange={(e) => setSelectedStateMarket(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              {ESTADOS_VENEZUELA.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna Izquierda: Familias buscando albergue */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-[17px] flex items-center gap-2">
              <span>🏠 Familias buscando albergue</span>
              <span className="text-[13px] bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 rounded-full font-sans font-normal">
                {rescuedFamilies.length}
              </span>
            </h3>

            {loadingRescued ? (
              <p className="text-[13px] text-[var(--color-text-muted)]">Cargando solicitudes...</p>
            ) : rescuedFamilies.length === 0 ? (
              <div className="p-8 border border-dashed border-[var(--color-border)] rounded-lg text-center text-[13px] text-[var(--color-text-muted)] bg-[var(--color-surface)]">
                No hay solicitudes de albergue activas en este estado.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rescuedFamilies.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-text-muted)] rounded-lg shadow-sm hover:shadow transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-display font-semibold text-[14px] text-[var(--color-text-main)] truncate max-w-[15ch]" title={f.contact_name}>
                        {f.contact_name}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        {timeAgo(f.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-main)]">
                      <Users className="w-4 h-4 text-[var(--color-text-muted)]" />
                      <span className="font-medium">{f.people_count} {f.people_count === 1 ? 'persona' : 'personas'}</span>
                    </div>

                    {/* Emojis de necesidades */}
                    <div className="flex gap-1.5 flex-wrap">
                      {f.has_children && (
                        <span className="px-2 py-0.5 text-[11px] rounded bg-[var(--color-surface-alt)] border border-[var(--color-border)]" title="Hay niños">
                          🧒 Niños
                        </span>
                      )}
                      {f.has_elderly && (
                        <span className="px-2 py-0.5 text-[11px] rounded bg-[var(--color-surface-alt)] border border-[var(--color-border)]" title="Hay adultos mayores">
                          👴 Mayor
                        </span>
                      )}
                      {f.has_medical && (
                        <span className="px-2 py-0.5 text-[11px] rounded bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-100 dark:border-red-900" title="Atención médica">
                          🏥 Médico
                        </span>
                      )}
                      {f.has_pets && (
                        <span className="px-2 py-0.5 text-[11px] rounded bg-[var(--color-surface-alt)] border border-[var(--color-border)]" title="Tenemos mascotas">
                          🐾 Mascota
                        </span>
                      )}
                      {!f.has_children && !f.has_elderly && !f.has_medical && !f.has_pets && (
                        <span className="px-2 py-0.5 text-[11px] rounded bg-gray-50 text-gray-500 border border-gray-150">
                          Sin requisitos especiales
                        </span>
                      )}
                    </div>

                    <div className="text-[12px] font-medium text-[var(--color-operational)] border-t border-[var(--color-border)] pt-2 flex items-center justify-between">
                      <span>📍 Estado {f.current_state}</span>
                      <a href={`tel:${f.phone}`} className="hover:underline text-[11px] bg-[var(--color-surface-alt)] px-2 py-0.5 rounded">
                        Contactar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Centros con espacio disponible */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-[17px] flex items-center gap-2">
              <span>🏠 Centros con espacio disponible</span>
              <span className="text-[13px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-sans font-normal">
                {availableCenters.length}
              </span>
            </h3>

            {loadingCenters ? (
              <p className="text-[13px] text-[var(--color-text-muted)]">Cargando centros...</p>
            ) : availableCenters.length === 0 ? (
              <div className="p-8 border border-dashed border-[var(--color-border)] rounded-lg text-center text-[13px] text-[var(--color-text-muted)] bg-[var(--color-surface)]">
                No hay centros registrados con capacidad disponible en este estado.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableCenters.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-text-muted)] rounded-lg shadow-sm hover:shadow transition-all space-y-3"
                  >
                    <div>
                      <div className="text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                        {getCenterKindLabel(c.type)}
                      </div>
                      <span className="font-display font-semibold text-[14px] text-[var(--color-text-main)] block mt-0.5 truncate" title={c.name}>
                        {c.name}
                      </span>
                    </div>

                    <div className="text-[13px] text-[var(--color-text-main)]">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {c.capacity_available}
                      </span>{" "}
                      {c.capacity_available === 1 ? 'espacio disponible' : 'espacios disponibles'}
                    </div>

                    <div className="text-[12px] text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-2 flex items-center justify-between">
                      <span>📍 {c.city}, {c.state}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sección Buscador de Sobrevivientes */}
      <section className="space-y-6 pt-6 border-t border-[var(--color-border)]">
        <div>
          <h2 className="font-display font-semibold text-[22px] tracking-tight">
            Lista de sobrevivientes registrados
          </h2>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
            Información cargada desde reportes oficiales de centros médicos y albergues.
          </p>
        </div>

        {/* Buscadores de la sección de sobrevivientes */}
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

        {/* Tabla/Cards de sobrevivientes */}
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
                    <tr key={s.id} className="hover:bg-[var(--color-surface-alt)]/50 transition-colors">
                      <td className="p-3 font-semibold text-[var(--color-text-main)]">
                        {s.full_name}
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

            {/* Paginación */}
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
    </div>
  );
}
