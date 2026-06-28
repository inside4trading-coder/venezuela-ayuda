import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Result {
  ok: boolean;
  error?: string;
}

export function useMarkSurvivorReunited() {
  const [busy, setBusy] = useState(false);

  const mark = useCallback(async (id: string, note: string): Promise<Result> => {
    const trimmed = note.trim();
    if (trimmed.length < 5) {
      return { ok: false, error: "La nota debe tener al menos 5 caracteres." };
    }
    setBusy(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        return { ok: false, error: "Necesitas iniciar sesión para marcar." };
      }
      const { error } = await supabase
        .from("survivors")
        .update({
          reunited_at: new Date().toISOString(),
          reunited_by: uid,
          reunited_note: trimmed,
        })
        .eq("id", id);
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      return { ok: false, error: msg };
    } finally {
      setBusy(false);
    }
  }, []);

  const unmark = useCallback(async (id: string): Promise<Result> => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("survivors")
        .update({
          reunited_at: null,
          reunited_by: null,
          reunited_note: null,
        })
        .eq("id", id);
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      return { ok: false, error: msg };
    } finally {
      setBusy(false);
    }
  }, []);

  return { mark, unmark, busy };
}
