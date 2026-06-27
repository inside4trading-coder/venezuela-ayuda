import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PanelLayout } from "@/components/panel/PanelLayout";
import { ProfileFields } from "@/components/panel/ProfileFields";
import { useProfile } from "@/hooks/useProfile";
import { useCenters } from "@/hooks/useCenters";
import {
  applyToCenter,
  updateApplicationStatus,
  useMyApplications,
  type ApplicationStatus,
} from "@/hooks/useVolunteerApplications";
import { TextArea } from "@/components/ui-vh/Field";
import { VOLUNTEER_ROLES } from "@/data/volunteer-roles";

export const Route = createFileRoute("/panel/voluntario")({
  head: () => ({ meta: [{ title: "Panel voluntario · Venezuela Ayuda" }] }),
  component: VolunteerPanel,
});

interface CenterWithRoles {
  id: string;
  nombre: string;
  kind: string;
  ciudad: string;
  estadoVe: string;
  needed_roles: string[];
  matchedRoles: string[];
}

function VolunteerPanel() {
  const { profile } = useProfile();
  const { centers } = useCenters({});
  const { items: myApps, reload: reloadApps } = useMyApplications(profile?.id ?? null);

  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // IDs de centros a los que ya me postulé (cualquier estado)
  const appliedCenterIds = new Set(myApps.map((a) => a.center_id).filter((x): x is string => !!x));

  // Match: centros con needed_roles intersección skills, o por zona si no hay skills
  const skills = profile?.skills ?? [];
  const matched: CenterWithRoles[] = centers
    .map((c) => {
      const needed = (c as any).needed_roles ?? [];
      const matchedRoles = needed.filter((r: string) => skills.includes(r));
      return {
        id: c.id,
        nombre: c.nombre,
        kind: c.kind,
        ciudad: c.ciudad,
        estadoVe: c.estadoVe,
        needed_roles: needed,
        matchedRoles,
      };
    })
    .filter((c) => {
      if (c.matchedRoles.length > 0) return true;
      if (c.needed_roles.length === 0) return false;
      if (profile?.state && c.estadoVe && c.estadoVe === profile.state) return true;
      if ((profile?.zones ?? []).some((z) => c.ciudad?.toLowerCase().includes(z.toLowerCase()))) return true;
      return false;
    })
    .sort((a, b) => b.matchedRoles.length - a.matchedRoles.length)
    .slice(0, 10);

  const sendApplication = async () => {
    if (!profile || !applyingTo) return;
    setSubmitting(true);
    const { error } = await applyToCenter({
      centerId: applyingTo,
      userId: profile.id,
      message: message.trim() || undefined,
    });
    setSubmitting(false);
    if (error) {
      toast.error(`No se pudo postular: ${error}`);
      return;
    }
    toast.success("Postulación enviada — el coordinador será notificado");
    setApplyingTo(null);
    setMessage("");
    reloadApps();
  };

  const skillsHint =
    skills.length === 0
      ? "Agrega tus habilidades en el perfil para ver mejores sugerencias."
      : `Buscando centros que necesiten: ${skills.join(", ")}`;

  return (
    <PanelLayout
      expectedRoles={["voluntario", "voluntario_medico"]}
      title={
        profile?.role === "voluntario_medico"
          ? "Tu panel de voluntario médico"
          : "Tu panel de voluntario"
      }
      subtitle="Centros que necesitan tu perfil + tus postulaciones."
    >
      {profile && <ProfileFields profile={profile} />}

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-[18px]">Centros que te necesitan</h2>
        <p className="text-[12px] text-[var(--color-text-muted)]">{skillsHint}</p>

        {matched.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-6 text-center">
            <p className="text-[13px] text-[var(--color-text-muted)]">
              Aún no hay centros que coincidan con tus habilidades o zonas. Completa tu perfil arriba o revisa el directorio completo.
            </p>
            <Link
              to="/centros"
              className="inline-block mt-3 text-[13px] text-[var(--color-operational)] underline"
            >
              Ver todos los centros
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {matched.map((c) => {
              const alreadyApplied = appliedCenterIds.has(c.id);
              return (
                <li
                  key={c.id}
                  className="p-4 rounded-lg border-hair border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <Link
                        to="/centro/$id"
                        params={{ id: c.id }}
                        className="font-display font-semibold text-[15px] hover:underline"
                      >
                        {c.nombre}
                      </Link>
                      <div className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
                        {c.kind} · {c.ciudad}, {c.estadoVe}
                      </div>
                      {c.needed_roles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {c.needed_roles.map((r) => {
                            const matched = c.matchedRoles.includes(r);
                            return (
                              <span
                                key={r}
                                className="text-[11px] uppercase tracking-label px-1.5 py-0.5 rounded-sm border-hair"
                                style={{
                                  color: matched ? "var(--color-resolved)" : "var(--color-text-muted)",
                                  borderColor: matched ? "var(--color-resolved)" : "var(--color-border)",
                                }}
                              >
                                {r}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {alreadyApplied ? (
                        <span className="text-[12px] uppercase tracking-label text-[var(--color-text-muted)]">
                          Ya te postulaste
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setApplyingTo(c.id);
                            setMessage("");
                          }}
                          className="h-9 px-4 rounded-md bg-[var(--color-critical)] text-white text-[13px] font-display font-semibold"
                        >
                          Postularme
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <InvitationsSection myApps={myApps} reload={reloadApps} />

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-[18px]">
          Mis postulaciones ({myApps.filter((a) => a.initiated_by !== "center").length})
        </h2>
        {myApps.filter((a) => a.initiated_by !== "center").length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">
            Aún no has enviado postulaciones.
          </p>
        ) : (
          <div className="rounded-lg border-hair border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-[14px]">
              <thead className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
                <tr className="text-left">
                  <th className="px-3 py-2 font-normal">Centro</th>
                  <th className="px-3 py-2 font-normal">Fecha</th>
                  <th className="px-3 py-2 font-normal w-[140px]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {myApps.filter((a) => a.initiated_by !== "center").map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? "bg-[var(--color-surface-alt)]" : ""}>
                    <td className="px-3 py-2">
                      {a.center?.id ? (
                        <Link
                          to="/centro/$id"
                          params={{ id: a.center.id }}
                          className="hover:underline"
                        >
                          {a.center.name ?? "(sin nombre)"}
                        </Link>
                      ) : (
                        "(centro eliminado)"
                      )}
                      <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        {a.center?.type} · {[a.center?.city, a.center?.state].filter(Boolean).join(", ")}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[12px] font-mono text-[var(--color-text-muted)]">
                      {new Date(a.created_at).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {applyingTo && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50"
          role="dialog"
          aria-modal="true"
          onClick={() => setApplyingTo(null)}
        >
          <div
            className="bg-[var(--color-bg)] rounded-lg max-w-[480px] w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-semibold text-[18px]">Postularme a este centro</h3>
            <p className="text-[13px] text-[var(--color-text-muted)]">
              Cuéntale al coordinador cuándo puedes empezar o algo relevante sobre tu disponibilidad. Es opcional.
            </p>
            <TextArea
              placeholder="Disponibilidad, contacto preferente, etc."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApplyingTo(null)}
                className="h-10 px-4 rounded-md border-hair border-[var(--color-border)] text-[13px]"
                style={{ borderWidth: "0.5px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={sendApplication}
                disabled={submitting}
                className="h-10 px-5 rounded-md bg-[var(--color-critical)] text-white font-display font-semibold text-[14px] disabled:opacity-50"
              >
                {submitting ? "Enviando…" : "Enviar postulación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referencias inertes para evitar dead-code y mantener tipos */}
      <span className="hidden">{VOLUNTEER_ROLES.length}</span>
    </PanelLayout>
  );
}

function InvitationsSection({
  myApps,
  reload,
}: {
  myApps: Array<{
    id: string;
    initiated_by?: string;
    status: ApplicationStatus;
    message: string | null;
    created_at: string;
    center: { id: string; name: string | null; type: string | null; city: string | null; state: string | null } | null;
  }>;
  reload: () => void;
}) {
  const pending = myApps.filter((a) => a.initiated_by === "center" && a.status === "pendiente");
  const [busy, setBusy] = useState<string | null>(null);

  if (pending.length === 0) return null;

  const respond = async (id: string, status: ApplicationStatus) => {
    setBusy(id);
    const { error } = await updateApplicationStatus(id, status);
    setBusy(null);
    if (error) {
      toast.error(`No se pudo actualizar: ${error}`);
      return;
    }
    toast.success(status === "aceptada" ? "Invitación aceptada" : "Invitación rechazada");
    reload();
  };

  return (
    <section className="space-y-3">
      <h2 className="font-display font-semibold text-[18px]">
        Invitaciones recibidas ({pending.length})
      </h2>
      <p className="text-[12px] text-[var(--color-text-muted)] -mt-1">
        Centros que te invitaron a sumarte. Puedes aceptar o rechazar.
      </p>
      <div className="space-y-2">
        {pending.map((a) => (
          <article
            key={a.id}
            className="rounded-lg border-hair border-[var(--color-caution)] bg-[var(--color-surface)] p-4"
            style={{ borderLeftWidth: "3px" }}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                {a.center?.id ? (
                  <Link
                    to="/centro/$id"
                    params={{ id: a.center.id }}
                    className="font-display font-semibold text-[15px] hover:underline"
                  >
                    {a.center.name ?? "(sin nombre)"}
                  </Link>
                ) : (
                  <span className="font-display font-semibold text-[15px]">(centro eliminado)</span>
                )}
                <div className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
                  {a.center?.type} · {[a.center?.city, a.center?.state].filter(Boolean).join(", ")}
                </div>
                {a.message && (
                  <p className="mt-2 text-[13px] whitespace-pre-wrap">{a.message}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => respond(a.id, "aceptada")}
                  disabled={busy === a.id}
                  className="h-9 px-3 rounded-md bg-[var(--color-resolved)] text-white text-[13px] font-display font-semibold disabled:opacity-50"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  onClick={() => respond(a.id, "rechazada")}
                  disabled={busy === a.id}
                  className="h-9 px-3 rounded-md border-hair border-[var(--color-critical)] text-[var(--color-critical)] text-[13px] disabled:opacity-50"
                  style={{ borderWidth: "0.5px" }}
                >
                  Rechazar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: ApplicationStatus }) {
  const color =
    status === "aceptada"
      ? "var(--color-resolved)"
      : status === "rechazada"
      ? "var(--color-text-muted)"
      : "var(--color-caution)";
  return (
    <span
      className="text-[11px] uppercase tracking-label px-2 py-0.5 rounded-sm border-hair"
      style={{ color, borderColor: color }}
    >
      {status}
    </span>
  );
}
