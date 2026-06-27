import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type ApplicationStatus = "pendiente" | "aceptada" | "rechazada";

export interface Application {
  id: string;
  volunteer_id: string | null;
  user_id: string | null;
  center_id: string | null;
  message: string | null;
  status: ApplicationStatus;
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

const APP_COLS =
  "id, volunteer_id, user_id, center_id, message, status, created_at, updated_at";

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
    const { data, error } = await supabase
      .from("volunteer_applications")
      .select(`${APP_COLS}, center:centers(id, name, type, city, state)`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) console.error("useMyApplications:", error);
    setItems(((data as unknown) as MyApplication[]) ?? []);
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
    // Embed volunteers; si no resuelve la FK (PostgREST puede inferir mal),
    // traemos las apps básicas y luego enriquecemos con profile.full_name.
    const { data: apps, error } = await supabase
      .from("volunteer_applications")
      .select(`${APP_COLS}, volunteer:volunteers(id, name, phone, roles)`)
      .eq("center_id", centerId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("useCenterApplications:", error);
      setItems([]);
      setLoading(false);
      return;
    }

    const rows = (apps as any[]) ?? [];

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

    const enriched: IncomingApplication[] = rows.map((r) => ({
      ...r,
      volunteer: Array.isArray(r.volunteer) ? r.volunteer[0] : r.volunteer,
      applicant_name:
        (r.user_id && nameByUser[r.user_id]) ||
        (Array.isArray(r.volunteer) ? r.volunteer[0]?.name : r.volunteer?.name) ||
        null,
    }));

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
