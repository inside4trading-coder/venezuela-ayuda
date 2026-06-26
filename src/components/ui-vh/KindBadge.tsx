import { KIND_BY_ID, type CenterKind } from "@/data/mock";

export function KindBadge({
  kind,
  long = false,
}: {
  kind: CenterKind;
  long?: boolean;
}) {
  const meta = KIND_BY_ID[kind];
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

export function kindBorderColor(kind: CenterKind): string {
  return `var(${KIND_BY_ID[kind].colorVar})`;
}
