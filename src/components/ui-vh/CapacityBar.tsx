export function CapacityBar({ pct, showLabel = true }: { pct: number; showLabel?: boolean }) {
  const color =
    pct >= 90
      ? "var(--color-critical)"
      : pct >= 60
        ? "var(--color-caution)"
        : "var(--color-resolved)";
  return (
    <div className="w-full">
      <div className="h-1.5 w-full rounded-sm bg-[var(--color-surface-alt)] overflow-hidden">
        <div
          className="h-full rounded-sm transition-none"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 font-mono text-[11px] text-[var(--color-text-muted)]">
          {pct}% capacidad
        </div>
      )}
    </div>
  );
}
