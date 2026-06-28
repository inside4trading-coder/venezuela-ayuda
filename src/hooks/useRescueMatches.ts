import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface RescueMatch {
  id: string;
  rescued_person_id: string;
  center_id: string;
  initiated_by: string;
  status: "pendiente" | "aceptado" | "rechazado" | "cancelado";
  message: string | null;
  created_at: string;
  updated_at: string;
  rescued_person?: any; // joined info
}

export function useRescueMatches(centerId?: string | null) {
  const [matches, setMatches] = useState<RescueMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!centerId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("rescue_matches")
      .select("*, rescued_person:rescued_persons(*)")
      .eq("center_id", centerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("useRescueMatches fetch error:", error);
      setMatches([]);
    } else {
      setMatches((data as RescueMatch[]) ?? []);
    }
    setLoading(false);
  }, [centerId]);

  useEffect(() => {
    fetchMatches();
  }, [centerId, fetchMatches]);

  const createMatch = useCallback(async (params: {
    rescuedPersonId: string;
    centerId: string;
    initiatedBy: string;
    message?: string;
  }) => {
    const { data, error } = await supabase
      .from("rescue_matches")
      .insert({
        rescued_person_id: params.rescuedPersonId,
        center_id: params.centerId,
        initiated_by: params.initiatedBy,
        status: "pendiente",
        message: params.message || null,
      })
      .select()
      .single();
    return { data, error };
  }, []);

  const updateMatchStatus = useCallback(
    async (matchId: string, status: "pendiente" | "aceptado" | "rechazado" | "cancelado") => {
      const { data, error } = await supabase
        .from("rescue_matches")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", matchId)
        .select()
        .single();
      if (!error) {
        fetchMatches();
      }
      return { data, error };
    },
    [fetchMatches],
  );

  return { matches, loading, fetchMatches, createMatch, updateMatchStatus };
}
