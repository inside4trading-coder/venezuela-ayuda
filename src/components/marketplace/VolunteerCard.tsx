import { useState } from "react";
import { toast } from "sonner";
import { Stethoscope, User } from "lucide-react";
import type { PublicVolunteer } from "@/hooks/useVolunteersMarket";
import { useInviteVolunteer } from "@/hooks/useVolunteersMarket";
import { TextArea } from "@/components/ui-vh/Field";

interface Props {
  volunteer: PublicVolunteer;
  /** Skills del visitante para destacar matches */
  highlightSkills?: string[];
  /** Rol del visitante */
  viewerRole?: string | null;
  /** Si el visitante es coordinador, el id del centro al que puede invitar */
  centerIdForInvite?: string | null;
  /** True si esta card representa al visitante mismo */
  isSelf?: boolean;
}

export function VolunteerCard({
  volunteer,
  highlightSkills = [],
  viewerRole,
  centerIdForInvite,
  isSelf,
}: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { invite, busy } = useInviteVolunteer();
  const [sent, setSent] = useState(false);

  const isMedical = volunteer.role === "voluntario_medico";
  const Icon = isMedical ? Stethoscope : User;

  const onSend = async () => {
    if (!centerIdForInvite) return;
    const { error } = await invite({
      userId: volunteer.id,
      centerId: centerIdForInvite,
      message: message.trim() || undefined,
    });
    if (error) {
      toast.error(`No se pudo invitar: ${error}`);
      return;
    }
    toast.success("Invitación enviada");
    setSent(true);
    setOpen(false);
  };

  const ubic = [volunteer.city, volunteer.state].filter(Boolean).join(", ") || "Ubicación no indicada";

  return (
    <article className="rounded-lg border-hair border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: isMedical
              ? "color-mix(in oklab, var(--color-critical) 12%, transparent)"
              : "var(--color-surface-alt)",
            color: isMedical ? "var(--color-critical)" : "var(--color-text-main)",
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold text-[15px] truncate">
            {volunteer.full_name ?? "Voluntario"}
            {isSelf && (
              <span className="ml-2 text-[10px] uppercase tracking-label text-[var(--color-text-muted)]">
                (tú)
              </span>
            )}
          </div>
          <div className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
            {isMedical ? "Voluntario médico" : "Voluntario general"} · {ubic}
          </div>
        </div>
      </div>

      {volunteer.skills.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {volunteer.skills.map((s) => {
            const matched = highlightSkills.includes(s);
            return (
              <span
                key={s}
                className="text-[10px] uppercase tracking-label px-1.5 py-0.5 rounded-sm border-hair"
                style={{
                  color: matched ? "var(--color-resolved)" : "var(--color-text-muted)",
                  borderColor: matched ? "var(--color-resolved)" : "var(--color-border)",
                }}
              >
                {s}
              </span>
            );
          })}
        </div>
      ) : (
        <span
          className="self-start text-[10px] uppercase tracking-label px-1.5 py-0.5 rounded-sm border-hair italic"
          style={{
            color: "var(--color-text-muted)",
            borderColor: "var(--color-border)",
            opacity: 0.7,
          }}
        >
          Skills no especificados
        </span>
      )}

      {viewerRole === "coordinador" && centerIdForInvite && !isSelf && (
        <>
          {sent ? (
            <div className="text-[12px] text-[var(--color-resolved)]">Invitación enviada</div>
          ) : !open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="h-9 px-3 rounded-md border-hair border-[var(--color-text-main)] text-[13px] hover:bg-[var(--color-surface-alt)]"
              style={{ borderWidth: "0.5px" }}
            >
              Invitar a mi centro
            </button>
          ) : (
            <div className="space-y-2 pt-2 border-t border-hair border-[var(--color-border)]">
              <TextArea
                placeholder="Mensaje opcional (qué buscas, cuándo, etc.)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-8 px-3 text-[12px] rounded-md border-hair border-[var(--color-border)]"
                  style={{ borderWidth: "0.5px" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onSend}
                  disabled={busy}
                  className="h-8 px-3 text-[12px] rounded-md bg-[var(--color-critical)] text-white font-display font-semibold disabled:opacity-50"
                >
                  {busy ? "Enviando…" : "Enviar invitación"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}
