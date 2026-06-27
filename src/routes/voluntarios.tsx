import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Field, Select } from "@/components/ui-vh/Field";
import { CheckGrid } from "@/components/ui-vh/CheckGrid";
import { ESTADOS_VENEZUELA } from "@/data/mock";
import { VOLUNTEER_ROLES } from "@/data/volunteer-roles";
import {
  useAvailableVolunteers,
  useDemandingCenters,
} from "@/hooks/useVolunteersMarket";
import { VolunteerCard } from "@/components/marketplace/VolunteerCard";
import { CenterDemandCard } from "@/components/marketplace/CenterDemandCard";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/voluntarios")({
  head: () => ({
    meta: [
      { title: "Voluntarios · Venezuela Ayuda" },
      {
        name: "description",
        content:
          "Marketplace de voluntariado: voluntarios disponibles y centros que los necesitan.",
      },
    ],
  }),
  component: VolunteersMarketplace,
});

function VolunteersMarketplace() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const [stateFilter, setStateFilter] = useState<string>("");

  const filters = useMemo(
    () => ({
      skills: skillsFilter.length > 0 ? skillsFilter : undefined,
      state: stateFilter || undefined,
    }),
    [skillsFilter, stateFilter],
  );

  const { items: volunteers, loading: loadingVols } = useAvailableVolunteers(filters);
  const { items: centers, loading: loadingCenters } = useDemandingCenters(filters);

  const viewerRole = profile?.role ?? null;
  const visitorSkills = profile?.skills ?? [];
  const isAnon = !user;
  const isCoordinator = viewerRole === "coordinador";
  const isVolunteer = viewerRole === "voluntario" || viewerRole === "voluntario_medico";

  // Coordinador: si tiene center_id asignado, puede invitar
  const inviteCenterId = isCoordinator ? profile?.center_id ?? null : null;

  // Para el voluntario logueado, ocultamos su propia card de la lista
  const volunteersToShow = volunteers.filter((v) => v.id !== user?.id);

  const toggleSkill = (s: string) =>
    setSkillsFilter((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    );

  // Subhead contextual
  const subhead = isAnon
    ? "Mira quién está disponible y qué centros necesitan ayuda. Entra con Google para participar."
    : isVolunteer
    ? "Encuentra centros que necesitan tu perfil o gestiona tus postulaciones."
    : isCoordinator
    ? "Encuentra voluntarios para tu centro o publica los roles que necesitas."
    : "Conoce la red de voluntarios y centros activos.";

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-10">
      <header className="space-y-2">
        <h1 className="font-display font-semibold text-[28px] leading-tight">
          Marketplace de voluntariado
        </h1>
        <p className="text-[14px] text-[var(--color-text-muted)] max-w-[60ch]">
          {subhead}
        </p>
        {isAnon && (
          <div
            className="mt-3 rounded-lg border-hair border-[var(--color-operational)] bg-[var(--color-surface)] p-3 text-[13px] flex items-center justify-between gap-3 flex-wrap"
            style={{ borderLeftWidth: "3px" }}
          >
            <span>
              Para postularte o publicar tu disponibilidad necesitas una cuenta.
            </span>
            <Link
              to="/onboarding"
              className="h-9 px-4 rounded-md bg-[var(--color-critical)] text-white text-[13px] font-display font-semibold leading-[36px]"
            >
              Entrar con Google
            </Link>
          </div>
        )}
      </header>

      {/* Filtros */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_240px] gap-4 items-end">
          <div>
            <div className="block mb-1.5 text-[13px]">Filtrar por rol</div>
            <CheckGrid
              options={VOLUNTEER_ROLES}
              selected={skillsFilter}
              onToggle={toggleSkill}
              cols={3}
            />
          </div>
          <Field label="Filtrar por estado">
            <Select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <option value="">Todos los estados</option>
              {ESTADOS_VENEZUELA.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {(skillsFilter.length > 0 || stateFilter) && (
          <button
            type="button"
            onClick={() => {
              setSkillsFilter([]);
              setStateFilter("");
            }}
            className="text-[12px] text-[var(--color-operational)] underline"
          >
            Limpiar filtros
          </button>
        )}
      </section>

      {/* Centros buscando voluntarios (demanda) */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="font-display font-semibold text-[20px]">
            Centros buscando voluntarios
            <span className="ml-2 text-[14px] text-[var(--color-text-muted)] font-normal">
              ({centers.length})
            </span>
          </h2>
          {isCoordinator && (
            <Link
              to="/panel/centro"
              className="text-[13px] text-[var(--color-operational)] hover:underline"
            >
              Publicar lo que mi centro necesita →
            </Link>
          )}
        </div>
        {loadingCenters ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
        ) : centers.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-6 text-center text-[13px] text-[var(--color-text-muted)]">
            Ningún centro está publicando demanda con estos filtros.
            {(skillsFilter.length > 0 || stateFilter) && " Ajusta o limpia los filtros."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {centers.map((c) => (
              <CenterDemandCard
                key={c.id}
                center={c}
                highlightSkills={visitorSkills}
                viewerRole={viewerRole}
                isAnon={isAnon}
              />
            ))}
          </div>
        )}
      </section>

      {/* Voluntarios disponibles (oferta) */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="font-display font-semibold text-[20px]">
            Voluntarios disponibles
            <span className="ml-2 text-[14px] text-[var(--color-text-muted)] font-normal">
              ({volunteersToShow.length}{user ? ` de ${volunteers.length}` : ""})
            </span>
          </h2>
          {isVolunteer && (
            <Link
              to="/panel/voluntario"
              className="text-[13px] text-[var(--color-operational)] hover:underline"
            >
              Mi perfil de voluntario →
            </Link>
          )}
        </div>
        {loadingVols ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
        ) : volunteersToShow.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-6 text-center text-[13px] text-[var(--color-text-muted)]">
            {volunteers.length > 0 && user
              ? "Solo tu propio perfil coincide con estos filtros."
              : "Aún no hay voluntarios registrados con estos filtros."}
            {(skillsFilter.length > 0 || stateFilter) && " Ajusta o limpia los filtros."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {volunteersToShow.map((v) => (
              <VolunteerCard
                key={v.id}
                volunteer={v}
                highlightSkills={visitorSkills}
                viewerRole={viewerRole}
                centerIdForInvite={inviteCenterId}
                isSelf={v.id === user?.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
