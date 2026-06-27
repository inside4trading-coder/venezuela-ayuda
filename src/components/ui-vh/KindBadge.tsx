import { KIND_BY_ID, type CenterKind } from "@/data/mock";

export function KindBadge({
  kind,
  long = false,
}: {
  kind: CenterKind | null | undefined;
  long?: boolean;
}) {
  const meta = kind ? KIND_BY_ID[kind] : undefined;
  // Fallback para centros con type null o tipo desconocido (post-relajación de obligatorios)
  if (!meta) {
    return (
      <span
        className="inline-flex items-center gap-1.5 border-hair px-1.5 py-0.5 text-[11px] font-medium tracking-label uppercase rounded-sm font-mono text-[var(--color-text-muted)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        SIN TIPO
        {long && (
          <span className="normal-case tracking-normal ml-1 font-sans">
            · Sin clasificar
          </span>
        )}
      </span>
    );
  }
  const color = `var(${meta.colorVar})`;
  return (
    <span
      className="inline-flex items-center gap-1.5 border-hair px-1.5 py-0.5 text-[11px] font-medium tracking-label uppercase rounded-sm font-mono"
      style={{ borderColor: color, color }}
    >
      {meta.short}
      {long && (
        <span className="normal-case tracking-normal text-[var(--color-text-main)] ml-1 font-sans">
          · {meta.label}
        </span>
      )}
    </span>
  );
}

export function kindBorderColor(kind: CenterKind | null | undefined): string {
  const meta = kind ? KIND_BY_ID[kind] : undefined;
  return meta ? `var(${meta.colorVar})` : "var(--color-border)";
}
