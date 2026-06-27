import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Field, Select, TextArea, TextInput } from "@/components/ui-vh/Field";
import { CheckGrid } from "@/components/ui-vh/CheckGrid";
import type { Profile, ProfileRole } from "@/hooks/useProfile";
import { ESTADOS_VENEZUELA } from "@/data/mock";
import { VOLUNTEER_ROLES } from "@/data/volunteer-roles";

interface Props {
  profile: Profile;
  onSaved?: () => void;
}

const VEHICLE_TYPES = ["Moto", "Sedán", "Pickup", "Camión pequeño", "Camión grande", "4x4", "Otro"];

const COUNTRIES = [
  ["US", "Estados Unidos"], ["ES", "España"], ["AR", "Argentina"],
  ["CL", "Chile"], ["CO", "Colombia"], ["MX", "México"],
  ["PE", "Perú"], ["BR", "Brasil"], ["IT", "Italia"],
  ["FR", "Francia"], ["DE", "Alemania"], ["CA", "Canadá"],
  ["UY", "Uruguay"], ["EC", "Ecuador"], ["PA", "Panamá"],
  ["DO", "República Dominicana"], ["PR", "Puerto Rico"], ["OTHER", "Otro país"],
] as const;

/** Renderiza solo los campos relevantes para el rol del usuario. */
export function ProfileFields({ profile, onSaved }: Props) {
  const [form, setForm] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const patch = buildPatch(form, profile.role);
    const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("No se pudo guardar el perfil");
      return;
    }
    toast.success("Perfil actualizado");
    onSaved?.();
  };

  return (
    <section className="space-y-4">
      <h2 className="font-display font-semibold text-[18px]">Mi perfil</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre">
          <TextInput value={form.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} />
        </Field>
        <Field label="Teléfono">
          <TextInput value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+58…" />
        </Field>

        {needsLocation(profile.role) && (
          <>
            <Field label="Estado">
              <Select value={form.state ?? ""} onChange={(e) => set("state", e.target.value)}>
                <option value="">Selecciona…</option>
                {ESTADOS_VENEZUELA.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Ciudad">
              <TextInput value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </Field>
          </>
        )}

        {(profile.role === "empresa") && (
          <>
            <Field label="Razón social">
              <TextInput value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} />
            </Field>
            <Field label="RIF">
              <TextInput value={form.tax_id ?? ""} onChange={(e) => set("tax_id", e.target.value)} placeholder="J-12345678-9" />
            </Field>
          </>
        )}

        {profile.role === "diaspora" && (
          <Field label="País desde donde aportas">
            <Select value={form.country ?? ""} onChange={(e) => set("country", e.target.value)}>
              <option value="">Selecciona…</option>
              {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </Select>
          </Field>
        )}

        {profile.role === "transportista" && (
          <>
            <Field label="Tipo de vehículo">
              <Select value={form.vehicle_type ?? ""} onChange={(e) => set("vehicle_type", e.target.value)}>
                <option value="">Selecciona…</option>
                {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Capacidad (kg)">
              <TextInput
                type="number" min="0"
                value={form.vehicle_capacity_kg ?? ""}
                onChange={(e) => set("vehicle_capacity_kg", e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
            <Field label="Placa">
              <TextInput value={form.license_plate ?? ""} onChange={(e) => set("license_plate", e.target.value)} />
            </Field>
          </>
        )}

        {(profile.role === "voluntario" || profile.role === "voluntario_medico") && (
          <>
            <div className="sm:col-span-2">
              <div className="block mb-1.5 text-[13px]">Tipos de ayuda que puedes dar</div>
              <CheckGrid
                options={VOLUNTEER_ROLES}
                selected={form.skills ?? []}
                onToggle={(v) => {
                  const cur = form.skills ?? [];
                  set(
                    "skills",
                    cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
                  );
                }}
                cols={2}
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Los centros que necesiten estos roles verán tu perfil sugerido.
              </p>
            </div>
          </>
        )}

        {(profile.role === "voluntario" || profile.role === "voluntario_medico" || profile.role === "transportista") && (
          <Field label="Zonas que cubres (separadas por coma)">
            <TextInput
              value={(form.zones ?? []).join(", ")}
              onChange={(e) => set("zones", parseList(e.target.value))}
              placeholder="Vargas, La Guaira, Caracas…"
            />
          </Field>
        )}

        {(profile.role === "autoridad" || profile.role === "observador") && (
          <Field label="Organización">
            <TextInput value={form.organization ?? ""} onChange={(e) => set("organization", e.target.value)} />
          </Field>
        )}
      </div>

      <Field label="Bio / información adicional">
        <TextArea
          value={form.bio ?? ""}
          onChange={(e) => set("bio", e.target.value)}
          placeholder={bioPlaceholder(profile.role)}
        />
      </Field>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-10 px-5 rounded-md bg-[var(--color-critical)] text-white font-display font-semibold text-[14px] disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar perfil"}
        </button>
      </div>
    </section>
  );
}

function parseList(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function needsLocation(role: ProfileRole): boolean {
  return ["donador", "voluntario", "voluntario_medico", "transportista", "coordinador", "autoridad"].includes(role);
}

function bioPlaceholder(role: ProfileRole): string {
  switch (role) {
    case "voluntario_medico":
      return "Especialidad, años de experiencia, dónde trabajas, credenciales (MPPS, colegio de médicos)…";
    case "autoridad":
      return "Institución, cargo, ámbito de competencia…";
    case "transportista":
      return "Horarios disponibles, rutas habituales, condiciones especiales (refrigeración, etc.)";
    default:
      return "Cuéntanos algo útil sobre tu disponibilidad.";
  }
}

function buildPatch(form: Profile, role: ProfileRole): Partial<Profile> {
  const base: Partial<Profile> = {
    full_name: form.full_name,
    phone: form.phone,
    bio: form.bio,
  };
  if (needsLocation(role)) {
    base.state = form.state;
    base.city = form.city;
  }
  if (role === "empresa") {
    base.company_name = form.company_name;
    base.tax_id = form.tax_id;
  }
  if (role === "diaspora") {
    base.country = form.country;
  }
  if (role === "transportista") {
    base.vehicle_type = form.vehicle_type;
    base.vehicle_capacity_kg = form.vehicle_capacity_kg;
    base.license_plate = form.license_plate;
    base.zones = form.zones;
  }
  if (role === "voluntario" || role === "voluntario_medico") {
    base.skills = form.skills;
    base.zones = form.zones;
  }
  if (role === "autoridad" || role === "observador") {
    base.organization = form.organization;
  }
  return base;
}
