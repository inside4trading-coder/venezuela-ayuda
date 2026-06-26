import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { Center } from "@/data/mock";
import { StatusPill, statusBorderColor } from "@/components/ui-vh/StatusPill";
import { KindBadge } from "@/components/ui-vh/KindBadge";
import { KindMetric } from "@/components/ui-vh/KindMetric";
import { NeedTag } from "@/components/ui-vh/NeedTag";

export function CenterCard({ center: c }: { center: Center }) {
  return (
    <article
      className="bg-[var(--color-surface)] border-hair border-[var(--color-border)] rounded-lg p-4 flex flex-col gap-3"
      style={{ borderLeft: `2px solid ${statusBorderColor(c.estado)}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <KindBadge kind={c.kind} />
        <div className="flex items-center gap-2">
          <StatusPill status={c.estado} />
          <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
            {c.actualizadoHaceMin}m
          </span>
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-[15px] leading-snug text-[var(--color-text-main)]">
          {c.nombre}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-[13px] text-[var(--color-text-muted)]">
          <MapPin className="h-3 w-3" />
          <span>
            {c.ciudad}, {c.estadoVe}
          </span>
        </div>
      </div>

      <div className="h-px bg-[var(--color-border)]" />

      <KindMetric center={c} />

      {c.tieneUrgente.length > 0 && (
        <div>
          <div className="text-[11px] tracking-label uppercase text-[var(--color-text-muted)] mb-1.5">
            Necesita urgente
          </div>
          <div className="flex flex-wrap gap-1">
            {c.tieneUrgente.slice(0, 3).map((n) => (
              <NeedTag key={n}>{n}</NeedTag>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1 mt-auto">
        <Link
          to="/centro/$id"
          params={{ id: c.id }}
          className="flex-1 text-center text-[13px] px-3 py-2 rounded-md bg-[var(--color-operational)] text-white hover:opacity-90"
        >
          Enviar ayuda
        </Link>
        <Link
          to="/centro/$id"
          params={{ id: c.id }}
          className="flex-1 text-center text-[13px] px-3 py-2 rounded-md border-hair border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)]"
          style={{ borderWidth: "0.5px" }}
        >
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
