import { Link } from "@tanstack/react-router";

export interface ActorBlockProps {
  etiqueta: string;
  titulo: string;
  bullets: string[];
  cta: { label: string; to: string; search?: Record<string, string> };
  nota?: string;
  reverse?: boolean;
}

export function ActorBlock({ etiqueta, titulo, bullets, cta, nota, reverse }: ActorBlockProps) {
  return (
    <article className="border-t border-hair border-[var(--color-border)] py-12 sm:py-16">
      <div
        className={`grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 ${
          reverse ? "md:[&>*:first-child]:order-2" : ""
        }`}
      >
        <div className="md:col-span-4">
          <p className="font-mono text-[11px] uppercase tracking-label text-[var(--color-critical)]">
            {etiqueta}
          </p>
        </div>
        <div className="md:col-span-8">
          <h3 className="font-display font-semibold text-[24px] sm:text-[28px] leading-tight max-w-[28ch]">
            {titulo}
          </h3>
          <ul className="mt-5 space-y-2.5">
            {bullets.map((b) => (
              <li
                key={b}
                className="text-[15px] text-[var(--color-text-main)] leading-snug pl-4 relative"
              >
                <span
                  className="absolute left-0 top-[0.6em] w-2 border-t"
                  style={{ borderTopWidth: "0.5px", borderColor: "var(--color-text-muted)" }}
                />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              to={cta.to}
              search={cta.search}
              className="inline-flex items-center text-[14px] text-[var(--color-text-main)] border-b border-[var(--color-text-main)] pb-0.5 hover:text-[var(--color-critical)] hover:border-[var(--color-critical)]"
              style={{ borderBottomWidth: "0.5px" }}
            >
              {cta.label} →
            </Link>
            {nota && (
              <span className="text-[12px] text-[var(--color-text-muted)] italic">{nota}</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
