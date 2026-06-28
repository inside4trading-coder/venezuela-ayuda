import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Building2,
  ClipboardList,
  Globe2,
  HeartHandshake,
  Package,
  Stethoscope,
  Truck,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, type ProfileRole, ROLE_PANEL_PATH, ROLE_LABEL } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { CheckGrid } from "@/components/ui-vh/CheckGrid";
import { Field, Select, TextInput } from "@/components/ui-vh/Field";
import { DocumentoIdentidad } from "@/components/ui/DocumentoIdentidad";
import { validateProfile, FIELD_LABELS } from "@/lib/requiredFields";
import { VOLUNTEER_ROLES } from "@/data/volunteer-roles";
import { ESTADOS_VENEZUELA } from "@/data/mock";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Bienvenido · Venezuela Ayuda" },
      { name: "description", content: "Elige cómo quieres ayudar." },
    ],
  }),
  component: Onboarding,
});

type SelfServiceRole = Exclude<
  ProfileRole,
  "pending" | "admin" | "observador"
>;

const ROLES: Array<{
  id: SelfServiceRole;
  title: string;
  desc: string;
  icon: typeof Package;
  needsVerification?: boolean;
}> = [
  {
    id: "donador",
    title: "Quiero donar",
    desc: "Llevo especies o recursos a un centro de acopio o albergue.",
    icon: Package,
  },
  {
    id: "empresa",
    title: "Soy empresa",
    desc: "Coordino donaciones en volumen y necesito constancia para mi compañía.",
    icon: Building2,
  },
  {
    id: "diaspora",
    title: "Soy diáspora",
    desc: "Vivo fuera y quiero aportar al esfuerzo desde el exterior.",
    icon: Globe2,
  },
  {
    id: "voluntario",
    title: "Soy voluntario",
    desc: "Aporto mi tiempo o habilidades donde se necesite.",
    icon: HeartHandshake,
  },
  {
    id: "voluntario_medico",
    title: "Soy voluntario médico",
    desc: "Soy personal de salud y quiero atender en puntos médicos.",
    icon: Stethoscope,
    needsVerification: true,
  },
  {
    id: "transportista",
    title: "Soy transportista",
    desc: "Tengo vehículo y puedo mover carga entre centros.",
    icon: Truck,
  },
  {
    id: "coordinador",
    title: "Coordino un centro",
    desc: "Gestiono un albergue, acopio, punto médico, cocina o distribución.",
    icon: Users,
  },
  {
    id: "data_entry",
    title: "Cargo datos en la plataforma",
    desc: "Registro centros y datos en lote; un admin asigna coordinadores luego.",
    icon: ClipboardList,
    needsVerification: true,
  },
];

