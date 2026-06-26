import { Link } from "@tanstack/react-router";
import { useImpact } from "@/hooks/useImpact";

export function ImpactStrip() {
  const { metrics, topDemand } = useImpact();

  return (
    <section className="border-b border-hair border-[var(--color-border)]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-label text-[var(--color-text-muted)] mb-3">
              Impacto en vivo
            </p>
            <h2 className="font-display font-semibold text-[28px] sm:text-[32px] leading-tight">
              Lo que está pasando ahora mismo.
            </h2>
          </div>
          <Link
            to="/impacto"
            className="text-[14px] text-[var(--color-text-main)] border-b border-[var(--color-text-main)] pb-0.5 hover:text-[var(--color-critical)] hover:border-[var(--color-critical)]"
            style={{ borderBottomWidth: "0.5px" }}
          >
            Ver desglose completo →
          </Link>
        </div>

        <dl className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)] border-hair border-[var(--color-border)] rounded-lg overflow-hidden">
          {[
            { l: "Centros activos", v: metrics.centrosActivos },
            { l: "Familias atendidas", v: metrics.familiasAtendidas.toLocaleString("es-VE") },
            { l: "Voluntarios", v: metrics.voluntarios },
            { l: "Estados cubiertos", v: metrics.estados },
          ].map((m) => (
            <div key={m.l} className="bg-[var(--color-surface)] p-5">
              <dt className="font-mono text-[10px] uppercase tracking-label text-[var(--color-text-muted)]">
                {m.l}
              </dt>
              <dd className="font-display text-[28px] font-semibold mt-1">{m.v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-label text-[var(--color-text-muted)] mb-3">
            Lo más solicitado hoy
          </p>
          <ul className="flex flex-wrap gap-2">
            {topDemand.slice(0, 6).map((d) => (
              <li
                key={d.nombre}
                className="text-[13px] px-2.5 py-1 border-hair border-[var(--color-border)] rounded-sm bg-[var(--color-surface)]"
                style={{ borderWidth: "0.5px" }}
              >
                {d.nombre}{" "}
                <span className="text-[var(--color-text-muted)] font-mono ml-1">{d.total}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
