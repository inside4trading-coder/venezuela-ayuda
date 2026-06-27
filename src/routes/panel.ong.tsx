import { createFileRoute } from "@tanstack/react-router";
import { PanelLayout } from "@/components/panel/PanelLayout";
import { ProfileFields } from "@/components/panel/ProfileFields";
import { useProfile } from "@/hooks/useProfile";
import { useAggregateStats } from "@/hooks/usePanelData";

export const Route = createFileRoute("/panel/ong")({
  head: () => ({ meta: [{ title: "Panel ONG · Venezuela Ayuda" }] }),
  component: NgoPanel,
});

function NgoPanel() {
  const { profile } = useProfile();
  const { stats, loading } = useAggregateStats();

  return (
    <PanelLayout
      expectedRoles={["observador"]}
      title="Panel ONG / Observador"
      subtitle="Métricas agregadas para coordinar tu organización."
    >
      {profile && <ProfileFields profile={profile} />}

      <section className="space-y-4">
        <h2 className="font-display font-semibold text-[18px]">Estado de la red</h2>
        {loading || !stats ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando métricas…</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Centros activos"     value={stats.centers_verified} />
            <Stat label="Centros pendientes"  value={stats.centers_pending} />
            <Stat label="Donaciones totales"  value={stats.donations_total} />
            <Stat label="Donaciones entregadas" value={stats.donations_delivered} />
            <Stat label="Rutas registradas"   value={stats.routes_total} />
            <Stat label="En tránsito"         value={stats.routes_in_transit} />
            <Stat label="Voluntarios"         value={stats.volunteers_total} />
            <Stat label="Total centros"       value={stats.centers_total} />
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-display font-semibold text-[18px]">Export de datos</h2>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
          Export CSV/JSON de centros y donaciones en próxima entrega. Si lo necesitas urgente,
          contacta a un administrador.
        </p>
      </section>
    </PanelLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border-hair border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="font-display font-semibold text-[28px] leading-none">{value}</div>
      <div className="mt-2 text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
        {label}
      </div>
    </div>
  );
}