function Onboarding() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profLoading, refresh } = useProfile();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SelfServiceRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Paso 2 — solo para voluntarios: completar perfil operativo
  const [step, setStep] = useState<"role" | "volunteerProfile">("role");
  const [vskills, setVskills] = useState<string[]>([]);
  const [vstate, setVstate] = useState("");
  const [vcity, setVcity] = useState("");
  const [docTipo, setDocTipo] = useState<"cedula" | "pasaporte">("cedula");
  const [docNumero, setDocNumero] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.phone) setPhone(profile.phone);
      if (profile.bio) setBio(profile.bio);
      if (profile.skills) setVskills(profile.skills);
      if (profile.state) setVstate(profile.state);
      if (profile.city) setVcity(profile.city);
      if (profile.documento_tipo) setDocTipo(profile.documento_tipo);
      if (profile.documento_numero) setDocNumero(profile.documento_numero);
    }
  }, [profile]);

  const toggleSkill = (s: string) =>
    setVskills((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  if (authLoading || profLoading) return <Centered>Cargando…</Centered>;

  if (!user) {
    return (
      <Centered>
        <h1 className="font-display text-[22px] mb-2">Inicia sesión primero</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
          Necesitas una cuenta de Google para elegir tu rol.
        </p>
        <Link to="/" className="text-[13px] text-[var(--color-operational)] underline">
          Volver al directorio
        </Link>
      </Centered>
    );
  }

  if (profile && profile.role === "admin") {
    return (
      <Centered>
        <h1 className="font-display text-[22px] mb-2">Eres administrador</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
          El rol de admin no se cambia desde acá. Si necesitas otro rol, pide a otro
          admin que retire tu email de <code>admin_emails</code>.
        </p>
        <Link
          to="/panel/admin"
          className="inline-block h-11 px-5 rounded-md bg-[var(--color-critical)] text-white font-display font-semibold text-[14px] leading-[44px]"
        >
          Ir al panel admin
        </Link>
      </Centered>
    );
  }

  const currentRole = profile?.role && profile.role !== "pending" ? profile.role : null;

  const isVolunteerRole = (r: SelfServiceRole | null) =>
    r === "voluntario" || r === "voluntario_medico";

  const saveRoleAndMaybeAdvance = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: selected })
        .eq("id", user.id);
      if (error) throw error;
      await refresh();
      const role = selected as ProfileRole;
      const needsVerification = role === "voluntario_medico" || role === "data_entry";

      // Voluntarios pasan al paso 2 antes de redirigir; los demás van directo.
      if (isVolunteerRole(selected)) {
        toast.success(
          needsVerification
            ? "Rol guardado — completa tu perfil. Un admin lo revisará."
            : "Rol guardado — completa tu perfil para aparecer en el marketplace.",
        );
        setStep("volunteerProfile");
        setSubmitting(false);
        return;
      }

      toast.success(
        needsVerification
          ? "Rol guardado — un admin revisará tu cuenta"
          : "Rol guardado",
      );
      if (role === "coordinador") {
        navigate({ to: "/registrar-centro" });
      } else {
        navigate({ to: ROLE_PANEL_PATH[role] });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("No pudimos guardar tu rol. Reintenta.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveVolunteerProfileAndFinish = async () => {
    if (!selected) return;
    const mockProfile: Partial<Profile> = {
      full_name: fullName,
      phone: phone,
      documento_tipo: docTipo,
      documento_numero: docNumero,
      state: vstate,
      city: vcity,
      skills: vskills,
      bio: bio,
    };
    const { valid, missingFields } = validateProfile(mockProfile, selected as ProfileRole);
    if (!valid) {
      setErrors(missingFields);
      toast.error("Por favor completa todos los campos obligatorios.");
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      const patch: Record<string, unknown> = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        documento_tipo: docTipo,
        documento_numero: docNumero.trim() || null,
        skills: vskills,
        state: vstate.trim(),
        city: vcity.trim(),
        bio: selected === "voluntario_medico" ? bio.trim() : null,
      };
      const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (error) throw error;
      await refresh();
      navigate({ to: ROLE_PANEL_PATH[selected as ProfileRole] });
    } catch (err: any) {
      console.error(err);
      toast.error("No pudimos guardar tu perfil. Reintenta.");
    } finally {
      setSubmitting(false);
    }
  };

  const onContinue = () => {
    if (step === "role") return saveRoleAndMaybeAdvance();
    return saveVolunteerProfileAndFinish();
  };

  // Paso 2 — perfil voluntario
  if (step === "volunteerProfile") {
    return (
      <div className="max-w-[680px] mx-auto px-4 py-10">
        <header className="mb-6">
          <div className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)] mb-2">
            Paso 2 de 2 · Tu perfil
          </div>
          <h1 className="font-display font-semibold text-[26px] leading-tight">
            Completa tu perfil de voluntario
          </h1>
          <p className="mt-2 text-[14px] text-[var(--color-text-muted)]">
            Sin estos datos no aparecerás en el marketplace de voluntarios. Puedes
            saltarlos y completarlos después desde tu panel.
          </p>
        </header>

        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre completo">
              <TextInput
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre y Apellido"
                className={errors.includes("full_name") ? "border-red-500 focus:border-red-500" : ""}
              />
            </Field>
            <Field label="Teléfono">
              <TextInput
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+58 ..."
                className={errors.includes("phone") ? "border-red-500 focus:border-red-500" : ""}
              />
            </Field>
          </div>

          <DocumentoIdentidad
            documentoTipo={docTipo}
            documentoNumero={docNumero}
            onTipoChange={setDocTipo}
            onNumeroChange={setDocNumero}
            tipoError={errors.includes("documento_tipo")}
            numeroError={errors.includes("documento_numero")}
          />
          <div>
            <div className={`block mb-2 text-[13px] ${errors.includes("skills") ? "text-red-500 font-semibold" : ""}`}>
              ¿En qué puedes ayudar? {errors.includes("skills") ? "(Selecciona al menos una)" : ""}
            </div>
            <CheckGrid
              options={VOLUNTEER_ROLES}
              selected={vskills}
              onToggle={toggleSkill}
              cols={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Estado">
              <Select
                value={vstate}
                onChange={(e) => setVstate(e.target.value)}
                className={errors.includes("state") ? "border-red-500 focus:ring-red-500" : ""}
              >
                <option value="">Selecciona…</option>
                {ESTADOS_VENEZUELA.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ciudad o municipio">
              <TextInput
                value={vcity}
                onChange={(e) => setVcity(e.target.value)}
                className={errors.includes("city") ? "border-red-500 focus:border-red-500" : ""}
              />
            </Field>
          </div>

          {selected === "voluntario_medico" && (
            <Field label="Especialidad médica / Credenciales (MPPS)">
              <TextInput
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Pediatra, MPPS 12345, Colegio de Médicos..."
                className={errors.includes("bio") ? "border-red-500 focus:border-red-500" : ""}
              />
            </Field>
          )}
        </section>

        <div className="mt-8 flex justify-between items-center">
          <button
            type="button"
            onClick={() => setStep("role")}
            className="text-[13px] text-[var(--color-text-muted)] underline"
          >
            Atrás (cambiar rol)
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={submitting}
            className="h-11 px-6 rounded-md bg-[var(--color-critical)] text-white font-display font-semibold text-[15px] hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Guardando…" : "Continuar al panel"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1080px] mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display font-semibold text-[28px] leading-tight">
          {currentRole ? "Cambia tu rol" : "¿Cómo quieres ayudar?"}
        </h1>
        <p className="mt-2 text-[14px] text-[var(--color-text-muted)] max-w-[600px]">
          Elige el rol que mejor describe lo que vas a hacer. Los marcados con un punto
          ámbar requieren verificación manual por un administrador.
        </p>
        {currentRole && (
          <div className="mt-4 rounded-md border-hair border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[13px] flex items-center justify-between gap-3 flex-wrap" style={{ borderWidth: "0.5px" }}>
            <span>
              Tu rol actual: <strong>{ROLE_LABEL[currentRole] ?? currentRole}</strong>.
              Elige otro abajo si quieres cambiarlo.
            </span>
            <Link
              to={ROLE_PANEL_PATH[currentRole]}
              className="text-[13px] text-[var(--color-operational)] hover:underline"
            >
              Volver a mi panel →
            </Link>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROLES.map((r) => {
          const Icon = r.icon;
          const active = selected === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r.id)}
              className={`relative text-left p-5 rounded-lg border-hair transition ${
                active
                  ? "border-[var(--color-critical)] bg-[var(--color-surface)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-muted)]"
              }`}
              style={{ borderWidth: active ? "1px" : "0.5px" }}
            >
              {r.needsVerification && (
                <span
                  className="absolute top-3 right-3 inline-block h-2 w-2 rounded-full"
                  style={{ background: "var(--color-caution)" }}
                  aria-label="Requiere verificación"
                />
              )}
              <Icon
                className="h-5 w-5 mb-3"
                style={{ color: active ? "var(--color-critical)" : "var(--color-text-muted)" }}
              />
              <div className="font-display font-semibold text-[15px] mb-1">{r.title}</div>
              <div className="text-[13px] text-[var(--color-text-muted)] leading-snug">
                {r.desc}
              </div>
              {r.needsVerification && (
                <div className="mt-3 text-[11px] uppercase tracking-label text-[var(--color-caution)]">
                  Requiere verificación
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          disabled={!selected || submitting}
          className="h-11 px-6 rounded-md bg-[var(--color-critical)] text-white font-display font-semibold text-[15px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Guardando…" : "Continuar"}
        </button>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[640px] mx-auto p-10 text-center">{children}</div>;
}
