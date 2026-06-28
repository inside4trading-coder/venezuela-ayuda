import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Baby,
  Activity,
  PawPrint,
  Heart,
  Search,
  Home,
  Phone,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Users,
} from "lucide-react";
import { ESTADOS_VENEZUELA } from "@/data/mock";
import { useRescuedPersons, type RescuedPerson } from "@/hooks/useRescuedPersons";
import { useAvailableCenters, type AvailableCenter } from "@/hooks/useAvailableCenters";
import { useRegisterRescued } from "@/hooks/useRegisterRescued";

export const Route = createFileRoute("/rescatados")({
  head: () => ({
    meta: [
      { title: "Rescatados y Búsqueda · Venezuela Ayuda" },
      {
        name: "description",
        content:
          "Encuentra albergues para familias damnificadas y registra búsquedas de familiares tras la emergencia.",
      },
    ],
  }),
  component: RescatadosPage,
});

function RescatadosPage() {
  const [mode, setMode] = useState<"select" | "busca_albergue" | "busca_familiar">("select");
  const [stateFilter, setStateFilter] = useState<string>("");

  // Form states - Busca Albergue
  const [shelterName, setShelterName] = useState("");
  const [shelterPhone, setShelterPhone] = useState("");
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [hasChildren, setHasChildren] = useState(false);
  const [hasElderly, setHasElderly] = useState(false);
  const [hasMedical, setHasMedical] = useState(false);
  const [hasPets, setHasPets] = useState(false);
  const [shelterState, setShelterState] = useState("");
  const [shelterUbicacion, setShelterUbicacion] = useState("");

  // Form states - Busca Familiar
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchState, setSearchState] = useState("");

  // API Hooks
  const { items: rescuedList, refetch: refetchRescued } = useRescuedPersons({
    tipo: "busca_albergue",
    status: "activo",
    current_state: stateFilter || undefined,
  });

  const { items: centersList, loading: loadingCenters } = useAvailableCenters(
    stateFilter || undefined
  );

  const { register, loading: registering } = useRegisterRescued();

  // Contact modal state
  const [contactingCenter, setContactingCenter] = useState<AvailableCenter | null>(null);

  const handleRegisterShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelterName.trim()) {
      toast.error("El nombre de contacto es obligatorio.");
      return;
    }
    if (!shelterPhone.trim()) {
      toast.error("El número de WhatsApp es obligatorio.");
      return;
    }
    if (!shelterState) {
      toast.error("El estado de ubicación es obligatorio.");
      return;
    }

    const { error } = await register({
      tipo: "busca_albergue",
      contact_name: shelterName.trim(),
      phone: shelterPhone.trim(),
      current_state: shelterState,
      people_count: peopleCount,
      has_children: hasChildren,
      has_elderly: hasElderly,
      has_medical: hasMedical,
      has_pets: hasPets,
      ultima_ubicacion: shelterUbicacion.trim() || undefined,
    });

    if (error) {
      console.error(error);
      toast.error("Hubo un error al registrar la solicitud: " + error.message);
    } else {
      toast.success("Solicitud de albergue registrada con éxito.");
      // Reset form & view
      setShelterName("");
      setShelterPhone("");
      setPeopleCount(1);
      setHasChildren(false);
      setHasElderly(false);
      setHasMedical(false);
      setHasPets(false);
      setShelterState("");
      setShelterUbicacion("");
      setMode("select");
      refetchRescued();
    }
  };

  const handleRegisterSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) {
      toast.error("El nombre del familiar buscado es obligatorio.");
      return;
    }
    if (!searchPhone.trim()) {
      toast.error("Tu número de WhatsApp es obligatorio.");
      return;
    }
    if (!searchState) {
      toast.error("El último estado conocido es obligatorio.");
      return;
    }

    const { error } = await register({
      tipo: "busca_familiar",
      contact_name: "Buscador de familiar",
      phone: searchPhone.trim(),
      current_state: searchState,
      nombre_buscado: searchName.trim(),
    });

    if (error) {
      console.error(error);
      toast.error("Hubo un error al registrar la búsqueda: " + error.message);
    } else {
      toast.success("Búsqueda registrada. Te avisaremos si hay coincidencias.");
      setSearchName("");
      setSearchPhone("");
      setSearchState("");
      setMode("select");
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-12">
      {/* Header */}
      <header className="space-y-3 text-center max-w-[800px] mx-auto">
        <h1 className="font-display font-semibold text-[32px] sm:text-[38px] leading-tight tracking-tight">
          Gestión de Rescatados y Albergues
        </h1>
        <p className="text-[15px] text-[var(--color-text-muted)] leading-relaxed">
          Solicita cupos de albergue para familias damnificadas o registra búsquedas de familiares
          extraviados para cruzar información con centros de refugio.
        </p>
      </header>

      {/* Main Form Toggle / Forms */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 sm:p-8 max-w-[800px] mx-auto shadow-sm" style={{ borderWidth: "0.5px" }}>
        {mode === "select" && (
          <div className="space-y-6">
            <h2 className="text-center font-display font-semibold text-[18px] mb-4">
              ¿Qué tipo de solicitud necesitas registrar?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode("busca_albergue")}
                className="flex flex-col items-center justify-center p-8 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-critical)] bg-slate-50/50 dark:bg-slate-900/50 hover:bg-red-50/20 transition group text-center cursor-pointer"
                style={{ borderWidth: "0.5px" }}
              >
                <div className="p-4 rounded-full bg-red-100 dark:bg-red-950 text-[var(--color-critical)] mb-4 group-hover:scale-105 transition">
                  <Home className="h-7 w-7" />
                </div>
                <h3 className="font-display font-semibold text-[16px] mb-1">
                  Necesito un albergue
                </h3>
                <p className="text-[12px] text-[var(--color-text-muted)]">
                  Para registrar familias damnificadas que buscan refugio temporal.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode("busca_familiar")}
                className="flex flex-col items-center justify-center p-8 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-critical)] bg-slate-50/50 dark:bg-slate-900/50 hover:bg-red-50/20 transition group text-center cursor-pointer"
                style={{ borderWidth: "0.5px" }}
              >
                <div className="p-4 rounded-full bg-red-100 dark:bg-red-950 text-[var(--color-critical)] mb-4 group-hover:scale-105 transition">
                  <Search className="h-7 w-7" />
                </div>
                <h3 className="font-display font-semibold text-[16px] mb-1">
                  Busco a un familiar
                </h3>
                <p className="text-[12px] text-[var(--color-text-muted)]">
                  Para reportar personas extraviadas y recibir notificaciones.
                </p>
              </button>
            </div>
          </div>
        )}

        {mode === "busca_albergue" && (
          <form onSubmit={handleRegisterShelter} className="space-y-6">
            <div className="flex items-center justify-between border-b pb-3 mb-2" style={{ borderBottomWidth: "0.5px" }}>
              <button
                type="button"
                onClick={() => setMode("select")}
                className="flex items-center gap-1 text-[13px] text-[var(--color-text-muted)] hover:underline cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Volver
              </button>
              <h2 className="font-display font-semibold text-[18px]">Solicitar Albergue</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium">Nombre de contacto</label>
                <input
                  type="text"
                  required
                  value={shelterName}
                  onChange={(e) => setShelterName(e.target.value)}
                  placeholder="Ej: Eduardo Graterol"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-[14px] shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium">WhatsApp de contacto</label>
                <input
                  type="text"
                  required
                  value={shelterPhone}
                  onChange={(e) => setShelterPhone(e.target.value)}
                  placeholder="Ej: +584121234567"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-[14px] shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-medium">¿Cuántas personas integran el grupo?</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPeopleCount(num)}
                    className={`h-9 px-4 rounded-md text-[14px] font-medium transition cursor-pointer border ${
                      peopleCount === num
                        ? "bg-[var(--color-critical)] text-white border-[var(--color-critical)]"
                        : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]"
                    }`}
                  >
                    {num === 5 ? "5+" : num}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-medium">Situación especial (Selecciona los que apliquen)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-[14px] p-2 border rounded-md border-[var(--color-border)] bg-transparent hover:bg-slate-50/50 cursor-pointer" style={{ borderWidth: "0.5px" }}>
                  <input
                    type="checkbox"
                    checked={hasChildren}
                    onChange={(e) => setHasChildren(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--color-critical)] focus:ring-[var(--color-critical)]"
                  />
                  <Baby className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>Hay niños / bebés</span>
                </label>
                <label className="flex items-center gap-2 text-[14px] p-2 border rounded-md border-[var(--color-border)] bg-transparent hover:bg-slate-50/50 cursor-pointer" style={{ borderWidth: "0.5px" }}>
                  <input
                    type="checkbox"
                    checked={hasElderly}
                    onChange={(e) => setHasElderly(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--color-critical)] focus:ring-[var(--color-critical)]"
                  />
                  <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>Hay adultos mayores</span>
                </label>
                <label className="flex items-center gap-2 text-[14px] p-2 border rounded-md border-[var(--color-border)] bg-transparent hover:bg-slate-50/50 cursor-pointer" style={{ borderWidth: "0.5px" }}>
                  <input
                    type="checkbox"
                    checked={hasMedical}
                    onChange={(e) => setHasMedical(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--color-critical)] focus:ring-[var(--color-critical)]"
                  />
                  <Activity className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>Necesitamos atención médica</span>
                </label>
                <label className="flex items-center gap-2 text-[14px] p-2 border rounded-md border-[var(--color-border)] bg-transparent hover:bg-slate-50/50 cursor-pointer" style={{ borderWidth: "0.5px" }}>
                  <input
                    type="checkbox"
                    checked={hasPets}
                    onChange={(e) => setHasPets(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--color-critical)] focus:ring-[var(--color-critical)]"
                  />
                  <PawPrint className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>Tenemos mascotas</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium">Estado de ubicación actual</label>
                <select
                  required
                  value={shelterState}
                  onChange={(e) => setShelterState(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-[14px] shadow-sm"
                >
                  <option value="">Selecciona un estado</option>
                  {ESTADOS_VENEZUELA.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium">Ubicación exacta / Puntos de referencia</label>
                <input
                  type="text"
                  value={shelterUbicacion}
                  onChange={(e) => setShelterUbicacion(e.target.value)}
                  placeholder="Ej: Cerca de la plaza Bolívar, sector X"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-[14px] shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full h-11 rounded-md bg-[var(--color-critical)] hover:opacity-90 text-white font-display font-semibold text-[15px] shadow-sm disabled:opacity-50 tracking-wider cursor-pointer"
            >
              {registering ? "REGISTRANDO..." : "PEDIR ALBERGUE AHORA"}
            </button>
          </form>
        )}

        {mode === "busca_familiar" && (
          <form onSubmit={handleRegisterSearch} className="space-y-6">
            <div className="flex items-center justify-between border-b pb-3 mb-2" style={{ borderBottomWidth: "0.5px" }}>
              <button
                type="button"
                onClick={() => setMode("select")}
                className="flex items-center gap-1 text-[13px] text-[var(--color-text-muted)] hover:underline cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Volver
              </button>
              <h2 className="font-display font-semibold text-[18px]">Buscar Familiar</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium">Nombre de la persona que buscas</label>
                <input
                  type="text"
                  required
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Ej: José Hurtado"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-[14px] shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium">Tu número de WhatsApp (para notificarte)</label>
                <input
                  type="text"
                  required
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Ej: +584121234567"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-[14px] shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium">Último estado conocido de tu familiar</label>
                <select
                  required
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-[14px] shadow-sm"
                >
                  <option value="">Selecciona un estado</option>
                  {ESTADOS_VENEZUELA.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-red-50/30 rounded border border-red-100 flex items-start gap-2" style={{ borderWidth: "0.5px" }}>
              <CheckCircle2 className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-700 leading-snug">
                Si la persona se registra en la plataforma o es ingresada por algún albergue, te
                enviaremos una alerta de WhatsApp inmediatamente.
              </p>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full h-11 rounded-md bg-[var(--color-critical)] hover:opacity-90 text-white font-display font-semibold text-[15px] shadow-sm disabled:opacity-50 tracking-wider cursor-pointer"
            >
              {registering ? "REGISTRANDO..." : "BUSCAR AHORA"}
            </button>
          </form>
        )}
      </div>

      {/* Marketplace Sections */}
      <div className="border-t pt-10" style={{ borderTopWidth: "0.5px" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display font-semibold text-[22px] leading-tight">
              Familias Damnificadas y Albergues Disponibles
            </h2>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
              Estado de solicitudes de refugio cruzado con centros con cupo activo.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[13px] text-[var(--color-text-muted)] font-medium">Filtrar por Estado:</span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-8 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[12px] shadow-sm"
            >
              <option value="">Todos los estados</option>
              {ESTADOS_VENEZUELA.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Families Looking for Shelter */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-[16px] flex items-center gap-2 pb-2 border-b" style={{ borderBottomWidth: "0.5px" }}>
              <span>Solicitudes de albergue activas</span>
              <span className="text-[12px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-sans font-semibold">
                {rescuedList.length}
              </span>
            </h3>

            {rescuedList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center text-[13px] text-[var(--color-text-muted)]">
                No hay solicitudes de albergue activas en este estado.
              </div>
            ) : (
              <div className="space-y-3">
                {rescuedList.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-3"
                    style={{ borderWidth: "0.5px" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-display font-semibold text-[15px] text-[var(--color-text-main)]">
                          {p.contact_name}
                        </h4>
                        <p className="text-[12px] text-[var(--color-text-muted)]">
                          📍 {p.current_state} {p.ultima_ubicacion && ` · ${p.ultima_ubicacion}`}
                        </p>
                      </div>
                      <span className="text-[13px] font-semibold text-[var(--color-critical)] bg-red-50 dark:bg-red-950 px-2.5 py-1 rounded">
                        {p.people_count} {p.people_count === 1 ? "persona" : "personas"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1 border-t" style={{ borderTopWidth: "0.5px" }}>
                      {p.has_children && (
                        <span className="flex items-center gap-1 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full" style={{ borderWidth: "0.5px" }}>
                          <Baby className="h-3 w-3 text-slate-500" /> Niños
                        </span>
                      )}
                      {p.has_elderly && (
                        <span className="flex items-center gap-1 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full" style={{ borderWidth: "0.5px" }}>
                          <Users className="h-3 w-3 text-slate-500" /> Adultos mayores
                        </span>
                      )}
                      {p.has_medical && (
                        <span className="flex items-center gap-1 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full" style={{ borderWidth: "0.5px" }}>
                          <Activity className="h-3 w-3 text-[var(--color-critical)]" /> Médica requerida
                        </span>
                      )}
                      {p.has_pets && (
                        <span className="flex items-center gap-1 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full" style={{ borderWidth: "0.5px" }}>
                          <PawPrint className="h-3 w-3 text-slate-500" /> Mascotas
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Shelter Centers with Capacity */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-[16px] flex items-center gap-2 pb-2 border-b" style={{ borderBottomWidth: "0.5px" }}>
              <span>Albergues con capacidad</span>
              <span className="text-[12px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-sans font-semibold">
                {centersList.length}
              </span>
            </h3>

            {loadingCenters ? (
              <p className="text-[13px] text-[var(--color-text-muted)]">Cargando centros…</p>
            ) : centersList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center text-[13px] text-[var(--color-text-muted)]">
                No hay centros registrados con cupos activos en este estado.
              </div>
            ) : (
              <div className="space-y-3">
                {centersList.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-3"
                    style={{ borderWidth: "0.5px" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-display font-semibold text-[15px] text-[var(--color-text-main)]">
                          {c.name}
                        </h4>
                        <p className="text-[12px] text-[var(--color-text-muted)]">
                          📍 {c.city}, {c.state}
                        </p>
                      </div>
                      <span className="text-[12px] font-semibold text-green-600 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded border border-green-200" style={{ borderWidth: "0.5px" }}>
                        {c.capacity_available} cupos libres
                      </span>
                    </div>

                    <div className="pt-2 border-t flex justify-end" style={{ borderTopWidth: "0.5px" }}>
                      <button
                        type="button"
                        onClick={() => setContactingCenter(c)}
                        className="h-8 px-3 rounded bg-[var(--color-operational)] hover:opacity-90 text-white text-[12px] font-display font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="h-3.5 w-3.5" /> Contactar coordinador
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coordinator Contact Modal */}
      {contactingCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl max-w-[450px] w-full p-6 space-y-4 shadow-lg text-center" style={{ borderWidth: "0.5px" }}>
            <div className="p-3 bg-green-50 dark:bg-green-950 text-green-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
              <Phone className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-[18px]">Contactar Coordinador</h3>
              <p className="text-[13px] text-[var(--color-text-muted)]">
                Comunícate directamente para coordinar el traslado al centro.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded border border-[var(--color-border)] text-left space-y-2" style={{ borderWidth: "0.5px" }}>
              <div>
                <span className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">Centro</span>
                <span className="font-semibold text-[14px]">{contactingCenter.name}</span>
              </div>
              <div>
                <span className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">Teléfono de contacto</span>
                <a
                  href={`tel:${contactingCenter.phone}`}
                  className="font-mono font-bold text-[16px] text-[var(--color-critical)] hover:underline"
                >
                  {contactingCenter.phone || "No especificado"}
                </a>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContactingCenter(null)}
                className="flex-1 h-9 rounded border border-[var(--color-border)] text-[13px] font-semibold hover:bg-[var(--color-surface-alt)] cursor-pointer"
              >
                Cerrar
              </button>
              {contactingCenter.phone && (
                <a
                  href={`https://wa.me/${contactingCenter.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-9 rounded bg-green-600 hover:bg-green-700 text-white text-[13px] font-semibold flex items-center justify-center gap-1"
                >
                  Escribir WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
