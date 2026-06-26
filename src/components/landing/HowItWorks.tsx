const PASOS = [
  {
    label: "Paso uno",
    titulo: "Los centros se registran",
    texto:
      "Albergues, acopios, cocinas, puntos médicos y rutas de distribución crean su ficha en minutos. Indican qué tienen, qué les falta y a quién contactar.",
  },
  {
    label: "Paso dos",
    titulo: "Mostramos qué necesitan, en vivo",
    texto:
      "Cada centro actualiza inventario, capacidad y urgencias. El directorio se ordena por lo que más falta hoy, no por lo que más se publicita.",
  },
  {
    label: "Paso tres",
    titulo: "Tú llegas, donas o conectas",
    texto:
      "Filtras por ciudad, tipo de centro o necesidad. Coordinas directo con quien recibe. Sin intermediarios, sin formularios eternos.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-b border-hair border-[var(--color-border)]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <p className="font-mono text-[11px] uppercase tracking-label text-[var(--color-text-muted)] mb-3">
          Cómo funciona
        </p>
        <h2 className="font-display font-semibold text-[28px] sm:text-[32px] max-w-[28ch] leading-tight">
          Tres pasos. Sin cuenta, sin fricción, sin pasar por nadie.
        </h2>

        <ol className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--color-border)] border-hair border-[var(--color-border)] rounded-lg overflow-hidden">
          {PASOS.map((p) => (
            <li key={p.label} className="bg-[var(--color-surface)] p-6">
              <p className="font-mono text-[10px] uppercase tracking-label text-[var(--color-critical)]">
                {p.label}
              </p>
              <h3 className="font-display font-semibold text-[18px] mt-2 leading-snug">
                {p.titulo}
              </h3>
              <p className="text-[14px] text-[var(--color-text-muted)] mt-2 leading-snug">
                {p.texto}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
