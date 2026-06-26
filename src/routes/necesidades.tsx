import { createFileRoute, Link } from "@tanstack/react-router";
import { useImpact } from "@/hooks/useImpact";
import { CENTERS } from "@/data/mock";

export const Route = createFileRoute("/necesidades")({
  head: () => ({
    meta: [
      { title: "Necesidades agregadas · Venezuela Ayuda" },
      { name: "description", content: "Lo que la red completa necesita ahora mismo." },
    ],
  }),
  component: NeedsPage,
});

function NeedsPage() {
  const { topDemand } = useImpact();
  const max = Math.max(...topDemand.map((d) => d.total));

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-10">
      <header>
        <h1 className="font-display font-semibold text-[28px] leading-tight mb-1">
          Necesidades agregadas
        </h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Cuántos centros piden cada ítem ahora mismo.
        </p>
      </header>

      <section className="space-y-2.5">
        {topDemand.map((d) => (
          <div key={d.nombre} className="flex items-center gap-4">
            <div className="w-44 sm:w-56 shrink-0 text-[14px]">{d.nombre}</div>
            <div className="flex-1 h-5 bg-[var(--color-surface-alt)] rounded-sm overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${(d.total / max) * 100}%`,
                  background: "var(--color-critical)",
                }}
              />
            </div>
            <div className="w-20 text-right font-mono text-[13px]">{d.total} centros</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display font-semibold text-[22px] mb-4">
          Centros con necesidades críticas
        </h2>
        <div className="rounded-lg overflow-hidden border-hair border-[var(--color-border)]">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
                <th className="px-4 py-2 font-normal">Centro</th>
                <th className="px-4 py-2 font-normal">Ubicación</th>
                <th className="px-4 py-2 font-normal">Necesita</th>
              </tr>
            </thead>
            <tbody>
              {CENTERS.filter((c) => c.necesita.some((n) => n.nivel === "critico")).map((c, i) => (
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
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {c.necesita
                      .filter((n) => n.nivel === "critico")
                      .map((n) => n.nombre)
                      .join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
