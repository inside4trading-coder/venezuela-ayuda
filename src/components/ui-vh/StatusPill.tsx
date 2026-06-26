import type { CenterStatus } from "@/data/mock";

const MAP: Record<CenterStatus, { label: string; color: string; border: string }> = {
  urgente: { label: "URG", color: "text-[var(--color-critical)]", border: "border-[var(--color-critical)]" },
  activo: { label: "OK", color: "text-[var(--color-resolved)]", border: "border-[var(--color-resolved)]" },
  "capacidad-llena": { label: "FULL", color: "text-[var(--color-caution)]", border: "border-[var(--color-caution)]" },
  cerrado: { label: "CER", color: "text-[var(--color-text-muted)]", border: "border-[var(--color-border)]" },
};

const LONG: Record<CenterStatus, string> = {
  urgente: "Urgente",
  activo: "Activo",
  "capacidad-llena": "Capacidad llena",
  cerrado: "Cerrado",
};

export function StatusPill({ status, long = false }: { status: CenterStatus; long?: boolean }) {
  const cfg = MAP[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-hair ${cfg.border} ${cfg.color} px-1.5 py-0.5 text-[11px] font-medium tracking-label uppercase rounded-sm`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full bg-current`} />
      {cfg.label}
      {long && <span className="normal-case tracking-normal text-text-main ml-1">· {LONG[status]}</span>}
    </span>
  );
}

export function statusBorderColor(status: CenterStatus): string {
  switch (status) {
    case "urgente":
      return "var(--color-critical)";
    case "activo":
      return "var(--color-resolved)";
    case "capacidad-llena":
      return "var(--color-caution)";
    case "cerrado":
      return "var(--color-border)";
  }
}
