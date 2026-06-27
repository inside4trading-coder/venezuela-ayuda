import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export type ProfileRole =
  | "pending"
  | "donador"
  | "voluntario"
  | "coordinador"
  | "admin"
  | "observador";

export interface Profile {
  id: string;
  role: ProfileRole;
  center_id: string | null;
  full_name: string | null;
  phone: string | null;
  state: string | null;
  city: string | null;
  organization: string | null;
  avatar_url: string | null;
}

export function useProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    supabase
      .from("profiles")
      .select("id, role, center_id, full_name, phone, state, city, organization, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("useProfile:", error);
          setProfile(null);
        } else {
          setProfile(data as Profile);
        }
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const refresh = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, center_id, full_name, phone, state, city, organization, avatar_url")
      .eq("id", user.id)
      .single();
    if (!error && data) setProfile(data as Profile);
  };

  const isAdmin = profile?.role === "admin";
  const isCoordinator = profile?.role === "coordinador";
  const isPending = profile?.role === "pending";

  return { profile, isAdmin, isCoordinator, isPending, isLoading, refresh };
}
