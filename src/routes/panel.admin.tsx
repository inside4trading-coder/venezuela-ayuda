import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { AuthButton } from "@/components/auth/AuthButton";

export const Route = createFileRoute("/panel/admin")({
  head: () => ({
    meta: [{ title: "Panel admin · Venezuela Ayuda" }],
  }),
  component: AdminPanel,
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
  created_by: string | null;
  verified_at: string | null;
}

function AdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: profLoading } = useProfile();
  const [pending, setPending] = useState<PendingCenter[]>([]);
  const [verified, setVerified] = useState<PendingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: p, error: pe }, { data: v, error: ve }] = await Promise.all([
      supabase
        .from("centers")
        .select("id, name, type, city, state, address, phone, created_at, created_by, verified_at")
        .is("verified_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("centers")
        .select("id, name, type, city, state, address, phone, created_at, created_by, verified_at")
        .not("verified_at", "is", null)
        .order("verified_at", { ascending: false })
        .limit(20),
    ]);
    if (pe) console.error(pe);
    if (ve) console.error(ve);
    setPending((p as PendingCenter[]) ?? []);
    setVerified((v as PendingCenter[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin]);

  if (authLoading || profLoading) return <Gate>Cargando…</Gate>;

  if (!user) {
    return (
      <Gate>
        <h1 className="font-display text-[22px] mb-2">Inicia sesión</h1>
        <div className="flex justify-center mt-4"><AuthButton /></div>
      </Gate>
    );
  }

  if (!isAdmin) {
    return (
      <Gate>
        <h1 className="font-display text-[22px] mb-2">Acceso restringido</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
          Solo administradores de plataforma pueden ver este panel.
        </p>
        <Link to="/" className="text-[13px] text-[var(--color-operational)] underline">
          Volver al directorio
        </Link>
      </Gate>
    );
  }

  const approve = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase
      .from("centers")
      .update({ verified_at: new Date().toISOString(), verified: true })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      console.error(error);
      toast.error("No se pudo aprobar");
      return;
    }
    toast.success("Centro aprobado y publicado");
    load();
  };

  const reject = async (id: string) => {
    if (!confirm("¿Eliminar este centro? Esta acción no se puede deshacer.")) return;
    setBusyId(id);
    const { error } = await supabase.from("centers").delete().eq("id", id);
    setBusyId(null);
    if (error) {
      console.error(error);
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Centro rechazado");
    load();
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 space-y-10">
      <header>
        <h1 className="font-display font-semibold text-[28px] leading-tight">Panel de admin</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
          Verifica centros nuevos antes de que se publiquen en el directorio.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-display font-semibold text-[18px]">
          Pendientes ({pending.length})
        </h2>

        {loading ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
        ) : pending.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-8 text-center text-[13px] text-[var(--color-text-muted)]">
            Sin centros pendientes — todo al día.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((c) => (
              <article
                key={c.id}
                className="rounded-lg border-hair border-[var(--color-caution)] bg-[var(--color-surface)] p-5"
                style={{ borderLeftWidth: "3px" }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-[16px]">
                      {c.name ?? "Sin nombre"}
                    </div>
                    <div className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                      {c.type} · {c.city}, {c.state}
                    </div>
                    <div className="mt-2 text-[13px]">{c.address}</div>
                    {c.phone && (
                      <div className="text-[13px] font-mono">{c.phone}</div>
                    )}
                    <div className="mt-2 text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
                      Registrado {new Date(c.created_at).toLocaleString("es-VE")}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => approve(c.id)}
                      disabled={busyId === c.id}
                      className="h-9 px-4 rounded-md bg-[var(--color-resolved)] text-white text-[13px] font-display font-semibold disabled:opacity-50"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(c.id)}
                      disabled={busyId === c.id}
                      className="h-9 px-4 rounded-md border-hair border-[var(--color-critical)] text-[var(--color-critical)] text-[13px] disabled:opacity-50"
                      style={{ borderWidth: "0.5px" }}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display font-semibold text-[18px]">
          Verificados recientemente
        </h2>
        {verified.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Sin verificados aún.</p>
        ) : (
          <div className="rounded-lg border-hair border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
                  <th className="px-3 py-2 font-normal">Centro</th>
                  <th className="px-3 py-2 font-normal">Ubicación</th>
                  <th className="px-3 py-2 font-normal">Verificado</th>
                </tr>
              </thead>
              <tbody>
                {verified.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-[var(--color-surface-alt)]" : ""}>
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2 text-[var(--color-text-muted)]">
                      {c.city}, {c.state}
                    </td>
                    <td className="px-3 py-2 text-[12px] font-mono text-[var(--color-text-muted)]">
                      {c.verified_at && new Date(c.verified_at).toLocaleString("es-VE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[520px] mx-auto px-4 py-16 text-center">{children}</div>;
}
