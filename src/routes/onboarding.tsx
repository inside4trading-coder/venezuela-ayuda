import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { HeartHandshake, Package, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, type ProfileRole } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Bienvenido · Venezuela Ayuda" },
      { name: "description", content: "Elige cómo quieres ayudar." },
    ],
  }),
  component: Onboarding,
});

type SelfServiceRole = Extract<ProfileRole, "donador" | "voluntario" | "coordinador">;

const ROLES: Array<{
  id: SelfServiceRole;
  title: string;
  desc: string;
  icon: typeof Package;
}> = [
  {
    id: "donador",
    title: "Quiero donar",
    desc: "Llevo especies o aporto recursos a un centro de acopio o albergue.",
    icon: Package,
  },
  {
    id: "voluntario",
    title: "Quiero ser voluntario",
    desc: "Aporto mi tiempo, habilidades o transporte donde se necesite.",
    icon: HeartHandshake,
  },
  {
    id: "coordinador",
    title: "Coordino un centro",
    desc: "Gestiono un albergue, acopio, punto médico, cocina o distribución.",
    icon: Users,
  },
];

function Onboarding() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profLoading, refresh } = useProfile();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SelfServiceRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (authLoading || profLoading) {
    return <Centered>Cargando…</Centered>;
  }

  if (!user) {
    return (
      <Centered>
        <h1 className="font-display text-[22px] mb-2">Inicia sesión primero</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
          Necesitas una cuenta de Google para elegir tu rol.
        </p>
        <Link
          to="/"
          className="text-[13px] text-[var(--color-operational)] underline"
        >
          Volver al directorio
        </Link>
      </Centered>
    );
  }

  if (profile && profile.role !== "pending") {
    return (
      <Centered>
        <h1 className="font-display text-[22px] mb-2">Ya tienes un rol asignado</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
          Estás registrado como <strong>{profile.role}</strong>.
        </p>
        <Link
          to="/"
          className="text-[13px] text-[var(--color-operational)] underline"
        >
          Ir al directorio
        </Link>
      </Centered>
    );
  }

  const onContinue = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: selected })
        .eq("id", user.id);
      if (error) throw error;
      await refresh();
      toast.success("Rol guardado");
      if (selected === "coordinador") {
        navigate({ to: "/registrar-centro" });
      } else {
        navigate({ to: "/" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("No pudimos guardar tu rol. Reintenta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display font-semibold text-[28px] leading-tight">
          ¿Cómo quieres ayudar?
        </h1>
        <p className="mt-2 text-[14px] text-[var(--color-text-muted)]">
          Elige el rol que mejor describe lo que vas a hacer. Puedes cambiarlo después.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ROLES.map((r) => {
          const Icon = r.icon;
          const active = selected === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r.id)}
              className={`text-left p-5 rounded-lg border-hair transition ${
                active
                  ? "border-[var(--color-critical)] bg-[var(--color-surface)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-muted)]"
              }`}
              style={{ borderWidth: active ? "1px" : "0.5px" }}
            >
              <Icon
                className="h-5 w-5 mb-3"
                style={{ color: active ? "var(--color-critical)" : "var(--color-text-muted)" }}
              />
              <div className="font-display font-semibold text-[16px] mb-1">{r.title}</div>
              <div className="text-[13px] text-[var(--color-text-muted)] leading-snug">
                {r.desc}
              </div>
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
  return (
    <div className="max-w-[640px] mx-auto p-10 text-center">{children}</div>
  );
}
