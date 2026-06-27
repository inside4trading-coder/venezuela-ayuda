import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PanelLayout } from "@/components/panel/PanelLayout";
import { ProfileFields } from "@/components/panel/ProfileFields";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/panel/data-entry")({
  head: () => ({ meta: [{ title: "Panel de carga · Venezuela Ayuda" }] }),
  component: DataEntryPanel,
});

interface CenterRow {
  id: string;
  name: string | null;
  type: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  verified_at: string | null;
}

function DataEntryPanel() {
  const { profile, isVerified } = useProfile();
  const [centers, setCenters] = useState<CenterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id || !isVerified) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("centers")
        .select("id, name, type, city, state, created_at, verified_at")
        .eq("created_by", profile.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) console.error(error);
      setCenters((data as CenterRow[]) ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [profile?.id, isVerified]);

  const pendingCount = centers.filter((c) => !c.verified_at).length;
  const verifiedCount = centers.length - pendingCount;

  return (
    <PanelLayout
      expectedRoles={["data_entry"]}
      title="Carga de datos"
      subtitle="Registra centros en lote. No se te asignan como coordinador; un admin los vincula a coordinadores reales después."
    >
      {profile && <ProfileFields profile={profile} />}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display font-semibold text-[18px]">Centros que has cargado</h2>
          <Link
            to="/registrar-centro"
            className="h-10 px-4 rounded-md bg-[var(--color-critical)] text-white text-[13px] font-display font-semibold leading-[40px]"
          >
            + Registrar nuevo centro
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Total cargados" value={centers.length} />
          <Stat label="Pendientes de verificación" value={pendingCount} />
          <Stat label="Verificados" value={verifiedCount} />
        </div>

        {loading ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
        ) : centers.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-6 text-center text-[13px] text-[var(--color-text-muted)]">
            Aún no has cargado centros. Empieza con el botón de arriba.
          </div>
        ) : (
          <div className="rounded-lg border-hair border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
                  <th className="px-3 py-2 font-normal">Centro</th>
                  <th className="px-3 py-2 font-normal">Tipo</th>
                  <th className="px-3 py-2 font-normal">Ubicación</th>
                  <th className="px-3 py-2 font-normal w-[160px]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {centers.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-[var(--color-surface-alt)]" : ""}>
                    <td className="px-3 py-2">
                      <Link to="/centro/$id" params={{ id: c.id }} className="hover:underline">
                        {c.name ?? "(sin nombre)"}
                      </Link>
                      <div className="text-[11px] font-mono text-[var(--color-text-muted)] mt-0.5">
                        {new Date(c.created_at).toLocaleDateString("es-VE")}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[13px]">{c.type ?? "—"}</td>
                    <td className="px-3 py-2 text-[13px] text-[var(--color-text-muted)]">
                      {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {c.verified_at ? (
                        <span className="text-[11px] uppercase tracking-label px-2 py-0.5 rounded-sm border-hair border-[var(--color-resolved)] text-[var(--color-resolved)]">
                          Verificado
                        </span>
                      ) : (
                        <span className="text-[11px] uppercase tracking-label px-2 py-0.5 rounded-sm border-hair border-[var(--color-caution)] text-[var(--color-caution)]">
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PanelLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border-hair border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="font-display font-semibold text-[24px] leading-none">{value}</div>
      <div className="mt-2 text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
        {label}
      </div>
    </div>
  );
}
