import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, type ProfileRole, ROLE_LABEL } from "@/hooks/useProfile";
import { AuthButton } from "@/components/auth/AuthButton";

interface Props {
  expectedRoles: ProfileRole[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Layout estándar para los paneles por rol.
 * Centraliza: loader, gate de auth, gate de rol, badge de verificación.
 */
export function PanelLayout({ expectedRoles, title, subtitle, children }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profLoading, requiresVerification, isVerified } = useProfile();

  if (authLoading || profLoading) return <Gate>Cargando…</Gate>;

  if (!user) {
    return (
      <Gate>
        <h1 className="font-display text-[22px] mb-2">Inicia sesión para acceder</h1>
        <div className="flex justify-center mt-4">
          <AuthButton />
        </div>
      </Gate>
    );
  }

  if (!profile || !expectedRoles.includes(profile.role)) {
    return (
      <Gate>
        <h1 className="font-display text-[22px] mb-2">Este panel no es para tu rol</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
          Estás registrado como <strong>{profile ? ROLE_LABEL[profile.role] : "—"}</strong>.
        </p>
        <Link to="/" className="text-[13px] text-[var(--color-operational)] underline">
          Volver al directorio
        </Link>
      </Gate>
    );
  }

  if (requiresVerification && !isVerified) {
    return (
      <div className="max-w-[640px] mx-auto px-4 py-12">
        <div className="rounded-lg border-hair border-[var(--color-caution)] bg-[var(--color-surface)] p-6"
             style={{ borderLeftWidth: "3px" }}>
          <h1 className="font-display font-semibold text-[20px] mb-2">
            Tu cuenta está pendiente de verificación
          </h1>
          <p className="text-[14px] text-[var(--color-text-muted)] mb-4 leading-relaxed">
            Como <strong>{ROLE_LABEL[profile.role]}</strong> necesitas que un administrador
            revise y valide tu identidad antes de operar. Completá tu perfil con la mayor
            información posible para acelerar la verificación.
          </p>
          {profile.verification_note && (
            <div className="mt-3 p-3 rounded bg-[var(--color-surface-alt)] text-[13px]">
              <div className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)] mb-1">
                Nota del admin
              </div>
              {profile.verification_note}
            </div>
          )}
        </div>
        <div className="mt-6">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8 space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-[28px] leading-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-[14px] text-[var(--color-text-muted)]">{subtitle}</p>
          )}
        </div>
        {requiresVerification && isVerified && (
          <span className="text-[11px] uppercase tracking-label px-2 py-1 rounded-sm border-hair border-[var(--color-resolved)] text-[var(--color-resolved)]">
            Verificado
          </span>
        )}
      </header>
      {children}
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[520px] mx-auto px-4 py-16 text-center">{children}</div>;
}
