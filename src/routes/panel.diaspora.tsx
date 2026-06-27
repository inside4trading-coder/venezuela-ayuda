import { createFileRoute, Link } from "@tanstack/react-router";
import { PanelLayout } from "@/components/panel/PanelLayout";
import { ProfileFields } from "@/components/panel/ProfileFields";
import { useProfile } from "@/hooks/useProfile";
import { useMyDonations } from "@/hooks/usePanelData";
import { DonationsTable } from "@/routes/panel.donador";

export const Route = createFileRoute("/panel/diaspora")({
  head: () => ({ meta: [{ title: "Panel diáspora · Venezuela Ayuda" }] }),
  component: DiasporaPanel,
});

function DiasporaPanel() {
  const { profile } = useProfile();
  const { items, loading } = useMyDonations(profile?.id ?? null);

  return (
    <PanelLayout
      expectedRoles={["diaspora"]}
      title="Tu panel de diáspora"
      subtitle="Aporta desde fuera y sigue el impacto de tu donación."
    >
      {profile && <ProfileFields profile={profile} />}

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-[18px]">Mis aportes desde el exterior</h2>
        {loading ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-6 text-center">
            <p className="text-[13px] text-[var(--color-text-muted)] mb-3">
              Pasarela de pago internacional próximamente. Mientras tanto, puedes coordinar
              con un familiar o ONG aliada para una entrega en tierra.
            </p>
            <Link
              to="/centros"
              className="inline-block h-10 px-4 rounded-md bg-[var(--color-critical)] text-white text-[13px] font-display font-semibold leading-[40px]"
            >
              Ver centros que necesitan ayuda
            </Link>
          </div>
        ) : (
          <DonationsTable items={items} />
        )}
      </section>
    </PanelLayout>
  );
}
