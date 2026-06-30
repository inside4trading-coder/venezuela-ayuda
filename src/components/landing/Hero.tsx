import { Link } from "@tanstack/react-router";
import { useImpactContext } from "@/context/ImpactContext";

export function Hero() {
  const { metrics } = useImpactContext();
  return (
    <section className="border-b border-hair border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h1 className="font-display font-semibold text-[40px] sm:text-[56px] leading-[1.05] tracking-tight max-w-[18ch]">
          Coordinar la ayuda en tiempo real.
        </h1>
        <p className="mt-5 text-[17px] sm:text-[19px] text-[var(--color-text-muted)] max-w-[60ch] leading-snug">
          Venezuela Ayuda conecta a quien necesita con quien puede dar. Ves qué falta hoy, en qué
          centro, y llegas con lo correcto.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/rescatados"
            className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-[var(--color-critical)] text-white text-[15px]"
          >
            Ver rescatados
          </Link>
          <Link
            to="/registrar-centro"
            className="inline-flex items-center justify-center px-5 py-3 rounded-md border-hair border-[var(--color-text-main)] text-[15px] text-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)]"
            style={{ borderWidth: "0.5px" }}
          >
            Registrar un centro
          </Link>
        </div>

        <dl className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 border-t border-hair border-[var(--color-border)] pt-6">
          {[
            {
              l: "Centros activos",
              v: metrics.centrosActivos.toLocaleString("es-VE"),
              to: "/centros",
            },
            {
              l: "Sobrevivientes",
              v: metrics.sobrevivientes.toLocaleString("es-VE"),
              to: "/rescatados",
            },
            {
              l: "A salvo / reunidas",
              v: (metrics.sobrevivientesASalvoExternos ?? 0).toLocaleString("es-VE"),
              sub: "Red ayudaavzla.com",
              color: "text-emerald-600 dark:text-emerald-400",
              to: "/rescatados",
            },
            {
              l: "En búsqueda",
              v: (metrics.sobrevivientesBuscandoExternos ?? 0).toLocaleString("es-VE"),
              sub: "Red ayudaavzla.com",
              color: "text-amber-600 dark:text-amber-400",
              to: "/rescatados",
            },
          ].map((m) => {
            const content = (
              <>
                <dt className="font-mono text-[10px] uppercase tracking-label text-[var(--color-text-muted)] group-hover:text-[var(--color-text-main)] transition-colors">
                  {m.l}
                </dt>
                <dd className={`font-display text-[24px] font-semibold mt-1 ${m.color || ""}`}>{m.v}</dd>
                {m.sub && (
                  <span className="text-[11px] text-[var(--color-text-muted)] mt-0.5 block font-sans">
                    {m.sub}
                  </span>
                )}
              </>
            );
            return m.to ? (
              <Link key={m.l} to={m.to} className="block group">
                {content}
              </Link>
            ) : (
              <div key={m.l}>
                {content}
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
