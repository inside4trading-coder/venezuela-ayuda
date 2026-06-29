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
          "Plataforma operativa tras el sismo del 24 de junio de 2026: registro de sobrevivientes identificados y coordinación de centros de ayuda en vivo.",
      },
      { property: "og:title", content: "Venezuela Ayuda · Coordinación humanitaria en vivo" },
      {
        property: "og:description",
        content:
          "Busca a tus familiares en el registro de sobrevivientes, o suma tu apoyo a la red de centros de ayuda.",
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
            Cinco caminos para sumarte hoy.
          </h2>

          <div className="mt-6">
            <ActorBlock
              etiqueta="Buscas a un familiar"
              titulo="Encuéntralo en el registro de sobrevivientes."
              bullets={[
                "Más de 47.000 personas registradas entre nuestra base local y la red ayudaavzla.com.",
                "Búsqueda por nombre, cédula y ubicación. Filtra por estado físico (estable, herido, crítico).",
                "Cuando encuentres a tu familiar, márcalo como reunido para liberar el registro.",
              ]}
              cta={{ label: "Buscar en el registro", to: "/rescatados" }}
            />
            <ActorBlock
              reverse
              etiqueta="Donador particular"
              titulo="Encuentra dónde tu donación rinde hoy."
              bullets={[
                "Ves en vivo qué necesita cada centro y en qué cantidad.",
                "Filtras por ciudad, estado y tipo de ayuda que puedes dar.",
                "Coordinas directo con el coordinador del centro, sin intermediarios.",
              ]}
              cta={{ label: "Ver qué se necesita", to: "/necesidades" }}
            />
            <ActorBlock
              etiqueta="Voluntario"
              titulo="Ofrece tus manos, tus horas o tu oficio."
              bullets={[
                "Roles abiertos por centro: logística, atención médica, cocina, distribución.",
                "Postúlate directamente desde la plataforma — el coordinador te contacta.",
                "Eliges turno y centro según tu disponibilidad real.",
              ]}
              cta={{ label: "Ver roles disponibles", to: "/voluntarios" }}
            />
            <ActorBlock
              reverse
              etiqueta="Coordinador de centro"
              titulo="Registra tu operación en minutos."
              bullets={[
                "Albergue, acopio, cocina, punto médico o ruta de distribución.",
                "Actualizas inventario y necesidades desde el teléfono.",
                "Recibes voluntarios y donaciones dirigidos a lo que de verdad te falta.",
              ]}
              cta={{ label: "Registrar mi centro", to: "/registrar-centro" }}
            />
            <ActorBlock
              etiqueta="Empresa o diáspora"
              titulo="Aporta logística, capital o redes desde donde estés."
              bullets={[
                "Canal directo con la Organización Solo Fe para donaciones formales con constancia.",
                "La diáspora aporta capital; centros locales ejecutan en tierra.",
                "Métricas en vivo: 68 centros activos, 47.000+ sobrevivientes registrados en la red.",
              ]}
              cta={{ label: "Ver cómo donar", to: "/donaciones" }}
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
        </div>
      </section>
    </ImpactProvider>
  );
}
