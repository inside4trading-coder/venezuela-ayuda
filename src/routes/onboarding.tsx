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
import { ProfileFields } from "@/components/panel/ProfileFields";

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
  const [step, setStep] = useState<"role" | "volunteerProfile">("role");


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
      setStep("volunteerProfile");
    } catch (err: any) {
      console.error(err);
      toast.error("No pudimos guardar tu rol. Reintenta.");
    } finally {
      setSubmitting(false);
    }
  };


  const onContinue = () => {
    if (step === "role") return saveRoleAndMaybeAdvance();
  };

  if (step === "volunteerProfile") {
    return (
      <div className="max-w-[680px] mx-auto px-4 py-10">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setStep("role")}
            className="text-[13px] text-[var(--color-text-muted)] underline cursor-pointer"
          >
            ← Volver a selección de rol
          </button>
        </div>
        <header className="mb-6">
          <div className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)] mb-2">
            Paso 2 de 2 · Tu perfil
          </div>
          <h1 className="font-display font-semibold text-[26px] leading-tight">
            Completa tu perfil de {ROLE_LABEL[profile?.role ?? "pending"]}
          </h1>
          <p className="mt-2 text-[14px] text-[var(--color-text-muted)]">
            Por favor completa los campos obligatorios para activar tu cuenta.
          </p>
        </header>
        {profile && (
          <div className="rounded-lg border-hair border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm" style={{ borderWidth: "0.5px" }}>
            <ProfileFields
              profile={profile}
              submitLabel="Completar registro"
              onSaved={async () => {
                const role = profile.role;
                if (role === "coordinador") {
                  navigate({ to: "/registrar-centro" });
                } else {
                  navigate({ to: ROLE_PANEL_PATH[role] });
                }
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[1080px] mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display font-semibold text-[28px] leading-tight">
          ¿Cómo quieres ayudar?
        </h1>
        <p className="mt-2 text-[14px] text-[var(--color-text-muted)] max-w-[600px]">
          Elige el rol que mejor describe lo que vas a hacer. Los marcados con un punto
          ámbar requieren verificación manual por un administrador.
        </p>
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
