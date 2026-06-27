import { Link } from "@tanstack/react-router";
import type { DemandingCenter } from "@/hooks/useVolunteersMarket";

interface Props {
  center: DemandingCenter;
  /** Skills del visitante para destacar matches */
  highlightSkills?: string[];
  /** Rol del visitante */
  viewerRole?: string | null;
  /** True si el visitante no está logueado */
  isAnon?: boolean;
}

export function CenterDemandCard({
  center,
  highlightSkills = [],
  viewerRole,
  isAnon,
}: Props) {
  const ubic = [center.ciudad, center.estadoVe].filter(Boolean).join(", ") || "Ubicación no indicada";
  const matchedCount = center.needed_roles.filter((r) => highlightSkills.includes(r)).length;

  const canApply = viewerRole === "voluntario" || viewerRole === "voluntario_medico";

  return (
    <article
      className="rounded-lg border-hair border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3"
      style={{
        borderLeft: matchedCount > 0 ? "3px solid var(--color-resolved)" : undefined,
      }}
    >
      <div className="min-w-0">
        <Link
          to="/centro/$id"
          params={{ id: center.id }}
          className="font-display font-semibold text-[15px] hover:underline"
        >
          {center.nombre}
        </Link>
        <div className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
          {center.kind} · {ubic}
        </div>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)] mb-1.5">
          Voluntarios que busca
          {matchedCount > 0 && (
            <span className="ml-1 text-[var(--color-resolved)]">
              · {matchedCount} match{matchedCount === 1 ? "" : "es"} con tu perfil
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {center.needed_roles.map((r) => {
            const matched = highlightSkills.includes(r);
            return (
              <span
                key={r}
                className="text-[11px] uppercase tracking-label px-1.5 py-0.5 rounded-sm border-hair"
                style={{
                  color: matched ? "var(--color-resolved)" : "var(--color-operational)",
                  borderColor: matched
                    ? "var(--color-resolved)"
                    : "var(--color-operational)",
                }}
              >
                {r}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {canApply ? (
          <Link
            to="/panel/voluntario"
            className="h-9 px-3 rounded-md bg-[var(--color-critical)] text-white text-[13px] font-display font-semibold leading-[36px]"
          >
            Postularme
          </Link>
        ) : isAnon ? (
          <Link
            to="/onboarding"
            className="h-9 px-3 rounded-md bg-[var(--color-critical)] text-white text-[13px] font-display font-semibold leading-[36px]"
          >
            Entrar para postularme
          </Link>
        ) : null}
        <Link
          to="/centro/$id"
          params={{ id: center.id }}
          className="h-9 px-3 rounded-md border-hair border-[var(--color-text-main)] text-[13px] leading-[36px]"
          style={{ borderWidth: "0.5px" }}
        >
          Ver centro
        </Link>
      </div>
    </article>
  );
}
