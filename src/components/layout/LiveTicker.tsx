import { useLiveStats, statsToTickerItems } from "@/hooks/useLiveStats";

const FALLBACK = ["Cargando estado en vivo…"];

function Segment({ items }: { items: string[] }) {
  return (
    <>
      <span className="vh-pulse-dot mx-6 text-[var(--color-critical)]">●</span>
      <span className="mr-6 tracking-label">EN VIVO</span>
      {items.map((t, i) => (
        <span key={i} className="mr-6">
          {t}
          {i < items.length - 1 && (
            <span className="ml-6 text-[var(--color-text-muted)]">·</span>
          )}
        </span>
      ))}
    </>
  );
}

export function LiveTicker() {
  const stats = useLiveStats();
  const items = stats ? statsToTickerItems(stats) : FALLBACK;

  return (
    <div
      className="fixed top-0 inset-x-0 z-50 h-8 bg-[#111] text-[#f7f7f5] overflow-hidden flex items-center"
      role="status"
      aria-live="off"
    >
      <div className="vh-marquee-track font-mono text-[12px]">
        <span className="inline-flex items-center pr-12">
          <Segment items={items} />
        </span>
        <span className="inline-flex items-center pr-12" aria-hidden="true">
          <Segment items={items} />
        </span>
      </div>
    </div>
  );
}
