import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type ApplicationStatus = "pendiente" | "aceptada" | "rechazada";

export type InitiatedBy = "volunteer" | "center";

export interface Application {
  id: string;
  volunteer_id: string | null;
  user_id: string | null;
  center_id: string | null;
  message: string | null;
  status: ApplicationStatus;
  initiated_by: InitiatedBy;
  created_at: string;
  updated_at: string;
}

export interface MyApplication extends Application {
  center: { id: string; name: string | null; type: string | null; city: string | null; state: string | null } | null;
}

export interface IncomingApplication extends Application {
  volunteer: { id: string; name: string | null; phone: string | null; roles: string[] | null } | null;
  // Si el postulante tiene profile (porque estaba logueado), también lo traemos
  applicant_name: string | null;
}

const APP_COLS_FULL =
  "id, volunteer_id, user_id, center_id, message, status, initiated_by, created_at, updated_at";
const APP_COLS_BASE =
  "id, volunteer_id, user_id, center_id, message, status, created_at, updated_at";

/** SELECT con degradación si initiated_by no existe aún */
async function selectAppsWithCenter(
  filter: (q: any) => any,
): Promise<any[] | null> {
  const tryRun = async (cols: string) => {
    let q = supabase
      .from("volunteer_applications")
      .select(`${cols}, center:centers(id, name, type, city, state)`);
    q = filter(q);
    return q.order("created_at", { ascending: false });
  };
  const r1 = await tryRun(APP_COLS_FULL);
  if (!r1.error) return r1.data as any[];
  console.warn("apps select full failed:", r1.error.message);
  const r2 = await tryRun(APP_COLS_BASE);
  if (r2.error) {
    console.error("apps select base failed:", r2.error);
    return null;
  }
  // Inyectar initiated_by por default para no romper el render
  return ((r2.data as any[]) ?? []).map((r) => ({ initiated_by: "volunteer", ...r }));
}

/** Postulaciones que hizo el voluntario logueado */
export function useMyApplications(userId: string | null) {
  const [items, setItems] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await selectAppsWithCenter((q) => q.eq("user_id", userId));
    setItems(((data ?? []) as unknown) as MyApplication[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, reload };
}

/** Postulaciones recibidas por un centro (visible al coordinador) */
export function useCenterApplications(centerId: string | null) {
  const [items, setItems] = useState<IncomingApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!centerId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Degradación: intenta con initiated_by; si falla, sin él.
    // Schema real de volunteers: full_name, phone, skills (no name/roles).
    const tryRun = async (cols: string) =>
      supabase
        .from("volunteer_applications")
        .select(`${cols}, volunteer:volunteers(id, full_name, phone, skills)`)
        .eq("center_id", centerId)
        .order("created_at", { ascending: false });

    let apps: any[] | null = null;
    const r1 = await tryRun(APP_COLS_FULL);
    if (!r1.error) {
      apps = r1.data as any[];
    } else {
      console.warn("center apps select full failed:", r1.error.message);
      const r2 = await tryRun(APP_COLS_BASE);
      if (r2.error) {
        console.error("useCenterApplications:", r2.error);
        setItems([]);
        setLoading(false);
        return;
      }
      apps = ((r2.data as any[]) ?? []).map((r) => ({ initiated_by: "volunteer", ...r }));
    }

    const rows = apps ?? [];

    // Enriquecer con full_name del profile cuando user_id está presente
    const userIds = rows.map((r) => r.user_id).filter((id): id is string => !!id);
    let nameByUser: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      nameByUser = Object.fromEntries(
        ((profs as Array<{ id: string; full_name: string | null }>) ?? [])
          .map((p) => [p.id, p.full_name ?? ""]),
      );
    }

    const enriched: IncomingApplication[] = rows.map((r) => {
      const vol = Array.isArray(r.volunteer) ? r.volunteer[0] : r.volunteer;
      return {
        ...r,
        volunteer: vol
          ? { id: vol.id, name: vol.full_name ?? null, phone: vol.phone ?? null, roles: vol.skills ?? null }
          : null,
        applicant_name:
          (r.user_id && nameByUser[r.user_id]) || vol?.full_name || null,
      };
    });

    setItems(enriched);
    setLoading(false);
  }, [centerId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, reload };
}

/** Crear postulación (voluntario logueado se inscribe a un centro) */
export async function applyToCenter(params: {
  centerId: string;
  userId: string;
  message?: string;
  volunteerId?: string | null;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from("volunteer_applications").insert({
    center_id: params.centerId,
    user_id: params.userId,
    volunteer_id: params.volunteerId ?? null,
    message: params.message?.trim() || null,
    status: "pendiente",
  });
  return { error: error?.message ?? null };
}

/** Coordinador acepta o rechaza una postulación */
export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("volunteer_applications")
    .update({ status })
    .eq("id", id);
  return { error: error?.message ?? null };
}
