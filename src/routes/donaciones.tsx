import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/donaciones/CopyButton";
import {
  SOLO_FE,
  CONCEPTO_OBLIGATORIO,
  METODOS_PAGO,
} from "@/data/donaciones";

export const Route = createFileRoute("/donaciones")({
  head: () => ({
    meta: [
      { title: "Donaciones · Venezuela Ayuda" },
      {
        name: "description",
        content:
          "Apoya a las víctimas del sismo en Venezuela. Donaciones canalizadas por Organización Solo Fe vía Pago Móvil, Zelle y Binance.",
      },
    ],
  }),
  component: DonacionesPage,
});

const SHARE_URL = "https://venezuela-ayuda.vercel.app/donaciones";
const SHARE_TEXT =
  "Apoya a las víctimas del sismo en Venezuela. Donaciones canalizadas por @organizacionsolofe → ";

function share(channel: "whatsapp" | "telegram" | "twitter") {
  const text = encodeURIComponent(SHARE_TEXT + SHARE_URL);
  const urls = {
    whatsapp: `https://wa.me/?text=${text}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}`,
  };
  window.open(urls[channel], "_blank", "noopener");
}

function DonacionesPage() {
  const handleCopyAllUrl = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-10">
      <header className="text-center space-y-3 max-w-[760px] mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-alt)] border-hair border-[var(--color-border)] text-[11px] uppercase tracking-label text-[var(--color-text-muted)] font-mono">
          <img
            src="/solo-fe-logo.png"
            alt=""
            aria-hidden="true"
            className="h-4 w-4 rounded-full object-cover"
          />
          Alianza con Organización Solo Fe
        </div>
        <h1 className="font-display font-semibold text-[32px] sm:text-[40px] leading-tight tracking-tight">
          Dona y suma a la red
        </h1>
        <p className="text-[15px] text-[var(--color-text-muted)]">
          Las donaciones monetarias son recibidas y distribuidas por{" "}
          <a
            href={SOLO_FE.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-text-main)] underline decoration-dotted hover:decoration-solid"
          >
            Organización Solo Fe
          </a>
          , aliados verificados que están en tierra apoyando a las víctimas del
          sismo en Venezuela.
        </p>
      </header>

      <section
        className="rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 sm:p-5"
      >
        <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[13px] sm:text-[14px] text-amber-900 dark:text-amber-100">
              <strong>Imprescindible:</strong> agrega el concepto{" "}
              <span className="font-mono font-bold">{CONCEPTO_OBLIGATORIO}</span>{" "}
              en cada transferencia. Sin él, la donación es muy difícil de ubicar.
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(CONCEPTO_OBLIGATORIO);
                toast.success(`Copiado: ${CONCEPTO_OBLIGATORIO}`);
              } catch {
                toast.error("No se pudo copiar");
              }
            }}
            className="shrink-0 px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-medium whitespace-nowrap"
          >
            Copiar concepto
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {METODOS_PAGO.map((m) => (
          <article
            key={m.id}
            className="rounded-lg border-hair border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden flex flex-col"
            style={{ borderWidth: "0.5px" }}
          >
            <header
              className="px-5 py-3 font-display font-semibold text-[16px]"
              style={{ background: m.accent, color: m.textOn }}
            >
              {m.nombre}
            </header>
            <dl className="p-5 space-y-3 flex-1">
              {m.campos.map((c) => (
                <div key={c.label}>
                  <dt className="text-[10px] uppercase tracking-label text-[var(--color-text-muted)] font-mono mb-1">
                    {c.label}
                  </dt>
                  <dd className="flex items-center justify-between gap-2 text-[14px] text-[var(--color-text-main)]">
                    <span className="font-mono break-all">{c.value}</span>
                    <CopyButton value={c.copyValue} label={c.label} />
                  </dd>
                </div>
              ))}
            </dl>
            <footer className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[11px] text-[var(--color-text-muted)] font-mono">
              Concepto: {CONCEPTO_OBLIGATORIO}
            </footer>
          </article>
        ))}
      </section>

      <section className="rounded-lg border-hair border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="shrink-0 h-16 w-16 rounded-full bg-white border-hair border-[var(--color-border)] flex items-center justify-center overflow-hidden" style={{ borderWidth: "0.5px" }}>
          <img
            src="/solo-fe-logo.png"
            alt="Logo Organización Solo Fe"
            className="h-full w-full object-contain p-1"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-semibold text-[18px]">
            {SOLO_FE.nombre}
          </h2>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
            {SOLO_FE.descripcion}
          </p>
        </div>
        <a
          href={SOLO_FE.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[var(--color-text-main)] text-[var(--color-bg)] text-[13px] font-display font-semibold hover:opacity-90"
        >
          Seguir {SOLO_FE.handle}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>

      <section className="rounded-lg border-hair border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5 sm:p-6">
        <h2 className="font-display font-semibold text-[18px] mb-1">
          Comparte la ruta de donación
        </h2>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
          Cada compartida lleva la ayuda más lejos. Reenvía este enlace a tus
          contactos.
        </p>
        <div className="flex flex-wrap gap-2">
          <ShareBtn label="WhatsApp" color="#25D366" onClick={() => share("whatsapp")} />
          <ShareBtn label="Telegram" color="#229ED9" onClick={() => share("telegram")} />
          <ShareBtn label="X / Twitter" color="#111111" onClick={() => share("twitter")} />
          <button
            type="button"
            onClick={handleCopyAllUrl}
            className="text-[13px] px-3 py-2 rounded-md border-hair border-[var(--color-text-main)] text-[var(--color-text-main)] hover:bg-[var(--color-surface)]"
            style={{ borderWidth: "0.5px" }}
          >
            Copiar enlace
          </button>
        </div>
      </section>
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
      type="button"
      onClick={onClick}
      className="text-[13px] px-3 py-2 rounded-md text-white hover:opacity-90"
      style={{ background: color }}
    >
      {label}
    </button>
  );
}
