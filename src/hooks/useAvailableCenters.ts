import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface AvailableCenter {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  capacity: number | null;
  capacity_used: number | null;
  accepts_rescued: boolean;
  capacity_available: number;
}

export interface AvailableCentersFilters {
  state?: string;
}

export function useAvailableCenters(filters: AvailableCentersFilters = {}) {
  const [centers, setCenters] = useState<AvailableCenter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        let q = supabase
          .from("centers")
          .select("id, name, type, city, state, capacity, capacity_used, accepts_rescued, capacity_available")
          .eq("accepts_rescued", true)
          .gt("capacity_available", 0);

        if (filters.state) {
          q = q.eq("state", filters.state);
        }

        const { data, error } = await q;
        if (!active) return;

        if (error) {
          console.error("useAvailableCenters error:", error);
          setCenters([]);
        } else {
          setCenters((data as AvailableCenter[]) ?? []);
        }
      } catch (err) {
        console.error("useAvailableCenters exception:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [filters.state]);

  return { centers, loading };
}
