import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export type ProfileRole =
  | "pending"
  | "donador"
  | "empresa"
  | "diaspora"
  | "voluntario"
  | "voluntario_medico"
  | "transportista"
  | "coordinador"
  | "autoridad"
  | "observador"
  | "admin";

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
  company_name: string | null;
  tax_id: string | null;
  country: string | null;
  vehicle_type: string | null;
  vehicle_capacity_kg: number | null;
  license_plate: string | null;
  skills: string[];
  zones: string[];
  verified_at: string | null;
  verification_note: string | null;
  bio: string | null;
}

const SELECT_COLS =
  "id, role, center_id, full_name, phone, state, city, organization, avatar_url, company_name, tax_id, country, vehicle_type, vehicle_capacity_kg, license_plate, skills, zones, verified_at, verification_note, bio";

const REQUIRES_VERIFICATION: ProfileRole[] = ["voluntario_medico", "autoridad"];

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
      .select(SELECT_COLS)
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
      .select(SELECT_COLS)
      .eq("id", user.id)
      .single();
    if (!error && data) setProfile(data as Profile);
  };

  const isAdmin = profile?.role === "admin";
  const isCoordinator = profile?.role === "coordinador";
  const isPending = profile?.role === "pending";
  const requiresVerification = profile
    ? REQUIRES_VERIFICATION.includes(profile.role)
    : false;
  const isVerified = !!profile?.verified_at;
  const isActive = profile
    ? !REQUIRES_VERIFICATION.includes(profile.role) || isVerified
    : false;

  return {
    profile,
    isAdmin,
    isCoordinator,
    isPending,
    requiresVerification,
    isVerified,
    isActive,
    isLoading,
    refresh,
  };
}

// Mapa rol → ruta de panel (usado por Navbar y onboarding redirect)
export const ROLE_PANEL_PATH: Record<ProfileRole, string> = {
  pending: "/onboarding",
  donador: "/panel/donador",
  empresa: "/panel/empresa",
  diaspora: "/panel/diaspora",
  voluntario: "/panel/voluntario",
  voluntario_medico: "/panel/voluntario",
  transportista: "/panel/transportista",
  coordinador: "/panel/centro",
  autoridad: "/panel/autoridad",
  observador: "/panel/ong",
  admin: "/panel/admin",
};

export const ROLE_LABEL: Record<ProfileRole, string> = {
  pending: "Sin rol",
  donador: "Donador",
  empresa: "Empresa",
  diaspora: "Diáspora",
  voluntario: "Voluntario",
  voluntario_medico: "Voluntario médico",
  transportista: "Transportista",
  coordinador: "Coordinador de centro",
  autoridad: "Autoridad",
  observador: "ONG / Observador",
  admin: "Administrador",
};
