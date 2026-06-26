import { CENTER_KINDS } from "@/data/mock";
import { KindBadge } from "@/components/ui-vh/KindBadge";

export function KindStrip() {
  return (
    <section className="border-b border-hair border-[var(--color-border)] bg-[var(--color-surface-alt)]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <p className="font-mono text-[11px] uppercase tracking-label text-[var(--color-text-muted)] mb-3">
          Cinco tipos de centro
        </p>
        <h2 className="font-display font-semibold text-[28px] sm:text-[32px] max-w-[30ch] leading-tight">
          Cada flujo es distinto. Los donadores saben a dónde ir.
        </h2>
        <p className="mt-3 text-[14px] text-[var(--color-text-muted)] max-w-[60ch]">
          No es lo mismo recibir familias que clasificar donaciones, cocinar o atender pacientes.
          Diferenciamos para que tu ayuda llegue al lugar correcto.
        </p>

        <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {CENTER_KINDS.map((k) => (
            <li
              key={k.id}
              className="border-hair border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-4"
              style={{ borderWidth: "0.5px" }}
            >
              <KindBadge kind={k.id} />
              <p className="font-display font-semibold text-[15px] mt-3 leading-snug">{k.label}</p>
              <p className="text-[13px] text-[var(--color-text-muted)] mt-1 leading-snug">
                {k.microcopy}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
