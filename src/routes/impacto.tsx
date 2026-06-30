import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useImpact } from "@/hooks/useImpact";
import { CENTER_KINDS } from "@/data/mock";

export const Route = createFileRoute("/impacto")({
  head: () => ({
    meta: [
      { title: "Panel de impacto · Venezuela Ayuda" },
      {
        name: "description",
        content:
          "Métricas en vivo de la respuesta humanitaria coordinada tras el terremoto del 24 de junio de 2026.",
      },
    ],
  }),
  component: ImpactPage,
});

const SHARE_TEXT =
  "Venezuela Ayuda: registro en vivo de sobrevivientes del sismo y coordinación de centros de ayuda. Busca a tus familiares o suma tu apoyo → venezuela-ayuda.vercel.app";

function formatHace(min: number): string {
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return `hace ${h} h`;
}

function ImpactPage() {
  const { metrics, topDemand, recentActivity, porTipo } = useImpact();
  const max = Math.max(...topDemand.map((d) => d.total));

  const share = (url: string) => window.open(url, "_blank", "noopener");

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-12">
      <header>
        <h1 className="font-display font-semibold text-[28px] leading-tight mb-1">
          Panel de impacto
        </h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Lo que la red ha logrado coordinar en las últimas semanas.
        </p>
      </header>

      {/* Tira de KPIs — misma información que el hero del main */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-[var(--color-border)] rounded-xl overflow-hidden divide-x divide-[var(--color-border)]">
        {/* Centros activos */}
        <div className="px-6 py-5 space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Centros activos
          </div>
          <div className="font-display font-bold text-[36px] sm:text-[44px] leading-none text-[var(--color-text-main)]">
            {metrics.centrosActivos.toLocaleString("es-VE")}
          </div>
        </div>

        {/* Sobrevivientes */}
        <div className="px-6 py-5 space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Sobrevivientes
          </div>
          <div className="font-display font-bold text-[36px] sm:text-[44px] leading-none text-[var(--color-text-main)]">
            {metrics.sobrevivientes.toLocaleString("es-VE")}
          </div>
        </div>

        {/* A salvo / Reunidas */}
        <div className="px-6 py-5 space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            A salvo / Reunidas
          </div>
          <div className="font-display font-bold text-[36px] sm:text-[44px] leading-none text-emerald-600 dark:text-emerald-400">
            {(metrics.sobrevivientesASalvoExternos ?? 0).toLocaleString("es-VE")}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] font-mono">
            Red ayudaavzla.com
          </div>
        </div>

        {/* En búsqueda */}
        <div className="px-6 py-5 space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            En búsqueda
          </div>
          <div className="font-display font-bold text-[36px] sm:text-[44px] leading-none text-amber-600 dark:text-amber-400">
            {(metrics.sobrevivientesBuscandoExternos ?? 0).toLocaleString("es-VE")}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] font-mono">
            Red ayudaavzla.com
          </div>
        </div>
      </section>




      <section>
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-y border-hair border-[var(--color-border)] py-3 font-mono text-[12px] text-[var(--color-text-muted)]">
          {CENTER_KINDS.map((k) => (
            <span key={k.id} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: `var(${k.colorVar})` }}
              />
              <span className="text-[var(--color-text-main)]">{porTipo[k.id].total}</span>
              <span>{k.plural.toLowerCase()}</span>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-[22px] mb-5">Por tipo de operación</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {CENTER_KINDS.map((k) => {
            const stat = porTipo[k.id];
            return (
              <div
                key={k.id}
                className="bg-[var(--color-surface)] border-hair border-[var(--color-border)] rounded-lg p-4"
                style={{ borderLeft: `2px solid var(${k.colorVar})` }}
              >
                <div
                  className="font-mono text-[11px] tracking-label uppercase mb-3"
                  style={{ color: `var(${k.colorVar})` }}
                >
                  {k.short} · {k.plural}
                </div>
                <div className="font-display font-semibold text-[28px] leading-none">
                  {stat.metricaValor.toLocaleString("es-VE")}
                </div>
                <div className="mt-2 text-[12px] text-[var(--color-text-muted)] leading-tight">
                  {stat.metricaLabel}
                </div>
                <div className="mt-3 pt-3 border-t border-hair border-[var(--color-border)] text-[12px] text-[var(--color-text-muted)] font-mono">
                  {stat.total} centros activos
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-[22px] mb-5">Ítems más solicitados</h2>
        <div className="space-y-2.5">
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
              <div className="w-14 text-right font-mono text-[13px]">{d.total}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-[22px] mb-5">Actividad reciente</h2>
        <div className="rounded-lg overflow-hidden border-hair border-[var(--color-border)]">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
                <th className="px-4 py-2 font-normal">Centro</th>
                <th className="px-4 py-2 font-normal">Acción</th>
                <th className="px-4 py-2 font-normal text-right">Cuándo</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((a, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[var(--color-surface-alt)]" : ""}>
                  <td className="px-4 py-3">{a.centro}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{a.accion}</td>
                  <td className="px-4 py-3 text-right font-mono text-[13px]">
                    {formatHace(a.haceMin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-[22px] mb-3">Comparte</h2>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
          Cada compartida lleva voluntarios y donaciones a los centros que más lo necesitan.
        </p>
        <div className="flex flex-wrap gap-2">
          <ShareBtn
            label="WhatsApp"
            color="#25D366"
            onClick={() =>
              share(`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`)
            }
          />
          <ShareBtn
            label="Telegram"
            color="#229ED9"
            onClick={() =>
              share(
                `https://t.me/share/url?url=${encodeURIComponent("https://venezuelaayuda.com")}&text=${encodeURIComponent(SHARE_TEXT)}`,
              )
            }
          />
          <ShareBtn
            label="X / Twitter"
            color="#111111"
            onClick={() =>
              share(`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}`)
            }
          />
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(SHARE_TEXT);
                toast.success("Enlace copiado al portapapeles");
              } catch {
                toast("No pudimos copiar — selecciona el texto manualmente");
              }
            }}
            className="text-[13px] px-3 py-2 rounded-md border-hair border-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)]"
            style={{ borderWidth: "0.5px" }}
          >
            Copiar enlace
          </button>
        </div>
      </section>
    </div>
  );
}

function Metric({ n, l }: { n: number | string; l: string }) {
  return (
    <div>
      <div className="font-display font-semibold text-[40px] sm:text-[48px] leading-none text-[var(--color-text-main)]">
        {n}
      </div>
      <div className="mt-2 text-[13px] text-[var(--color-text-muted)]">{l}</div>
    </div>
  );
}

function ShareBtn({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[13px] px-3 py-2 rounded-md text-white hover:opacity-90"
      style={{ background: color }}
    >
      {label}
    </button>
  );
}
