import { createFileRoute, Link } from "@tanstack/react-router";
import { useImpact } from "@/hooks/useImpact";
import { useCenters } from "@/hooks/useCenters";

export const Route = createFileRoute("/necesidades")({
  head: () => ({
    meta: [
      { title: "Necesidades agregadas \u00b7 Venezuela Ayuda" },
      { name: "description", content: "Lo que la red completa necesita ahora mismo." },
    ],
  }),
  component: NeedsPage,
});

const NIVEL_LABEL: Record<string, string> = {
  critico: "CR\u00cdTICO",
  alto: "URGENTE",
  medio: "",
  bajo: "",
};

const NIVEL_COLOR: Record<string, string> = {
  critico: "#b91c1c",
  alto: "#b45309",
  medio: "",
  bajo: "",
};

function NeedsPage() {
  const { topDemand } = useImpact();
  const { centers, isLoading } = useCenters();
  const max = Math.max(...topDemand.map((d) => d.total), 1);

  const critical = centers.filter((c) =>
    c.necesita.some((n) => n.nivel === "critico" || n.nivel === "alto")
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-10">
      <header>
        <h1 className="font-display font-semibold text-[28px] leading-tight mb-1">
          Necesidades agregadas
        </h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Cu\u00e1ntos centros piden cada \u00edtem ahora mismo.
        </p>
      </header>

      <section className="space-y-2.5">
        {topDemand.length === 0 && !isLoading && (
          <p className="text-[14px] text-[var(--color-text-muted)]">Sin datos de necesidades todav\u00eda.</p>
        )}
        {topDemand.map((d) => {
          const nivelLabel = NIVEL_LABEL[d.nivel ?? ""] ?? "";
          const nivelColor = NIVEL_COLOR[d.nivel ?? ""] ?? "";
          const barColor = nivelColor || "var(--color-critical)";
          return (
            <div key={d.nombre} className="flex items-center gap-4">
              <div className="w-52 sm:w-64 shrink-0 flex items-center gap-2">
                <span className="text-[14px]">{d.nombre}</span>
                {nivelLabel && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: nivelColor + "22", color: nivelColor }}
                  >
                    {nivelLabel}
                  </span>
                )}
              </div>
              <div className="flex-1 h-5 bg-[var(--color-surface-alt)] rounded-sm overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${(d.total / max) * 100}%`,
                    background: barColor,
                  }}
                />
              </div>
              <div className="w-20 text-right font-mono text-[13px]">{d.total} centros</div>
            </div>
          );
        })}
      </section>

      <section>
        <h2 className="font-display font-semibold text-[22px] mb-4">
          Centros con necesidades cr\u00edticas o urgentes
        </h2>

        {isLoading ? (
          <p className="text-[14px] text-[var(--color-text-muted)]">Cargando\u2026</p>
        ) : critical.length === 0 ? (
          <p className="text-[14px] text-[var(--color-text-muted)]">No hay centros con necesidades cr\u00edticas o urgentes registradas.</p>
        ) : (
          <div className="rounded-lg overflow-hidden border-hair border-[var(--color-border)]">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
                  <th className="px-4 py-2 font-normal">Centro</th>
                  <th className="px-4 py-2 font-normal">Ubicaci\u00f3n</th>
                  <th className="px-4 py-2 font-normal">Necesita</th>
                </tr>
              </thead>
              <tbody>
                {critical.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-[var(--color-surface-alt)]" : ""}>
                    <td className="px-4 py-3">
                      <Link
                        to="/centro/$id"
                        params={{ id: c.id }}
                        className="hover:text-[var(--color-operational)] hover:underline"
                      >
                        {c.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {c.ciudad}, {c.estadoVe}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.necesita
                          .filter((n) => n.nivel === "critico" || n.nivel === "alto")
                          .map((n) => (
                            <span
                              key={n.nombre}
                              className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                              style={{
                                background: (NIVEL_COLOR[n.nivel] ?? "#b91c1c") + "22",
                                color: NIVEL_COLOR[n.nivel] ?? "#b91c1c",
                              }}
                            >
                              {n.nombre}
                            </span>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
