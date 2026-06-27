import { createFileRoute, Link } from "@tanstack/react-router";
import { PanelLayout } from "@/components/panel/PanelLayout";
import { ProfileFields } from "@/components/panel/ProfileFields";
import { useProfile } from "@/hooks/useProfile";
import { useCenters } from "@/hooks/useCenters";

export const Route = createFileRoute("/panel/voluntario")({
  head: () => ({ meta: [{ title: "Panel voluntario · Venezuela Ayuda" }] }),
  component: VolunteerPanel,
});

function VolunteerPanel() {
  const { profile } = useProfile();
  const { centers } = useCenters({});

  // Match heurístico: centros del mismo estado del voluntario, priorizando
  // puntos médicos si es voluntario_medico.
  const matched = profile
    ? centers
        .filter((c) => {
          if (profile.state && c.estadoVe && c.estadoVe === profile.state) return true;
          if ((profile.zones ?? []).some((z) => c.ciudad?.toLowerCase().includes(z.toLowerCase()))) return true;
          return false;
        })
        .sort((a, b) => {
          if (profile.role === "voluntario_medico") {
            const am = a.kind === "medico" ? 0 : 1;
            const bm = b.kind === "medico" ? 0 : 1;
            if (am !== bm) return am - bm;
          }
          return 0;
        })
        .slice(0, 8)
    : [];

  return (
    <PanelLayout
      expectedRoles={["voluntario", "voluntario_medico"]}
      title={
        profile?.role === "voluntario_medico"
          ? "Tu panel de voluntario médico"
          : "Tu panel de voluntario"
      }
      subtitle="Centros que coinciden con tus zonas y habilidades."
    >
      {profile && <ProfileFields profile={profile} />}

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-[18px]">
          Centros sugeridos para ti
        </h2>
        {matched.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-6 text-center">
            <p className="text-[13px] text-[var(--color-text-muted)]">
              Completa tu estado o zonas en el perfil para ver sugerencias relevantes.
            </p>
            <Link
              to="/centros"
              className="inline-block mt-3 text-[13px] text-[var(--color-operational)] underline"
            >
              Ver todos los centros
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {matched.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg border-hair border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <div className="min-w-0">
                  <Link
                    to="/centro/$id"
                    params={{ id: c.id }}
                    className="font-display font-semibold text-[15px] hover:underline"
                  >
                    {c.nombre}
                  </Link>
                  <div className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
                    {c.kind} · {c.ciudad}, {c.estadoVe}
                  </div>
                </div>
                <Link
                  to="/centro/$id"
                  params={{ id: c.id }}
                  className="text-[13px] px-3 py-1.5 rounded-md border-hair border-[var(--color-text-main)]"
                  style={{ borderWidth: "0.5px" }}
                >
                  Anunciar disponibilidad
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PanelLayout>
  );
}
