import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PanelLayout } from "@/components/panel/PanelLayout";
import { ProfileFields } from "@/components/panel/ProfileFields";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { AddressLink } from "@/components/centers/AddressLink";

export const Route = createFileRoute("/panel/autoridad")({
  head: () => ({ meta: [{ title: "Panel autoridad · Venezuela Ayuda" }] }),
  component: AuthorityPanel,
});

interface PendingCenter {
  id: string;
  name: string | null;
  type: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
  verified_at: string | null;
}

function AuthorityPanel() {
  const { profile, isVerified } = useProfile();
  const [pending, setPending] = useState<PendingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("centers")
      .select("id, name, type, city, state, address, phone, created_at, verified_at")
      .is("verified_at", null)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setPending((data as PendingCenter[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!isVerified) return;
    load();
  }, [isVerified]);

  const approve = async (id: string) => {
    setBusy(id);
    const { error } = await supabase
      .from("centers")
      .update({ verified_at: new Date().toISOString(), verified: true })
      .eq("id", id);
    setBusy(null);
    if (error) {
      toast.error("No se pudo verificar");
      return;
    }
    toast.success("Centro verificado");
    load();
  };

  return (
    <PanelLayout
      expectedRoles={["autoridad"]}
      title="Panel de autoridad"
      subtitle="Verificación de centros y reporte de operaciones."
    >
      {profile && <ProfileFields profile={profile} />}

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-[18px]">
          Centros pendientes de verificación ({pending.length})
        </h2>
        {loading ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
        ) : pending.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">No hay centros pendientes.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border-hair border-[var(--color-caution)] bg-[var(--color-surface)] p-4"
                style={{ borderLeftWidth: "3px" }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <Link
                      to="/centro/$id"
                      params={{ id: c.id }}
                      className="font-display font-semibold text-[15px] hover:underline"
                    >
                      {c.name ?? "Sin nombre"}
                    </Link>
                    <div className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
                      {c.type} · {c.city}, {c.state}
                    </div>
                    <AddressLink address={c.address} className="block text-[12px] mt-1 text-[var(--color-operational)] hover:underline" />
                  </div>
                  <button
                    type="button"
                    onClick={() => approve(c.id)}
                    disabled={busy === c.id}
                    className="h-9 px-4 rounded-md bg-[var(--color-resolved)] text-white text-[13px] font-display font-semibold disabled:opacity-50"
                  >
                    Verificar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PanelLayout>
  );
}
