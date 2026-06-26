const ITEMS = [
  "47 albergues alojan 2.840 familias",
  "23 acopios movieron 18.400 items esta semana",
  "12 puntos médicos · 4.120 atenciones / sem",
  "8 cocinas reparten 6.800 raciones / día",
  "6 rutas activas en última milla",
  "Última actualización: hace 2 min",
];

function Segment() {
  return (
    <>
      <span className="vh-pulse-dot mx-6 text-[var(--color-critical)]">●</span>
      <span className="mr-6 tracking-label">EN VIVO</span>
      {ITEMS.map((t, i) => (
        <span key={i} className="mr-6">
          {t}
          {i < ITEMS.length - 1 && <span className="ml-6 text-[var(--color-text-muted)]">·</span>}
        </span>
      ))}
    </>
  );
}

export function LiveTicker() {
  return (
    <div
      className="fixed top-0 inset-x-0 z-50 h-8 bg-[#111] text-[#f7f7f5] overflow-hidden flex items-center"
      role="status"
      aria-live="off"
    >
      <div className="vh-marquee-track font-mono text-[12px]">
        <span className="inline-flex items-center pr-12">
          <Segment />
        </span>
        <span className="inline-flex items-center pr-12" aria-hidden="true">
          <Segment />
        </span>
      </div>
    </div>
  );
}
