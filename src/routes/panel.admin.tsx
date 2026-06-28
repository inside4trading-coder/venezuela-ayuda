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
import { validateProfile } from "@/lib/requiredFields";

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
  phone?: string | null;
  organization: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  created_at: string;
  documento_tipo?: "cedula" | "pasaporte";
  documento_numero?: string | null;
  skills?: string[];
  zones?: string[];
  vehicle_type?: string | null;
  vehicle_capacity_kg?: number | null;
  license_plate?: string | null;
  country?: string | null;
  company_name?: string | null;
  tax_id?: string | null;
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

  // Estados para "Calidad de Datos"
  const [activeTab, setActiveTab] = useState<"general" | "calidad">("general");
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [limitCount, setLimitCount] = useState(50);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [discardedKeys, setDiscardedKeys] = useState<Set<string>>(new Set());
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [runningCleanup, setRunningCleanup] = useState(false);

  const GRAVITY_RANK: Record<string, number> = {
    fallecido: 5,
    critico: 4,
    herido_grave: 3,
    herido_leve: 2,
    estable: 1,
  };

  const getMoreGrave = (a: string, b: string): string => {
    const rA = GRAVITY_RANK[a] ?? 0;
    const rB = GRAVITY_RANK[b] ?? 0;
    return rA >= rB ? a : b;
  };

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
        .select("id, role, full_name, phone, organization, city, state, bio, created_at, documento_tipo, documento_numero, skills, zones, vehicle_type, vehicle_capacity_kg, license_plate, country, company_name, tax_id")
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

  const loadDuplicates = async (limit = 50) => {
    setLoadingDuplicates(true);
    try {
      const { data, error } = await supabase
        .from("survivors_duplicate_candidates")
        .select("*")
        .gte("name_similarity", 0.80)
        .order("name_similarity", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("loadDuplicates error:", error);
        toast.error("Error al cargar duplicados");
      } else {
        setDuplicates(data ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === "calidad") {
      loadDuplicates(limitCount);
    }
  }, [isAdmin, activeTab, limitCount]);

  const mergeCandidates = async (
    keepId: string,
    deleteId: string,
    keepName: string,
    keepLoc: string,
    keepState: string,
    keepDesc: string,
    deleteState: string,
    deleteDesc: string,
    pairKey: string
  ) => {
    setMergingId(keepId);
    try {
      let mergedDesc = keepDesc;
      if (deleteDesc && deleteDesc.trim() && keepDesc !== deleteDesc) {
        mergedDesc = keepDesc ? `${keepDesc.trim()} | ${deleteDesc.trim()}` : deleteDesc.trim();
      }

      const finalState = getMoreGrave(keepState, deleteState);

      const { error: updateError } = await supabase
        .from("survivors")
        .update({
          descripcion: mergedDesc || null,
          estado_fisico: finalState,
        })
        .eq("id", keepId);

      if (updateError) {
        toast.error("Error al actualizar registro conservado: " + updateError.message);
        return;
      }

      const { error: deleteError } = await supabase
        .from("survivors")
        .delete()
        .eq("id", deleteId);

      if (deleteError) {
        toast.error("Error al eliminar registro duplicado: " + deleteError.message);
        return;
      }

      toast.success("Registros fusionados con éxito");
      setDuplicates((prev) => prev.filter((d) => `${d.id_a}-${d.id_b}` !== pairKey));
    } catch (err: any) {
      console.error(err);
      toast.error("Ocurrió un error inesperado al fusionar.");
    } finally {
      setMergingId(null);
    }
  };

  const runAutoCleanup = async () => {
    setRunningCleanup(true);
    try {
      const { data, error } = await supabase.rpc("merge_exact_duplicate_survivors");
      if (error) {
        toast.error("Error al ejecutar la limpieza automática: " + error.message);
      } else {
        toast.success(`Limpieza completada: se fusionaron ${data ?? 0} grupos de duplicados.`);
        loadDuplicates(limitCount);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error de red al ejecutar limpieza.");
    } finally {
      setRunningCleanup(false);
    }
  };

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

  const visibleDuplicates = duplicates.filter((d) => !discardedKeys.has(`${d.id_a}-${d.id_b}`));

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 space-y-10">
      <header>
        <h1 className="font-display font-semibold text-[28px] leading-tight">Panel de admin</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
          Verifica centros y perfiles antes de habilitarlos en la plataforma y gestiona la calidad de los datos.
        </p>
      </header>

      {/* Pestañas de Navegación */}
      <div className="flex gap-4 border-b border-[var(--color-border)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 text-[14px] font-display font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "general"
              ? "border-[var(--color-critical)] text-[var(--color-text-main)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
          }`}
        >
          Revisiones pendientes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("calidad")}
          className={`px-4 py-2 text-[14px] font-display font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "calidad"
              ? "border-[var(--color-critical)] text-[var(--color-text-main)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
          }`}
        >
          Calidad de datos
        </button>
      </div>

      {activeTab === "general" ? (
        <>
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
                        {(() => {
                          const { valid, missingFields } = validateProfile(p, p.role);
                          return valid ? (
                            <span className="inline-block mt-2 text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[var(--color-resolved)] text-white font-semibold font-display">
                              Perfil completo
                            </span>
                          ) : (
                            <span className="inline-block mt-2 text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[var(--color-caution)] text-white font-semibold font-display">
                              {missingFields.length} {missingFields.length === 1 ? "campo pendiente" : "campos pendientes"}
                            </span>
                          );
                        })()}
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
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[var(--color-border)] pb-4">
            <div>
              <h2 className="font-display font-semibold text-[18px]">
                Calidad de Datos — Sobrevivientes Duplicados
              </h2>
              <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                {visibleDuplicates.length} {visibleDuplicates.length === 1 ? "par de registros similares pendiente" : "pares de registros similares pendientes"} de revisión
              </p>
            </div>
            <button
              type="button"
              onClick={runAutoCleanup}
              disabled={runningCleanup || loadingDuplicates}
              className="px-4 h-9 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] text-[13px] font-display font-semibold rounded-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {runningCleanup ? "Limpiando..." : "Ejecutar limpieza automática"}
            </button>
          </div>

          {loadingDuplicates && duplicates.length === 0 ? (
            <div className="space-y-4">
              <DuplicateCardSkeleton />
              <DuplicateCardSkeleton />
            </div>
          ) : visibleDuplicates.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 p-8 text-center space-y-3 max-w-[600px] mx-auto mt-6 shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 text-2xl font-bold">
                ✓
              </div>
              <h3 className="font-display font-semibold text-[16px] text-emerald-800 dark:text-emerald-300">
                Base de datos limpia
              </h3>
              <p className="text-[13px] text-emerald-700 dark:text-emerald-400">
                ✅ Base de datos limpia — no se detectaron registros similares.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleDuplicates.map((d) => {
                const pairKey = `${d.id_a}-${d.id_b}`;
                const isDiscarded = discardedKeys.has(pairKey);
                const pct = Math.round(d.name_similarity * 100);
                const isVerySimilar = d.name_similarity >= 0.95;
                const isSameLoc = d.location_a === d.location_b && d.location_a;
                const diffState = d.estado_a !== d.estado_b;

                return (
                  <article
                    key={pairKey}
                    className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 transition-all relative ${
                      isDiscarded ? "opacity-60" : ""
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--color-border)] pb-2 text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[14px]">
                          Similitud: {pct}%
                        </span>
                        {isVerySimilar ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                            Casi idénticos
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium">
                            Similares
                          </span>
                        )}
                        {isSameLoc && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium">
                            📍 Mismo centro
                          </span>
                        )}
                      </div>
                      {isDiscarded && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-gray-150 text-gray-700 dark:bg-gray-800 dark:text-gray-400 font-semibold font-display">
                          Descartado
                        </span>
                      )}
                    </div>

                    {/* Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
                      {/* Registro A */}
                      <div className="space-y-2">
                        <div className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                          Registro A
                        </div>
                        <div className="font-display font-semibold text-[15px] text-[var(--color-text-main)]">
                          {d.name_a}
                        </div>
                        <div className="text-[13px] text-[var(--color-text-muted)]">
                          📍 {d.location_a || "Ubicación desconocida"}
                        </div>
                        <div className={`p-2 rounded-md ${diffState ? "bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900" : "bg-[var(--color-bg)]"}`}>
                          <span className="text-[var(--color-text-muted)] text-[12px]">Estado físico:</span>
                          <span className={`ml-1.5 font-semibold ${diffState ? "text-orange-700 dark:text-orange-400 animate-pulse" : "text-[var(--color-text-main)]"}`}>
                            {d.estado_a || "No especificado"}
                          </span>
                        </div>
                        {d.desc_a && (
                          <p className="text-[var(--color-text-muted)] italic text-[12px] bg-[var(--color-bg)] p-2 rounded">
                            "{d.desc_a}"
                          </p>
                        )}
                      </div>

                      {/* Registro B */}
                      <div className="space-y-2 md:border-l md:border-[var(--color-border)] md:pl-6">
                        <div className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                          Registro B
                        </div>
                        <div className="font-display font-semibold text-[15px] text-[var(--color-text-main)]">
                          {d.name_b}
                        </div>
                        <div className="text-[13px] text-[var(--color-text-muted)]">
                          📍 {d.location_b || "Ubicación desconocida"}
                        </div>
                        <div className={`p-2 rounded-md ${diffState ? "bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900" : "bg-[var(--color-bg)]"}`}>
                          <span className="text-[var(--color-text-muted)] text-[12px]">Estado físico:</span>
                          <span className={`ml-1.5 font-semibold ${diffState ? "text-orange-700 dark:text-orange-400 animate-pulse" : "text-[var(--color-text-main)]"}`}>
                            {d.estado_b || "No especificado"}
                          </span>
                        </div>
                        {d.desc_b && (
                          <p className="text-[var(--color-text-muted)] italic text-[12px] bg-[var(--color-bg)] p-2 rounded">
                            "{d.desc_b}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isDiscarded && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--color-border)]">
                        <button
                          type="button"
                          onClick={() => mergeCandidates(d.id_a, d.id_b, d.name_a, d.location_a || "", d.estado_a, d.desc_a || "", d.estado_b, d.desc_b || "", pairKey)}
                          disabled={mergingId !== null}
                          className="h-9 px-4 rounded-md bg-[var(--color-resolved)] text-white text-[13px] font-display font-semibold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        >
                          Fusionar — mantener A
                        </button>
                        <button
                          type="button"
                          onClick={() => mergeCandidates(d.id_b, d.id_a, d.name_b, d.location_b || "", d.estado_b, d.desc_b || "", d.estado_a, d.desc_a || "", pairKey)}
                          disabled={mergingId !== null}
                          className="h-9 px-4 rounded-md bg-[var(--color-resolved)] text-white text-[13px] font-display font-semibold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        >
                          Fusionar — mantener B
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscardedKeys((prev) => { const next = new Set(prev); next.add(pairKey); return next; })}
                          disabled={mergingId !== null}
                          className="h-9 px-4 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)] text-[13px] font-display font-medium transition-all disabled:opacity-50 cursor-pointer"
                        >
                          Son personas distintas
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}

              {visibleDuplicates.length >= limitCount && (
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => setLimitCount((prev) => prev + 50)}
                    className="px-4 h-10 border border-[var(--color-border)] rounded-md text-[13px] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] font-display font-semibold cursor-pointer transition-colors"
                  >
                    Cargar más candidatos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DuplicateCardSkeleton() {
  return (
    <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        <div className="space-y-2 border-l border-[var(--color-border)] pl-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[520px] mx-auto px-4 py-16 text-center">{children}</div>;
}
