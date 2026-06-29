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
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [discardedKeys, setDiscardedKeys] = useState<Set<string>>(new Set());
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [exitingKeys, setExitingKeys] = useState<Set<string>>(new Set());

  // Estados para Calidad de Datos de Edificios
  const [calidadSubTab, setCalidadSubTab] = useState<"sobrevivientes" | "edificios">("sobrevivientes");
  const [buildingsList, setBuildingsList] = useState<any[]>([]);
  const [buildingDuplicates, setBuildingDuplicates] = useState<any[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [discardedBuildingKeys, setDiscardedBuildingKeys] = useState<Set<string>>(new Set());
  const [mergingBuildingId, setMergingBuildingId] = useState<string | null>(null);
  const [runningBuildingCleanup, setRunningBuildingCleanup] = useState(false);
  const [showConfirmBuildingModal, setShowConfirmBuildingModal] = useState(false);

  const triggerBuildingsAutoCleanup = async () => {
    setRunningBuildingCleanup(true);
    let mergedCount = 0;
    try {
      const toMerge = buildingDuplicates.filter(
        (d) => d.similitud >= 0.95 && !discardedBuildingKeys.has(`${d.id_a}-${d.id_b}`)
      );

      for (const pair of toMerge) {
        const pairKey = `${pair.id_a}-${pair.id_b}`;
        if (discardedBuildingKeys.has(pairKey)) continue;

        const keepBuilding = buildingsList.find((b) => b.id === pair.id_a);
        const discardBuilding = buildingsList.find((b) => b.id === pair.id_b);

        if (!keepBuilding || !discardBuilding) continue;

        const patch: Record<string, any> = {};
        if (
          (!keepBuilding.estatus || keepBuilding.estatus === "sin_datos") &&
          discardBuilding.estatus &&
          discardBuilding.estatus !== "sin_datos"
        ) {
          patch.estatus = discardBuilding.estatus;
        }
        if (
          (!keepBuilding.zona || keepBuilding.zona === "null" || keepBuilding.zona === "") &&
          discardBuilding.zona &&
          discardBuilding.zona !== "null" &&
          discardBuilding.zona !== ""
        ) {
          patch.zona = discardBuilding.zona;
        }

        let updateSuccess = true;
        if (Object.keys(patch).length > 0) {
          const { data: updateData, error: updateErr } = await supabase
            .from("buildings")
            .update(patch)
            .eq("id", pair.id_a)
            .select();
          if (updateErr || !updateData || updateData.length === 0) {
            updateSuccess = false;
          }
        }

        if (updateSuccess) {
          const { data: deleteData, error: deleteErr } = await supabase
            .from("buildings")
            .delete()
            .eq("id", pair.id_b)
            .select();

          if (!deleteErr && deleteData && deleteData.length > 0) {
            mergedCount++;
            setDiscardedBuildingKeys((prev) => {
              const next = new Set(prev);
              next.add(pairKey);
              return next;
            });
          }
        }
      }

      toast.success(`Se fusionaron ${mergedCount} edificios duplicados automáticamente.`);
      loadBuildingDuplicates();
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error al realizar la limpieza automática.");
    } finally {
      setRunningBuildingCleanup(false);
    }
  };

  const loadBuildingDuplicates = async () => {
    setLoadingBuildings(true);
    try {
      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .order("edificio", { ascending: true });
        
      if (error) {
        toast.error("Error al cargar edificios: " + error.message);
        return;
      }
      
      const list = data || [];
      setBuildingsList(list);

      const found: any[] = [];
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const b1 = list[i];
          const b2 = list[j];
          const similarity = getFuzzySimilarity(b1.edificio, b2.edificio);
          if (similarity >= 0.70) {
            found.push({
              id_a: b1.id,
              nombre_a: b1.edificio,
              zona_a: b1.zona,
              estatus_a: b1.estatus,
              created_a: b1.created_at,
              building_a: b1,
              
              id_b: b2.id,
              nombre_b: b2.edificio,
              zona_b: b2.zona,
              estatus_b: b2.estatus,
              created_b: b2.created_at,
              building_b: b2,
              
              similitud: similarity,
            });
          }
        }
      }
      
      found.sort((x, y) => y.similitud - x.similitud);
      setBuildingDuplicates(found);
    } catch (err) {
      console.error(err);
      toast.error("Error al buscar edificios duplicados");
    } finally {
      setLoadingBuildings(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === "calidad" && calidadSubTab === "edificios") {
      loadBuildingDuplicates();
    }
  }, [isAdmin, activeTab, calidadSubTab]);

  const mergeBuildings = async (keepId: string, discardId: string, pairKey: string) => {
    setMergingBuildingId(keepId);
    try {
      const keepBuilding = buildingsList.find((b) => b.id === keepId);
      const discardBuilding = buildingsList.find((b) => b.id === discardId);
      
      if (!keepBuilding || !discardBuilding) {
        toast.error("Error: Edificio no encontrado");
        return;
      }

      const patch: Record<string, any> = {};
      if (
        (!keepBuilding.estatus || keepBuilding.estatus === "sin_datos") &&
        discardBuilding.estatus &&
        discardBuilding.estatus !== "sin_datos"
      ) {
        patch.estatus = discardBuilding.estatus;
      }
      if (
        (!keepBuilding.zona || keepBuilding.zona === "null" || keepBuilding.zona === "") &&
        discardBuilding.zona &&
        discardBuilding.zona !== "null" &&
        discardBuilding.zona !== ""
      ) {
        patch.zona = discardBuilding.zona;
      }

      if (Object.keys(patch).length > 0) {
        const { data: updateData, error: updateErr } = await supabase
          .from("buildings")
          .update(patch)
          .eq("id", keepId)
          .select();
        if (updateErr) {
          toast.error("Error al actualizar edificio principal: " + updateErr.message);
          return;
        }
        if (!updateData || updateData.length === 0) {
          toast.error("Error: Permiso denegado por la base de datos (RLS) al actualizar.");
          return;
        }
      }

      const { data: deleteData, error: deleteErr } = await supabase
        .from("buildings")
        .delete()
        .eq("id", discardId)
        .select();

      if (deleteErr) {
        toast.error("Error al eliminar edificio duplicado: " + deleteErr.message);
        return;
      }

      if (!deleteData || deleteData.length === 0) {
        toast.error("Error: Permiso denegado por la base de datos (RLS) al eliminar.");
        return;
      }

      toast.success("Edificios fusionados con éxito");
      
      setDiscardedBuildingKeys((prev) => {
        const next = new Set(prev);
        next.add(pairKey);
        return next;
      });
      
      setBuildingDuplicates((prev) => prev.filter((d) => `${d.id_a}-${d.id_b}` !== pairKey));
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error inesperado al fusionar edificios");
    } finally {
      setMergingBuildingId(null);
    }
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

  const loadDuplicates = async () => {
    setLoadingDuplicates(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase.rpc("find_duplicate_survivors");

      if (error) {
        console.error("loadDuplicates error:", error);
        setLoadError(error.message || "Error al cargar duplicados");
      } else {
        setDuplicates(data ?? []);
      }
    } catch (err: any) {
      console.error(err);
      setLoadError(err.message || "Error al cargar duplicados");
    } finally {
      setLoadingDuplicates(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === "calidad") {
      loadDuplicates();
    }
  }, [isAdmin, activeTab]);

  const mergeDuplicates = async (keepId: string, discardId: string, pairKey: string) => {
    setMergingId(keepId);
    try {
      const { error } = await supabase.rpc("merge_survivors", {
        keep_id: keepId,
        discard_id: discardId,
      });

      if (error) {
        toast.error("Error al fusionar registros: " + error.message);
      } else {
        toast.success("Fusionado correctamente");
        
        // Registrar exiting key para animación fade-out
        setExitingKeys((prev) => {
          const next = new Set(prev);
          next.add(pairKey);
          return next;
        });

        // Esperar la duración de la animación (300ms) y retirar del estado local
        setTimeout(() => {
          setDuplicates((prev) => prev.filter((d) => `${d.id_a}-${d.id_b}` !== pairKey));
          setExitingKeys((prev) => {
            const next = new Set(prev);
            next.delete(pairKey);
            return next;
          });
        }, 300);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Ocurrió un error inesperado al fusionar.");
    } finally {
      setMergingId(null);
    }
  };

  const triggerAutoCleanup = async () => {
    setRunningCleanup(true);
    let mergedCount = 0;
    let errorCount = 0;
    try {
      // Threshold bajado a 0.90 para capturar pares muy similares aunque no sean idénticos
      const toMerge = duplicates.filter(
        (d) => d.similitud >= 0.90 && !discardedKeys.has(`${d.id_a}-${d.id_b}`)
      );

      if (toMerge.length === 0) {
        toast.info("No hay pares con similitud ≥ 90% pendientes de fusión.");
        return;
      }

      for (const pair of toMerge) {
        const pairKey = `${pair.id_a}-${pair.id_b}`;
        if (discardedKeys.has(pairKey)) continue;

        // Conservar el que tenga cédula; si ambos o ninguno, conservar id_a
        const keepId   = (!pair.cedula_a && pair.cedula_b) ? pair.id_b : pair.id_a;
        const discardId = keepId === pair.id_a ? pair.id_b : pair.id_a;

        const { error } = await supabase.rpc("merge_survivors", {
          keep_id: keepId,
          discard_id: discardId,
        });

        if (error) {
          console.error(`Error fusionando par ${pairKey}:`, error.message);
          errorCount++;
        } else {
          mergedCount++;
          setDiscardedKeys((prev) => {
            const next = new Set(prev);
            next.add(pairKey);
            return next;
          });
        }
      }

      if (mergedCount > 0) {
        toast.success(`Se fusionaron ${mergedCount} registros duplicados automáticamente.`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} pares no pudieron fusionarse. Revisa la consola para más detalles.`);
      }
      loadDuplicates();
    } catch (err: any) {
      console.error(err);
      toast.error("Ocurrió un error al realizar la limpieza automática.");
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
          {/* Sub-tabs para Calidad de Datos */}
          <div className="flex gap-2 bg-gray-50 dark:bg-gray-900/60 p-1.5 rounded-lg w-fit border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setCalidadSubTab("sobrevivientes")}
              className={`px-4 py-2 rounded-md text-[13px] font-display font-semibold transition-all cursor-pointer ${
                calidadSubTab === "sobrevivientes"
                  ? "bg-white dark:bg-gray-800 text-[var(--color-text-main)] shadow-sm border border-gray-150 dark:border-gray-700"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] border border-transparent"
              }`}
            >
              Sobrevivientes (Base de datos)
            </button>
            <button
              type="button"
              onClick={() => setCalidadSubTab("edificios")}
              className={`px-4 py-2 rounded-md text-[13px] font-display font-semibold transition-all cursor-pointer ${
                calidadSubTab === "edificios"
                  ? "bg-white dark:bg-gray-800 text-[var(--color-text-main)] shadow-sm border border-gray-150 dark:border-gray-700"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] border border-transparent"
              }`}
            >
              Edificios (Fuzzy Matching)
            </button>
          </div>

          {calidadSubTab === "sobrevivientes" ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[var(--color-border)] pb-4">
                <div>
                  <h2 className="font-display font-semibold text-[17px] text-[var(--color-text-main)]">
                    Duplicados de Sobrevivientes
                  </h2>
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                    {visibleDuplicates.length} {visibleDuplicates.length === 1 ? "par pendiente" : "pares pendientes"} de revisión
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={runningCleanup || loadingDuplicates}
                  className="px-4 h-9 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] text-[13px] font-display font-semibold rounded-md transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {runningCleanup ? "Limpiando..." : "Ejecutar limpieza automática"}
                </button>
              </div>

              {loadError ? (
                <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-8 text-center space-y-4 max-w-[600px] mx-auto mt-6 shadow-sm">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 text-red-650 dark:text-red-300 text-xl font-bold">
                    !
                  </div>
                  <h3 className="font-display font-semibold text-[16px] text-red-800 dark:text-red-300">
                    Error al cargar duplicados
                  </h3>
                  <p className="text-[13px] text-red-700 dark:text-red-400">
                    {loadError}
                  </p>
                  <button
                    type="button"
                    onClick={() => loadDuplicates()}
                    className="px-4 py-2 bg-[var(--color-critical)] text-white rounded-md text-[13px] font-display font-semibold hover:opacity-90 cursor-pointer transition-colors shadow-sm"
                  >
                    Reintentar
                  </button>
                </div>
              ) : loadingDuplicates && duplicates.length === 0 ? (
                <div className="space-y-4">
                  <DuplicateCardSkeleton />
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
                    No se detectaron registros similares de sobrevivientes.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleDuplicates.map((d) => {
                    const pairKey = `${d.id_a}-${d.id_b}`;
                    const isExiting = exitingKeys.has(pairKey);
                    const pct = Math.round(d.similitud * 100);

                    const getSimilarityColor = (sim: number) => {
                      if (sim >= 0.95) {
                        return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900";
                      }
                      if (sim >= 0.85) {
                        return "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900";
                      }
                      return "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900";
                    };

                    const colorClasses = getSimilarityColor(d.similitud);

                    return (
                      <article
                        key={pairKey}
                        className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 transition-all duration-300 transform ${
                          isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--color-border)] pb-2 text-[12px]">
                          <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                            POSIBLE DUPLICADO
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorClasses}`}>
                            Similitud: {pct}%
                          </span>
                        </div>

                        {/* Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
                          {/* Registro A */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                A
                              </span>
                              <h4 className="font-display font-semibold text-[15px] text-[var(--color-text-main)]">
                                {d.name_a}
                              </h4>
                            </div>
                            <p className="text-[13px] text-[var(--color-text-muted)]">
                              {d.location_a || "Ubicación no registrada"}
                            </p>
                            <p className="text-[12px] font-mono text-[var(--color-text-muted)]">
                              {d.cedula_a ? `Cédula: ${d.cedula_a}` : "Sin cédula"}
                            </p>
                          </div>

                          {/* Registro B */}
                          <div className="space-y-1.5 md:text-right md:border-l md:border-[var(--color-border)] md:pl-6">
                            <div className="flex items-center gap-2 md:justify-end">
                              <h4 className="font-display font-semibold text-[15px] text-[var(--color-text-main)]">
                                {d.name_b}
                              </h4>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                B
                              </span>
                            </div>
                            <p className="text-[13px] text-[var(--color-text-muted)]">
                              {d.location_b || "Ubicación no registrada"}
                            </p>
                            <p className="text-[12px] font-mono text-[var(--color-text-muted)]">
                              {d.cedula_b ? `Cédula: ${d.cedula_b}` : "Sin cédula"}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--color-border)]">
                          <button
                            type="button"
                            onClick={() => mergeDuplicates(d.id_a, d.id_b, pairKey)}
                            disabled={mergingId !== null}
                            className="h-9 px-4 rounded-md bg-[var(--color-resolved)] hover:bg-[var(--color-resolved)]/90 text-white text-[13px] font-display font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                          >
                            Conservar A
                          </button>
                          <button
                            type="button"
                            onClick={() => mergeDuplicates(d.id_b, d.id_a, pairKey)}
                            disabled={mergingId !== null}
                            className="h-9 px-4 rounded-md bg-[var(--color-resolved)] hover:bg-[var(--color-resolved)]/90 text-white text-[13px] font-display font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                          >
                            Conservar B
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDiscardedKeys((prev) => {
                                const next = new Set(prev);
                                next.add(pairKey);
                                return next;
                              });
                            }}
                            disabled={mergingId !== null}
                            className="h-9 px-4 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)] text-[13px] font-display font-medium transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                          >
                            No es duplicado
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[var(--color-border)] pb-4">
                <div>
                  <h2 className="font-display font-semibold text-[17px] text-[var(--color-text-main)]">
                    Fuzzy Matching de Edificios (Similitud ≥ 70%)
                  </h2>
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                    {buildingDuplicates.filter((d) => !discardedBuildingKeys.has(`${d.id_a}-${d.id_b}`)).length} pares potenciales encontrados
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmBuildingModal(true)}
                  disabled={runningBuildingCleanup || loadingBuildings || buildingDuplicates.filter((d) => d.similitud >= 0.95 && !discardedBuildingKeys.has(`${d.id_a}-${d.id_b}`)).length === 0}
                  className="px-4 h-9 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] text-[13px] font-display font-semibold rounded-md transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {runningBuildingCleanup ? "Limpiando..." : "Ejecutar limpieza automática"}
                </button>
              </div>

              {loadingBuildings ? (
                <div className="space-y-4">
                  <DuplicateCardSkeleton />
                  <DuplicateCardSkeleton />
                </div>
              ) : buildingDuplicates.filter((d) => !discardedBuildingKeys.has(`${d.id_a}-${d.id_b}`)).length === 0 ? (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 p-8 text-center space-y-3 max-w-[600px] mx-auto mt-6 shadow-sm">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 text-2xl font-bold">
                    ✓
                  </div>
                  <h3 className="font-display font-semibold text-[16px] text-emerald-800 dark:text-emerald-300">
                    No se encontraron duplicados
                  </h3>
                  <p className="text-[13px] text-emerald-700 dark:text-emerald-400">
                    Todas las edificaciones tienen nombres suficientemente diferentes.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {buildingDuplicates
                    .filter((d) => !discardedBuildingKeys.has(`${d.id_a}-${d.id_b}`))
                    .map((d) => {
                      const pairKey = `${d.id_a}-${d.id_b}`;
                      const pct = Math.round(d.similitud * 100);

                      const getSimilarityColor = (sim: number) => {
                        if (sim >= 0.95) return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900";
                        if (sim >= 0.85) return "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900";
                        return "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900";
                      };

                      return (
                        <article
                          key={pairKey}
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--color-border)] pb-2 text-[12px]">
                            <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                              POSIBLE EDIFICIO DUPLICADO
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getSimilarityColor(d.similitud)}`}>
                              Similitud: {pct}%
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
                            {/* Registro A */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                  A
                                </span>
                                <h4 className="font-display font-semibold text-[15px] text-[var(--color-text-main)]">
                                  {d.nombre_a}
                                </h4>
                              </div>
                              <p className="text-[13px] text-[var(--color-text-muted)]">
                                Zona: {d.zona_a && d.zona_a !== "null" ? d.zona_a : "Zona no registrada"}
                              </p>
                              <p className="text-[12px] text-[var(--color-text-muted)]">
                                Estado: <span className="font-semibold">{getStatusBadge(d.estatus_a).label}</span>
                              </p>
                            </div>

                            {/* Registro B */}
                            <div className="space-y-1.5 md:text-right md:border-l md:border-[var(--color-border)] md:pl-6">
                              <div className="flex items-center gap-2 md:justify-end">
                                <h4 className="font-display font-semibold text-[15px] text-[var(--color-text-main)]">
                                  {d.nombre_b}
                                </h4>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                  B
                                </span>
                              </div>
                              <p className="text-[13px] text-[var(--color-text-muted)]">
                                Zona: {d.zona_b && d.zona_b !== "null" ? d.zona_b : "Zona no registrada"}
                              </p>
                              <p className="text-[12px] text-[var(--color-text-muted)]">
                                Estado: <span className="font-semibold">{getStatusBadge(d.estatus_b).label}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--color-border)]">
                            <button
                              type="button"
                              onClick={() => mergeBuildings(d.id_a, d.id_b, pairKey)}
                              disabled={mergingBuildingId !== null}
                              className="h-9 px-4 rounded-md bg-[var(--color-resolved)] hover:bg-[var(--color-resolved)]/90 text-white text-[13px] font-display font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                              Conservar A (Borrar B)
                            </button>
                            <button
                              type="button"
                              onClick={() => mergeBuildings(d.id_b, d.id_a, pairKey)}
                              disabled={mergingBuildingId !== null}
                              className="h-9 px-4 rounded-md bg-[var(--color-resolved)] hover:bg-[var(--color-resolved)]/90 text-white text-[13px] font-display font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                              Conservar B (Borrar A)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDiscardedBuildingKeys((prev) => {
                                  const next = new Set(prev);
                                  next.add(pairKey);
                                  return next;
                                });
                              }}
                              disabled={mergingBuildingId !== null}
                              className="h-9 px-4 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)] text-[13px] font-display font-medium transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                              No es duplicado
                            </button>
                          </div>
                        </article>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmación de Limpieza Automática */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl max-w-[440px] w-full p-6 space-y-6 shadow-xl animate-scale-in">
            <div className="space-y-2">
              <h3 className="font-display font-semibold text-[18px] text-[var(--color-text-main)]">
                Confirmar Limpieza Automática
              </h3>
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
                Se fusionarán automáticamente los pares con similitud <strong className="text-[var(--color-critical)] font-semibold">≥ 95%</strong>. Esta acción no se puede deshacer. ¿Continuar?
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-md border border-[var(--color-border)] text-[13px] font-display font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  triggerAutoCleanup();
                }}
                className="px-4 py-2 rounded-md bg-[var(--color-critical)] text-white text-[13px] font-display font-semibold hover:opacity-90 cursor-pointer transition-all shadow-sm"
              >
                Confirmar y limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Limpieza Automática de Edificios */}
      {showConfirmBuildingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl max-w-[440px] w-full p-6 space-y-6 shadow-xl animate-scale-in">
            <div className="space-y-2">
              <h3 className="font-display font-semibold text-[18px] text-[var(--color-text-main)]">
                Confirmar Limpieza Automática de Edificios
              </h3>
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
                Se fusionarán automáticamente todos los edificios detectados con similitud <strong className="text-[var(--color-critical)] font-semibold">≥ 95%</strong>. Esta acción no se puede deshacer. ¿Continuar?
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmBuildingModal(false)}
                className="px-4 py-2 rounded-md border border-[var(--color-border)] text-[13px] font-display font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmBuildingModal(false);
                  triggerBuildingsAutoCleanup();
                }}
                className="px-4 py-2 rounded-md bg-[var(--color-critical)] text-white text-[13px] font-display font-semibold hover:opacity-90 cursor-pointer transition-all shadow-sm"
              >
                Confirmar y limpiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DuplicateCardSkeleton() {
  return (
    <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg space-y-4 animate-pulse shadow-sm h-48 flex flex-col justify-between">
      <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border)]">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
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
      <div className="flex gap-2 pt-3 border-t border-[var(--color-border)]">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
      </div>
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[520px] mx-auto px-4 py-16 text-center">{children}</div>;
}

// Algoritmo Fuzzy Matching Levenshtein para Edificios
function cleanBuildingNameForMatch(name: string): string {
  const parsed = parseBuildingName(name).cleanName;
  return parsed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remover acentos
    .replace(/\b(edificio|residencias|residencia|res|hotel|urb|bloque|bloques)\b/g, "") // ignorar prefijos comunes
    .replace(/[^a-z0-9]/g, "") // dejar solo alfanumérico
    .trim();
}

function parseBuildingName(name: string): { cleanName: string; parsedZone: string | null } {
  const match = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return {
      cleanName: match[1].trim(),
      parsedZone: match[2].trim(),
    };
  }
  return {
    cleanName: name.trim(),
    parsedZone: null,
  };
}

function getStatusBadge(status: string | null) {
  const normalized = (status || "").toLowerCase().trim();
  switch (normalized) {
    case "perdida_total":
      return {
        label: "Pérdida total",
        classes: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900"
      };
    case "danos_graves":
      return {
        label: "Daños graves",
        classes: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900"
      };
    case "danos_leves":
      return {
        label: "Daños leves",
        classes: "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900"
      };
    case "habitable":
      return {
        label: "Habitable",
        classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
      };
    case "sin_datos":
    default:
      return {
        label: "Sin información",
        classes: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
      };
  }
}

function getLevenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // eliminación
        matrix[i][j - 1] + 1, // inserción
        matrix[i - 1][j - 1] + cost // sustitución
      );
    }
  }
  return matrix[a.length][b.length];
}

function getFuzzySimilarity(str1: string, str2: string): number {
  const s1 = cleanBuildingNameForMatch(str1);
  const s2 = cleanBuildingNameForMatch(str2);
  
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  
  const dist = getLevenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - dist / maxLen;
}
