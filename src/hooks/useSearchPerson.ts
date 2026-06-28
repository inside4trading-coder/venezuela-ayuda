import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface SearchPersonResult {
  source: "survivor" | "rescued";
  id: string;
  full_name: string;
  location: string | null;
  current_state: string;
  status_info: string;
  created_at: string;
}

export function useSearchPerson() {
  const [results, setResults] = useState<SearchPersonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (name: string, state: string | null) => {
    if (!name.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc("search_person", {
        search_name: name.trim(),
        search_state: state && state.trim() !== "" ? state.trim() : null,
      });

      if (error) {
        console.error("useSearchPerson RPC error:", error);
        setError(error.message);
        setResults([]);
      } else {
        setResults((data as SearchPersonResult[]) ?? []);
      }
    } catch (err: any) {
      console.error("useSearchPerson exception:", err);
      setError(err.message ?? "Error en la búsqueda");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, results, loading, error };
}
