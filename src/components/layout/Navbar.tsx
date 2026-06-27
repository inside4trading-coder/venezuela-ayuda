import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { useProfile, ROLE_PANEL_PATH } from "@/hooks/useProfile";

const LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/centros", label: "Centros" },
  { to: "/necesidades", label: "Necesidades" },
  { to: "/voluntarios", label: "Voluntarios" },
  { to: "/impacto", label: "Impacto" },
];

function PulseLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12h4l2-6 4 12 3-8 2 4h5"
        stroke="var(--color-critical)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { isAdmin, isCoordinator, profile } = useProfile();
  const panelPath = profile && profile.role !== "pending" ? ROLE_PANEL_PATH[profile.role] : null;
  const showRegisterCenter = !isCoordinator && !isAdmin;

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <header
      className="fixed left-0 right-0 top-8 z-40 h-14 bg-[var(--color-surface)] border-b border-hair border-[var(--color-border)]"
      style={{ borderBottomWidth: "0.5px" }}
    >
      <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <PulseLogo />
          <span className="font-display font-semibold text-[16px] text-[var(--color-text-main)]">
            Venezuela Ayuda
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => {
            const active = isActive(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`text-[14px] py-2 ${
                  active
                    ? "text-[var(--color-text-main)] border-b-2 border-[var(--color-critical)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <AuthButton />
          {panelPath && !isAdmin && (
            <Link
              to={panelPath}
              className="text-[14px] px-3 py-2 rounded-md border-hair border-[var(--color-text-main)] text-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)]"
              style={{ borderWidth: "0.5px" }}
            >
              Mi panel
            </Link>
          )}
          {profile && !isAdmin && (
            <Link
              to="/onboarding"
              className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:underline"
            >
              Cambiar mi rol
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/panel/admin"
              className="text-[14px] px-3 py-2 rounded-md border-hair border-[var(--color-critical)] text-[var(--color-critical)] hover:bg-[var(--color-surface-alt)]"
              style={{ borderWidth: "0.5px" }}
            >
              Admin
            </Link>
          )}
          {showRegisterCenter && (
            <Link
              to="/registrar-centro"
              className="text-[14px] px-3 py-2 rounded-md border-hair border-[var(--color-text-main)] text-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)]"
              style={{ borderWidth: "0.5px" }}
            >
              Registrar centro
            </Link>
          )}
          <Link
            to="/impacto"
            className="text-[14px] px-3 py-2 rounded-md bg-[var(--color-critical)] text-white hover:opacity-90"
          >
            Quiero ayudar
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-[var(--color-text-main)]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-hair border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 flex flex-col gap-2">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`text-[14px] py-2 ${
                isActive(l.to) ? "text-[var(--color-critical)]" : "text-[var(--color-text-main)]"
              }`}
            >
              {l.label}
            </Link>
          ))}

          <div className="flex flex-col gap-2 pt-2 border-t border-hair border-[var(--color-border)]">
            {/* Mi panel / Admin — solo si el usuario tiene rol asignado */}
            {panelPath && !isAdmin && (
              <Link
                to={panelPath}
                onClick={() => setOpen(false)}
                className="text-[14px] px-3 py-2 rounded-md border-hair border-[var(--color-text-main)] text-[var(--color-text-main)] text-center"
                style={{ borderWidth: "0.5px" }}
              >
                Mi panel
              </Link>
            )}
            {profile && !isAdmin && (
              <Link
                to="/onboarding"
                onClick={() => setOpen(false)}
                className="text-[13px] text-center text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] py-2"
              >
                Cambiar mi rol
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/panel/admin"
                onClick={() => setOpen(false)}
                className="text-[14px] px-3 py-2 rounded-md border-hair border-[var(--color-critical)] text-[var(--color-critical)] text-center"
                style={{ borderWidth: "0.5px" }}
              >
                Admin
              </Link>
            )}

            <div className="flex gap-2">
              {showRegisterCenter && (
                <Link
                  to="/registrar-centro"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center text-[14px] px-3 py-2 rounded-md border-hair border-[var(--color-text-main)]"
                  style={{ borderWidth: "0.5px" }}
                >
                  Registrar centro
                </Link>
              )}
              <Link
                to="/impacto"
                onClick={() => setOpen(false)}
                className="flex-1 text-center text-[14px] px-3 py-2 rounded-md bg-[var(--color-critical)] text-white"
              >
                Quiero ayudar
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-hair border-[var(--color-border)]">
            <AuthButton />
          </div>
        </div>
      )}
    </header>
  );
}
