const PASOS = [
  {
    label: "Paso uno",
    titulo: "Identificamos a los sobrevivientes",
    texto:
      "Equipos en hospitales, albergues y refugios reportan a quienes han llegado: nombre, cédula, lugar. Lo cargamos a una base verificada.",
  },
  {
    label: "Paso dos",
    titulo: "Las familias buscan y encuentran",
    texto:
      "Cualquiera puede buscar por nombre en el registro. Al hacer click ve cédula, lugar exacto y condición — datos suficientes para confirmar antes de movilizarse.",
  },
  {
    label: "Paso tres",
    titulo: "Los centros registran qué necesitan",
    texto:
      "Albergues, acopios, cocinas, puntos médicos y rutas crean su ficha en minutos. Indican qué tienen, qué les falta y a quién contactar.",
  },
  {
    label: "Paso cuatro",
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
          Cuatro pasos. Sin cuenta, sin fricción, sin pasar por nadie.
        </h2>

        <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)] border-hair border-[var(--color-border)] rounded-lg overflow-hidden">
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
