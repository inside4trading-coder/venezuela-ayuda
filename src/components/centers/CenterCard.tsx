import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { Center } from "@/data/mock";
import { StatusPill, statusBorderColor } from "@/components/ui-vh/StatusPill";
import { KindBadge } from "@/components/ui-vh/KindBadge";

const NIVEL_STYLES: Record<string, { tag: string; label: string }> = {
  critico: {
    tag: "border-[var(--color-critical)] text-[var(--color-critical)] bg-[color-mix(in_oklab,var(--color-critical)_8%,transparent)]",
    label: "CRÍTICO",
  },
  alto: {
    tag: "border-[var(--color-warning,#b45309)] text-[var(--color-warning,#b45309)] bg-[color-mix(in_oklab,var(--color-warning,#b45309)_8%,transparent)]",
    label: "URGENTE",
  },
  medio: {
    tag: "border-[var(--color-border)] text-[var(--color-text-muted)] bg-transparent",
    label: "",
  },
  bajo: {
    tag: "border-[var(--color-border)] text-[var(--color-text-muted)] bg-transparent",
    label: "",
  },
};

export function CenterCard({ center: c }: { center: Center }) {
  const criticas = c.necesita.filter((n) => n.nivel === "critico");
  const altas = c.necesita.filter((n) => n.nivel === "alto");
  const resto = c.necesita.filter(
    (n) => n.nivel !== "critico" && n.nivel !== "alto"
  );

  const hayNecesidades = c.necesita.length > 0;

  return (
    <article
      className="bg-[var(--color-surface)] border-hair border-[var(--color-border)] rounded-lg p-4 flex flex-col gap-3"
      style={{ borderLeft: `2px solid ${statusBorderColor(c.estado)}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <KindBadge kind={c.kind} />
        <div className="flex items-center gap-2">
          <StatusPill status={c.estado} />
          <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
            {c.actualizadoHaceMin}m
          </span>
        </div>
      </div>

      {/* Nombre y ubicación */}
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

      {/* Necesidades */}
      {!hayNecesidades ? (
        <p className="text-[12px] text-[var(--color-text-muted)] italic">
          Sin necesidades registradas
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Críticas */}
          {criticas.length > 0 && (
            <div>
              <div className="text-[11px] tracking-widest uppercase text-[var(--color-critical)] font-medium mb-1.5">
                Crítico
              </div>
              <div className="flex flex-wrap gap-1">
                {criticas.map((n) => (
                  <span
                    key={n.nombre}
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-normal ${NIVEL_STYLES.critico.tag}`}
                    style={{ borderWidth: "0.5px" }}
                  >
                    {n.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Urgentes / alto */}
          {altas.length > 0 && (
            <div>
              <div className="text-[11px] tracking-widest uppercase text-[var(--color-warning,#b45309)] font-medium mb-1.5">
                Urgente
              </div>
              <div className="flex flex-wrap gap-1">
                {altas.map((n) => (
                  <span
                    key={n.nombre}
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-normal ${NIVEL_STYLES.alto.tag}`}
                    style={{ borderWidth: "0.5px" }}
                  >
                    {n.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Medio / bajo */}
          {resto.length > 0 && (
            <div>
              <div className="text-[11px] tracking-widest uppercase text-[var(--color-text-muted)] mb-1.5">
                También necesita
              </div>
              <div className="flex flex-wrap gap-1">
                {resto.slice(0, 4).map((n) => (
                  <span
                    key={n.nombre}
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-normal ${NIVEL_STYLES.medio.tag}`}
                    style={{ borderWidth: "0.5px" }}
                  >
                    {n.nombre}
                  </span>
                ))}
                {resto.length > 4 && (
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] text-[var(--color-text-muted)]" style={{ borderWidth: "0.5px" }}>
                    +{resto.length - 4} más
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
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
