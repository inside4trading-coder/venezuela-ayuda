import { createFileRoute, Link } from "@tanstack/react-router";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ActorBlock } from "@/components/landing/ActorBlock";
import { KindStrip } from "@/components/landing/KindStrip";
import { ImpactStrip } from "@/components/landing/ImpactStrip";
import { ImpactProvider } from "@/context/ImpactContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Venezuela Ayuda · Coordinación humanitaria en vivo" },
      {
        name: "description",
        content:
          "Plataforma operativa de coordinación tras el terremoto del 24 de junio de 2026. Encuentra dónde donar, cómo ayudar o registra tu centro.",
      },
      { property: "og:title", content: "Venezuela Ayuda · Coordinación humanitaria en vivo" },
      {
        property: "og:description",
        content:
          "47 centros activos coordinando ayuda en tiempo real. Encuentra dónde donar o cómo ayudar hoy.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    // ImpactProvider asegura un solo fetch compartido entre Hero e ImpactStrip
    <ImpactProvider>
      <Hero />
      <HowItWorks />

      <section className="border-b border-hair border-[var(--color-border)]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <p className="font-mono text-[11px] uppercase tracking-label text-[var(--color-text-muted)] mb-3">
            Para cada actor
          </p>
          <h2 className="font-display font-semibold text-[28px] sm:text-[32px] max-w-[30ch] leading-tight">
            Cuatro caminos para sumarte hoy.
          </h2>

          <div className="mt-6">
            <ActorBlock
              etiqueta="Donador particular"
              titulo="Encuentra dónde tu donación rinde hoy."
              bullets={[
                "Ves en vivo qué necesita cada centro y en qué cantidad.",
                "Filtras por ciudad y por tipo de ayuda que puedes dar.",
                "Coordinas directo con el coordinador del centro, sin intermediarios.",
              ]}
              cta={{ label: "Ver qué se necesita", to: "/necesidades" }}
            />
            <ActorBlock
              reverse
              etiqueta="Voluntario"
              titulo="Ofrece tus manos, tus horas o tu oficio."
              bullets={[
                "Voluntariado presencial en albergues, cocinas y rutas.",
                "Voluntariado especializado: médicos, paramédicos, logística.",
                "Eliges turno y centro según tu disponibilidad real.",
              ]}
              cta={{ label: "Registrarme como voluntario", to: "/voluntarios" }}
            />
            <ActorBlock
              etiqueta="Coordinador de centro"
              titulo="Registra tu operación en minutos."
              bullets={[
                "Albergue, acopio, cocina, punto médico o ruta de distribución.",
                "Actualizas inventario y necesidades desde el teléfono.",
                "Recibes ayuda dirigida a lo que de verdad te falta.",
              ]}
              cta={{ label: "Registrar mi centro", to: "/registrar-centro" }}
            />
            <ActorBlock
              reverse
              etiqueta="Empresa o diáspora"
              titulo="Aporta logística, capital o redes desde donde estés."
              bullets={[
                "Donaciones corporativas a centros de acopio y distribución.",
                "La diáspora aporta capital; centros locales ejecutan en tierra.",
                "Visibilidad del destino: ves a qué centro llegó cada aporte.",
              ]}
              cta={{ label: "Ver acopios y rutas", to: "/centros" }}
              nota="Próximamente: convenios y constancias formales."
            />
          </div>
        </div>
      </section>

      <KindStrip />
      <ImpactStrip />

      <section className="border-b border-hair border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
          <h2 className="font-display font-semibold text-[32px] sm:text-[40px] leading-tight">
            Esto no reemplaza a nadie. Coordina.
          </h2>
          <p className="mt-4 text-[16px] text-[var(--color-text-muted)] max-w-[55ch] mx-auto">
            Gobierno, ONGs, iglesias, vecinos y diáspora ya están operando. Nuestra única función es
            que sepan dónde se necesitan y se eviten esfuerzos duplicados.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/centros"
              className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-[var(--color-critical)] text-white text-[15px]"
            >
              Ver centros activos
            </Link>
            <Link
              to="/registrar-centro"
              className="inline-flex items-center justify-center px-5 py-3 rounded-md border-hair border-[var(--color-text-main)] text-[15px] text-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)]"
              style={{ borderWidth: "0.5px" }}
            >
              Registrar un centro
            </Link>
          </div>
        </div>
      </section>
    </ImpactProvider>
  );
}
