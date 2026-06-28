import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AvailableCenter {
  id: string;
  name: string;
  type: string | null;
  state: string | null;
  city: string | null;
  phone: string | null;
  accepts_rescued: boolean;
  capacity_available: number;
}

export function useAvailableCenters(stateFilter?: string) {
  const [items, setItems] = useState<AvailableCenter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchCenters = async () => {
      setLoading(true);
      let q = supabase
        .from("centers")
        .select("id, name, type, state, city, phone, accepts_rescued, capacity_available")
        .eq("accepts_rescued", true)
        .gt("capacity_available", 0);
      if (stateFilter) {
        q = q.eq("state", stateFilter);
      }
      const { data, error } = await q;
      if (!active) return;
      if (error) {
        console.error("useAvailableCenters:", error);
        setItems([]);
      } else {
        setItems((data as AvailableCenter[]) ?? []);
      }
      setLoading(false);
    };

    fetchCenters();
    return () => {
      active = false;
    };
  }, [stateFilter]);

  return { items, loading };
}
