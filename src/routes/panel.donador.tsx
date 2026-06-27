import { createFileRoute, Link } from "@tanstack/react-router";
import { PanelLayout } from "@/components/panel/PanelLayout";
import { ProfileFields } from "@/components/panel/ProfileFields";
import { useProfile } from "@/hooks/useProfile";
import { useMyDonations } from "@/hooks/usePanelData";

export const Route = createFileRoute("/panel/donador")({
  head: () => ({ meta: [{ title: "Panel donador · Venezuela Ayuda" }] }),
  component: DonorPanel,
});

function DonorPanel() {
  const { profile } = useProfile();
  const { items, loading } = useMyDonations(profile?.id ?? null);

  return (
    <PanelLayout
      expectedRoles={["donador"]}
      title="Tu panel de donador"
      subtitle="Anuncia entregas y lleva registro de lo que has aportado."
    >
      {profile && <ProfileFields profile={profile} />}

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-[18px]">Mis donaciones</h2>
        {loading ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-6 text-center">
            <p className="text-[13px] text-[var(--color-text-muted)]">Aún no has anunciado donaciones.</p>
            <Link
              to="/centros"
              className="inline-block mt-4 h-10 px-4 rounded-md bg-[var(--color-critical)] text-white text-[13px] font-display font-semibold leading-[40px]"
            >
              Encontrar un centro
            </Link>
          </div>
        ) : (
          <DonationsTable items={items} />
        )}
      </section>
    </PanelLayout>
  );
}

export function DonationsTable({ items }: { items: any[] }) {
  return (
    <div className="rounded-lg border-hair border-[var(--color-border)] overflow-hidden">
      <table className="w-full text-[14px]">
        <thead className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
          <tr className="text-left">
            <th className="px-3 py-2 font-normal">Fecha</th>
            <th className="px-3 py-2 font-normal">Descripción</th>
            <th className="px-3 py-2 font-normal w-[120px]">Tipo</th>
            <th className="px-3 py-2 font-normal w-[140px]">Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d, i) => (
            <tr key={d.id} className={i % 2 === 0 ? "bg-[var(--color-surface-alt)]" : ""}>
              <td className="px-3 py-2 font-mono text-[12px]">
                {new Date(d.created_at).toLocaleDateString("es-VE")}
              </td>
              <td className="px-3 py-2">
                {d.description ?? <span className="text-[var(--color-text-muted)]">—</span>}
                {d.amount && (
                  <span className="text-[12px] text-[var(--color-text-muted)] ml-2">
                    {d.amount} {d.currency ?? ""}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-[12px] uppercase tracking-label">{d.type}</td>
              <td className="px-3 py-2">
                <StatusPill status={d.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === "delivered" ? "var(--color-resolved)" :
    status === "in_transit" ? "var(--color-operational)" :
    status === "cancelled" ? "var(--color-text-muted)" :
    "var(--color-caution)";
  return (
    <span
      className="inline-block text-[11px] uppercase tracking-label px-2 py-0.5 rounded-sm border-hair"
      style={{ color, borderColor: color }}
    >
      {status}
    </span>
  );
}
