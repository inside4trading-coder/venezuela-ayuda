import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, ROLE_LABEL, type ProfileRole } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { AuthButton } from "@/components/auth/AuthButton";
import { AddressLink } from "@/components/centers/AddressLink";
import { CoordinatorPicker } from "@/components/admin/CoordinatorPicker";
import { DocumentoIdentidad } from "@/components/ui/DocumentoIdentidad";

export const Route = createFileRoute("/panel/admin")({
  head: () => ({ meta: [{ title: "Panel admin · Venezuela Ayuda" }] }),
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

interface PendingProfile {
  id: string;
  role: ProfileRole;
  full_name: string | null;
  organization: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  created_at: string;
  documento_tipo?: "cedula" | "pasaporte";
  documento_numero?: string | null;
}

interface OrphanCenter {
  id: string;
  name: string | null;
  type: string | null;
  city: string | null;
  state: string | null;
}

interface CandidateProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: ProfileRole;
  center_id: string | null;
}

function AdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: profLoading } = useProfile();
  const [pendingCenters, setPendingCenters] = useState<PendingCenter[]>([]);
  const [verifiedCenters, setVerifiedCenters] = useState<PendingCenter[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([]);
  const [orphanCenters, setOrphanCenters] = useState<OrphanCenter[]>([]);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [assignSelection, setAssignSelection] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: assignedRows } = await supabase
      .from("profiles")
      .select("center_id")
      .eq("role", "coordinador")
      .not("center_id", "is", null);
    const assignedIds = new Set(
      ((assignedRows as Array<{ center_id: string | null }>) ?? [])
        .map((r) => r.center_id)
        .filter(Boolean) as string[],
    );

    const [c1, c2, p, allCenters, candsResult] = await Promise.all([
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
      supabase
        .from("profiles")
        .select("id, role, full_name, organization, city, state, bio, created_at, documento_tipo, documento_numero")
        .in("role", ["voluntario_medico", "autoridad", "data_entry"])
        .is("verified_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("centers")
        .select("id, name, type, city, state")
        .not("verified_at", "is", null),
      // RPC con SECURITY DEFINER para leer todos los perfiles sin limitación de RLS
      supabase.rpc('get_all_profiles_for_admin'),
    ]);

    if (c1.error) console.error(c1.error);
    if (c2.error) console.error(c2.error);
    if (p.error) console.error(p.error);
    if (candsResult.error) console.error('RPC candidates error:', candsResult.error);

    setPendingCenters((c1.data as PendingCenter[]) ?? []);
    setVerifiedCenters((c2.data as PendingCenter[]) ?? []);
    setPendingProfiles((p.data as PendingProfile[]) ?? []);
    const orphans = ((allCenters.data as OrphanCenter[]) ?? []).filter(
      (c) => !assignedIds.has(c.id),
    );
    setOrphanCenters(orphans);
    setCandidates((candsResult.data as CandidateProfile[]) ?? []);
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

  const approveCenter = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase
      .from("centers")
      .update({ verified_at: new Date().toISOString(), verified: true })
      .eq("id", id);
    setBusyId(null);
    if (error) { toast.error("No se pudo aprobar"); return; }
    toast.success("Centro publicado");
    load();
  };

  const rejectCenter = async (id: string) => {
    if (!confirm("¿Eliminar este centro? Acción irreversible.")) return;
    setBusyId(id);
    const { error } = await supabase.from("centers").delete().eq("id", id);
    setBusyId(null);
    if (error) { toast.error("No se pudo eliminar"); return; }
    toast.success("Centro rechazado");
    load();
  };

  const verifyProfile = async (id: string, note?: string) => {
    setBusyId(id);
    const patch: Record<string, any> = { verified_at: new Date().toISOString() };
    if (note) patch.verification_note = note;
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    setBusyId(null);
    if (error) { toast.error("No se pudo verificar"); return; }
    toast.success("Perfil verificado");
    load();
  };

  const assignCoordinator = async (centerId: string) => {
    const userId = assignSelection[centerId];
    if (!userId) {
      toast.error("Selecciona un usuario antes de asignar");
      return;
    }
    setBusyId(centerId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: "coordinador", center_id: centerId })
      .eq("id", userId);
    setBusyId(null);
    if (error) { toast.error("No se pudo asignar"); console.error(error); return; }
    toast.success("Coordinador asignado");
    setAssignSelection((s) => { const next = { ...s }; delete next[centerId]; return next; });
    load();
  };

  const denyProfile = async (id: string) => {
    const note = prompt("Motivo del rechazo (visible al usuario):");
    if (note === null) return;
    setBusyId(id);
    const { error } = await supabase
      .from("profiles")
      .update({ role: "pending", verification_note: note || null })
      .eq("id", id);
    setBusyId(null);
    if (error) { toast.error("No se pudo rechazar"); return; }
    toast.success("Perfil rechazado y devuelto a pendiente");
    load();
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 space-y-10">
      <header>
        <h1 className="font-display font-semibold text-[28px] leading-tight">Panel de admin</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
          Verifica centros y perfiles antes de habilitarlos en la plataforma.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-display font-semibold text-[18px]">
          Perfiles pendientes ({pendingProfiles.length})
        </h2>
        {loading ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
        ) : pendingProfiles.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-6 text-center text-[13px] text-[var(--color-text-muted)]">
            Sin perfiles pendientes.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingProfiles.map((p) => (
              <article
                key={p.id}
                className="rounded-lg border-hair border-[var(--color-caution)] bg-[var(--color-surface)] p-5"
                style={{ borderLeftWidth: "3px" }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-[16px]">
                      {p.full_name ?? "(sin nombre)"}
                    </div>
                    <div className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                      {ROLE_LABEL[p.role]}
                      {p.organization && ` · ${p.organization}`}
                      {(p.city || p.state) && ` · ${[p.city, p.state].filter(Boolean).join(", ")}`}
                    </div>
                    {p.documento_numero && (
                      <div className="mt-3 max-w-sm">
                        <DocumentoIdentidad
                          documentoTipo={p.documento_tipo ?? "cedula"}
                          documentoNumero={p.documento_numero}
                          onTipoChange={() => {}}
                          onNumeroChange={() => {}}
                          readOnly
                        />
                      </div>
                    )}
                    {p.bio && (
                      <p className="mt-2 text-[13px] whitespace-pre-wrap">{p.bio}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => verifyProfile(p.id)}
                      disabled={busyId === p.id}
                      className="h-9 px-4 rounded-md bg-[var(--color-resolved)] text-white text-[13px] font-display font-semibold disabled:opacity-50"
                    >
                      Verificar
                    </button>
                    <button
                      type="button"
                      onClick={() => denyProfile(p.id)}
                      disabled={busyId === p.id}
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
          Centros pendientes ({pendingCenters.length})
        </h2>
        {loading ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
        ) : pendingCenters.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-6 text-center text-[13px] text-[var(--color-text-muted)]">
            Sin centros pendientes.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingCenters.map((c) => (
              <article
                key={c.id}
                className="rounded-lg border-hair border-[var(--color-caution)] bg-[var(--color-surface)] p-5"
                style={{ borderLeftWidth: "3px" }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-[16px]">{c.name ?? "Sin nombre"}</div>
                    <div className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                      {c.type} · {c.city}, {c.state}
                    </div>
                    <AddressLink address={c.address} className="mt-2 block text-[13px] text-[var(--color-operational)] hover:underline" />
                    {c.phone && <div className="text-[13px] font-mono">{c.phone}</div>}
                    <div className="mt-2 text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
                      Registrado {new Date(c.created_at).toLocaleString("es-VE")}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => approveCenter(c.id)}
                      disabled={busyId === c.id}
                      className="h-9 px-4 rounded-md bg-[var(--color-resolved)] text-white text-[13px] font-display font-semibold disabled:opacity-50"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectCenter(c.id)}
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
          Centros sin coordinador ({orphanCenters.length})
        </h2>
        <p className="text-[12px] text-[var(--color-text-muted)]">
          Centros verificados que aún no tienen un coordinador asignado (típicamente cargados por data entry).
        </p>
        {orphanCenters.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-6 text-center text-[13px] text-[var(--color-text-muted)]">
            Todos los centros verificados tienen coordinador.
          </div>
        ) : (
          <div className="space-y-3">
            {orphanCenters.map((c) => (
              <article
                key={c.id}
                className="rounded-lg border-hair border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <Link
                      to="/centro/$id"
                      params={{ id: c.id }}
                      className="font-display font-semibold text-[15px] hover:underline"
                    >
                      {c.name ?? "(sin nombre)"}
                    </Link>
                    <div className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
                      {c.type ?? "—"} · {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 items-center">
                    <CoordinatorPicker
                      candidates={candidates}
                      value={assignSelection[c.id] ?? ""}
                      onChange={(id) => setAssignSelection((s) => ({ ...s, [c.id]: id }))}
                    />
                    <button
                      type="button"
                      onClick={() => assignCoordinator(c.id)}
                      disabled={busyId === c.id}
                      className="h-9 px-4 rounded-md bg-[var(--color-operational)] text-white text-[13px] font-display font-semibold disabled:opacity-50"
                    >
                      Asignar
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
        {verifiedCenters.length === 0 ? (
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
                {verifiedCenters.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-[var(--color-surface-alt)]" : ""}>
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2 text-[var(--color-text-muted)]">{c.city}, {c.state}</td>
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
