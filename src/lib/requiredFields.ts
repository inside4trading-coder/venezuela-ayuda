import type { Profile, ProfileRole } from "@/hooks/useProfile";

export const FIELD_LABELS: Record<string, string> = {
  full_name: "Nombre completo",
  phone: "Teléfono",
  documento_tipo: "Tipo de documento",
  documento_numero: "Número de documento",
  state: "Estado",
  city: "Ciudad o municipio",
  company_name: "Razón social",
  tax_id: "RIF",
  skills: "Tipos de ayuda / habilidades",
  bio: "Bio / información adicional",
  vehicle_type: "Tipo de vehículo",
  vehicle_capacity_kg: "Capacidad de carga (kg)",
  license_plate: "Placa del vehículo",
  zones: "Zonas de cobertura",
  country: "País",
};

export const REQUIRED_FIELDS_BY_ROLE: Record<ProfileRole, string[]> = {
  admin: ["full_name"],
  data_entry: ["full_name"],
  observador: ["full_name"],
  autoridad: ["full_name"],
  
  // Base universal + specific fields
  donador: ["full_name", "phone", "documento_tipo", "documento_numero", "state", "city"],
  empresa: ["full_name", "phone", "documento_tipo", "documento_numero", "state", "city", "company_name", "tax_id"],
  voluntario: ["full_name", "phone", "documento_tipo", "documento_numero", "state", "city", "skills"],
  voluntario_medico: ["full_name", "phone", "documento_tipo", "documento_numero", "state", "city", "skills", "bio"],
  transportista: ["full_name", "phone", "documento_tipo", "documento_numero", "state", "city", "vehicle_type", "vehicle_capacity_kg", "license_plate", "zones"],
  diaspora: ["full_name", "phone", "documento_tipo", "documento_numero", "state", "city", "country"],
  coordinador: ["full_name", "phone", "documento_tipo", "documento_numero", "state", "city", "bio"],
  
  pending: ["full_name", "phone", "documento_tipo", "documento_numero", "state", "city"],
};

export function validateProfile(
  profile: Partial<Profile> | null,
  role: ProfileRole
): { valid: boolean; missingFields: string[] } {
  if (!profile) {
    const required = REQUIRED_FIELDS_BY_ROLE[role] || [];
    return { valid: required.length === 0, missingFields: required };
  }

  const missingFields: string[] = [];
  const required = REQUIRED_FIELDS_BY_ROLE[role] || [];

  for (const field of required) {
    const val = (profile as any)[field];
    if (Array.isArray(val)) {
      if (val.length === 0) {
        missingFields.push(field);
      }
    } else if (
      val === null ||
      val === undefined ||
      (typeof val === "string" && val.trim() === "") ||
      (typeof val === "number" && isNaN(val))
    ) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
