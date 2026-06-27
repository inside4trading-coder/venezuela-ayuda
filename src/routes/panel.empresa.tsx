import { createFileRoute, Link } from "@tanstack/react-router";
import { PanelLayout } from "@/components/panel/PanelLayout";
import { ProfileFields } from "@/components/panel/ProfileFields";
import { useProfile } from "@/hooks/useProfile";
import { useMyDonations } from "@/hooks/usePanelData";
import { DonationsTable } from "@/routes/panel.donador";

export const Route = createFileRoute("/panel/empresa")({
  head: () => ({ meta: [{ title: "Panel empresa · Venezuela Ayuda" }] }),
  component: CompanyPanel,
});

function CompanyPanel() {
  const { profile } = useProfile();
  const { items, loading } = useMyDonations(profile?.id ?? null);

  return (
    <PanelLayout
      expectedRoles={["empresa"]}
      title="Tu panel de empresa"
      subtitle="Coordina donaciones en volumen. Constancia PDF disponible en próxima entrega."
    >
      {profile && <ProfileFields profile={profile} />}

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-[18px]">Donaciones de la empresa</h2>
        {loading ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-6 text-center">
            <p className="text-[13px] text-[var(--color-text-muted)] mb-3">
              Aún no han registrado donaciones a nombre de la empresa.
            </p>
            <Link
              to="/centros"
              className="inline-block h-10 px-4 rounded-md bg-[var(--color-critical)] text-white text-[13px] font-display font-semibold leading-[40px]"
            >
              Ver centros que necesitan ayuda
            </Link>
          </div>
        ) : (
          <>
            <DonationsTable items={items} />
            <p className="text-[12px] text-[var(--color-text-muted)] mt-2">
              La constancia PDF para deducción fiscal estará disponible al verificar y publicar
              el flujo de pagos. Por ahora puedes solicitarla por correo a tu coordinador.
            </p>
          </>
        )}
      </section>
    </PanelLayout>
  );
}
