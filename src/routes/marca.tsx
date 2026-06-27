import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  CookingPot,
  Droplet,
  Filter,
  Heart,
  HeartHandshake,
  Home,
  Layers,
  MapPin,
  Menu as MenuIcon,
  Package,
  Pill,
  Plus,
  Search,
  Stethoscope,
  Truck,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { KindBadge } from "@/components/ui-vh/KindBadge";
import { StatusPill } from "@/components/ui-vh/StatusPill";
import { CapacityBar } from "@/components/ui-vh/CapacityBar";
import { NeedTag } from "@/components/ui-vh/NeedTag";

export const Route = createFileRoute("/marca")({
  head: () => ({
    meta: [
      { title: "Manual de marca · Venezuela Ayuda" },
      {
        name: "description",
        content:
          "Sistema de identidad de Venezuela Ayuda: color, tipografía, componentes, voz y tono.",
      },
    ],
  }),
  component: MarcaPage,
});

const SECTIONS = [
  { id: "s01", n: "01", title: "Misión y propósito", hint: "Por qué existimos" },
  { id: "s02", n: "02", title: "Logo y marca", hint: "El pulso" },
  { id: "s03", n: "03", title: "Color operacional", hint: "Cada color significa algo" },
  { id: "s04", n: "04", title: "Tipografía", hint: "DM Sans · Inter · DM Mono" },
  { id: "s05", n: "05", title: "Componentes", hint: "Badges · pills · cards" },
  { id: "s06", n: "06", title: "Iconografía", hint: "lucide · trazo 2px" },
  { id: "s07", n: "07", title: "Voz y tono", hint: "Cómo escribimos" },
  { id: "s08", n: "08", title: "Layout y grid", hint: "Espacio · radios · bordes" },
  { id: "s09", n: "09", title: "Open source", hint: "Público y libre" },
] as const;

function SectionHeader({ n, label }: { n: string; label: string }) {
  return (
    <div className="md:sticky md:top-24 self-start">
      <div className="font-mono text-[48px] font-medium leading-none text-[var(--color-critical)]">
        {n}
      </div>
      <div className="mt-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
        {label}
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display font-semibold text-[clamp(28px,4vw,42px)] leading-[1.06] tracking-[-0.025em] max-w-[20ch] mb-5">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[17px] leading-[1.6] text-[#374151] max-w-[60ch] mb-10">
      {children}
    </p>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)] mb-3.5">
      {children}
    </div>
  );
}

function PulseLogo({ size = 32, color = "var(--color-critical)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12h4l2-6 4 12 3-8 2 4h5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ColorCard({
  name,
  hex,
  token,
}: {
  name: string;
  hex: string;
  token: string;
}) {
  return (
    <div className="border-hair border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-surface)]">
      <div className="h-24" style={{ background: hex }} />
      <div className="px-4 py-3.5">
        <div className="font-display font-semibold text-[15px]">{name}</div>
        <div className="flex gap-3.5 mt-1.5 font-mono text-[12px] text-[var(--color-text-muted)]">
          <span>{hex}</span>
          <span>{token}</span>
        </div>
      </div>
    </div>
  );
}

function NeutralChip({
  name,
  hex,
  bordered = false,
}: {
  name: string;
  hex: string;
  bordered?: boolean;
}) {
  return (
    <div className="border-hair border-[var(--color-border)] rounded-md overflow-hidden">
      <div
        className="h-14"
        style={{
          background: hex,
          borderBottom: bordered ? "0.5px solid var(--color-border)" : undefined,
        }}
      />
      <div className="px-3 py-2.5 bg-[var(--color-surface)]">
        <div className="text-[13px] font-medium">{name}</div>
        <div className="font-mono text-[11px] text-[var(--color-text-muted)] mt-0.5">
          {hex}
        </div>
      </div>
    </div>
  );
}

function IconCard({
  Icon,
  label,
  short,
  color = "var(--color-text-main)",
}: {
  Icon: typeof Home;
  label: string;
  short?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-5 px-2 border-hair border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
      <Icon size={28} strokeWidth={2} color={color} />
      <div className="text-center">
        <div className="font-display font-semibold text-[13px]">{label}</div>
        {short && (
          <div className="font-mono text-[10px] text-[var(--color-text-muted)] mt-0.5">
            {short}
          </div>
        )}
      </div>
    </div>
  );
}

function MarcaPage() {
  return (
    <div className="bg-[var(--color-bg)]">
      {/* PORTADA */}
      <section className="max-w-[1100px] mx-auto px-10 pt-16">
        <div className="flex items-center justify-between border-b border-hair border-[var(--color-border)] pb-4.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          <span>Venezuela Ayuda</span>
          <span>Sistema de Identidad · v1.0</span>
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-10 pt-24 pb-28">
        <div className="flex items-center gap-3.5 mb-10">
          <PulseLogo size={34} />
          <span className="font-display font-semibold text-[19px] tracking-[-0.01em]">
            Venezuela Ayuda
          </span>
        </div>
        <h1 className="font-display font-semibold text-[clamp(56px,9vw,116px)] leading-[0.94] tracking-[-0.035em] m-0 max-w-[14ch]">
          Manual de Marca
        </h1>
        <p className="font-sans text-[clamp(18px,2.2vw,24px)] leading-[1.4] text-[var(--color-text-muted)] max-w-[46ch] mt-9">
          La identidad de una plataforma de coordinación humanitaria construida
          para funcionar bajo presión. Clara, operacional, en vivo.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-18 pt-6.5 border-t border-hair border-[var(--color-border)]">
          {[
            ["Versión", "1.0"],
            ["Fecha", "Junio 2026"],
            ["Licencia", "MIT · Open Source"],
            ["Sitio", "venezuelaayuda.com"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)] mb-2">
                {k}
              </div>
              <div className="font-display font-semibold text-[18px]">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ÍNDICE */}
      <section className="max-w-[1100px] mx-auto px-10 pb-28">
        <Label>Índice</Label>
        <div className="border-t border-hair border-[var(--color-border)]">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-baseline gap-7 py-5.5 px-1 border-b border-hair border-[var(--color-border)] text-inherit no-underline hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              <span className="font-mono text-[13px] text-[var(--color-critical)] w-8">
                {s.n}
              </span>
              <span className="font-display font-medium text-[clamp(22px,3vw,30px)] tracking-[-0.02em] flex-1">
                {s.title}
              </span>
              <span className="hidden md:inline font-mono text-[12px] text-[var(--color-text-muted)]">
                {s.hint}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* 01 MISIÓN */}
      <section
        id="s01"
        className="border-t border-hair border-[var(--color-border)] bg-[var(--color-surface)]"
      >
        <div className="max-w-[1100px] mx-auto px-10 py-24 grid md:grid-cols-[180px_1fr] gap-14">
          <SectionHeader n="01" label="Misión y propósito" />
          <div className="max-w-[680px]">
            <H2>
              El problema no fue la falta de voluntad para ayudar. Fue la falta
              de coordinación.
            </H2>
            <p className="text-[18px] leading-[1.6] text-[#374151] mb-5">
              El 24 de junio de 2026, un doble terremoto de magnitud 7.2 y 7.5
              con epicentro en Yaracuy golpeó a Venezuela. Más de 900 muertos,
              miles de heridos, decenas de miles de familias desplazadas.
            </p>
            <p className="text-[18px] leading-[1.6] text-[#374151] mb-10">
              Donadores con agua sin saber a qué centro llevarla. Albergues
              desbordados de ropa y vacíos de medicamentos. Médicos voluntarios
              sin saber dónde se necesitaban.{" "}
              <strong className="font-semibold text-[var(--color-text-main)]">
                Venezuela Ayuda es la capa de inteligencia que faltaba:
              </strong>{" "}
              un directorio en vivo que cruza oferta con demanda, en tiempo
              real, accesible desde cualquier teléfono.
            </p>

            <div className="border-t border-hair border-[var(--color-border)]">
              {[
                ["A", "Sin fricción", "Cualquiera coordina su centro o se registra como voluntario en menos de dos minutos."],
                ["B", "En vivo", "El directorio se actualiza en tiempo real. Lo que ves es lo que pasa ahora en terreno."],
                ["C", "Acceso universal", "Funciona en cualquier teléfono, en cualquier conexión. La ayuda no puede depender del dispositivo."],
              ].map(([k, h, d]) => (
                <div
                  key={k}
                  className="flex gap-6 py-5.5 border-b last:border-b-0 border-hair border-[var(--color-border)]"
                >
                  <span className="font-mono text-[12px] text-[var(--color-critical)] w-6 flex-shrink-0">
                    {k}
                  </span>
                  <div>
                    <div className="font-display font-semibold text-[18px] mb-1">
                      {h}
                    </div>
                    <div className="text-[15px] text-[var(--color-text-muted)] leading-[1.5]">
                      {d}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 02 LOGO */}
      <section
        id="s02"
        className="border-t border-hair border-[var(--color-border)]"
      >
        <div className="max-w-[1100px] mx-auto px-10 py-24 grid md:grid-cols-[180px_1fr] gap-14">
          <SectionHeader n="02" label="Logo y marca" />
          <div>
            <H2>El pulso.</H2>
            <P>
              La marca es una línea de pulso: el latido de una señal en vivo.
              Significa vida y significa actividad en tiempo real. Se dibuja en
              el rojo de la bandera venezolana — el mismo color que marca lo
              urgente en el producto.
            </P>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="bg-[var(--color-surface)] border-hair border-[var(--color-border)] rounded-lg p-12 flex items-center justify-center min-h-[200px]">
                <PulseLogo size={120} />
              </div>
              <div className="bg-[var(--color-surface)] border-hair border-[var(--color-border)] rounded-lg p-12 flex flex-col items-center justify-center gap-4.5 min-h-[200px]">
                <div className="flex items-center gap-3.5">
                  <PulseLogo size={32} />
                  <span className="font-display font-semibold text-[24px] tracking-[-0.015em]">
                    Venezuela Ayuda
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Lockup horizontal
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-12">
              <div className="bg-[#111111] rounded-lg p-12 flex flex-col items-center justify-center gap-4.5 min-h-[180px]">
                <div className="flex items-center gap-3.5">
                  <PulseLogo size={30} color="#ffffff" />
                  <span className="font-display font-semibold text-[22px] tracking-[-0.015em] text-white">
                    Venezuela Ayuda
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">
                  Sobre fondo oscuro · marca en blanco
                </span>
              </div>
              <div className="bg-[var(--color-surface)] border-hair border-[var(--color-border)] rounded-lg p-9 flex items-center justify-center min-h-[180px] relative">
                <div
                  className="relative p-7"
                  style={{ outline: "1px dashed rgba(200,16,46,0.27)" }}
                >
                  <PulseLogo size={64} />
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] whitespace-nowrap">
                    Área de respeto = altura de la marca
                  </span>
                </div>
              </div>
            </div>

            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-critical)] mb-4.5">
              Mal uso
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {[
                { msg: "No recolorear", color: "var(--color-operational)" },
                { msg: "No deformar", stretch: true },
                { msg: "No rotar", rotate: 22 },
                { msg: "No sobre fondos saturados", saturated: true },
              ].map((m, i) => (
                <div
                  key={i}
                  className={`border-hair border-[var(--color-border)] rounded-lg px-3.5 py-6 flex flex-col items-center gap-3.5 text-center ${
                    m.saturated
                      ? ""
                      : "bg-[var(--color-surface)]"
                  }`}
                  style={
                    m.saturated
                      ? {
                          background:
                            "linear-gradient(135deg, var(--color-operational), var(--color-critical))",
                        }
                      : undefined
                  }
                >
                  <svg
                    width={m.stretch ? 64 : 44}
                    height={m.stretch ? 32 : 44}
                    viewBox="0 0 24 24"
                    fill="none"
                    preserveAspectRatio={m.stretch ? "none" : undefined}
                    style={m.rotate ? { transform: `rotate(${m.rotate}deg)` } : undefined}
                  >
                    <path
                      d="M2 12h4l2-6 4 12 3-8 2 4h5"
                      stroke={
                        m.saturated
                          ? "#fff"
                          : m.color || "var(--color-critical)"
                      }
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className={`text-[12px] leading-[1.4] ${
                      m.saturated ? "text-white" : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    {m.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 03 COLOR */}
      <section
        id="s03"
        className="border-t border-hair border-[var(--color-border)] bg-[var(--color-surface)]"
      >
        <div className="max-w-[1100px] mx-auto px-10 py-24 grid md:grid-cols-[180px_1fr] gap-14">
          <SectionHeader n="03" label="Color operacional" />
          <div>
            <H2>Cada color significa algo. Ninguno es decoración.</H2>
            <P>
              En una emergencia, el color es información. El rojo no es
              "bonito": es urgente. El azul es acción. El verde es cubierto.
              Quien usa la plataforma lee el estado de un centro antes de leer
              una sola palabra.
            </P>

            <Label>Semánticos</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              <ColorCard name="Crítico · Urgente" hex="#C8102E" token="--color-critical" />
              <ColorCard name="Operacional · Acción" hex="#1A56DB" token="--color-operational" />
              <ColorCard name="Resuelto · Cubierto" hex="#057A55" token="--color-resolved" />
              <ColorCard name="Precaución · Lleno" hex="#B45309" token="--color-caution" />
            </div>

            <Label>Neutrales</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-8">
              <NeutralChip name="Fondo" hex="#F7F7F5" />
              <NeutralChip name="Superficie" hex="#FFFFFF" bordered />
              <NeutralChip name="Superficie alt" hex="#F0F0EE" />
              <NeutralChip name="Borde" hex="#E4E4E2" />
              <NeutralChip name="Texto principal" hex="#111111" />
              <NeutralChip name="Texto tenue" hex="#6B7280" />
            </div>

            <pre className="m-0 bg-[#111111] text-[#e4e4e2] rounded-lg p-5 font-mono text-[12.5px] leading-[1.7] overflow-x-auto">
{`--color-critical:    #C8102E  /* Urgente */
--color-operational: #1A56DB  /* CTAs · acción */
--color-resolved:    #057A55  /* Cubierto · OK */
--color-caution:     #B45309  /* Capacidad llena */`}
            </pre>
          </div>
        </div>
      </section>

      {/* 04 TIPOGRAFÍA */}
      <section
        id="s04"
        className="border-t border-hair border-[var(--color-border)]"
      >
        <div className="max-w-[1100px] mx-auto px-10 py-24 grid md:grid-cols-[180px_1fr] gap-14">
          <SectionHeader n="04" label="Tipografía" />
          <div>
            <H2>Tres voces, una para cada trabajo.</H2>
            <P>
              DM Sans titula y da carácter. Inter sostiene la interfaz y los
              datos densos. DM Mono marca lo que debe leerse como dato crudo:
              horas, cantidades, etiquetas.
            </P>

            <div className="border-hair border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] p-8 mb-4">
              <div className="flex justify-between items-baseline mb-5">
                <Label>Display</Label>
                <span className="font-mono text-[12px] text-[var(--color-text-muted)]">
                  DM Sans · 600
                </span>
              </div>
              <div className="font-display font-semibold text-[46px] tracking-[-0.025em] leading-[1.05]">
                Coordinar la ayuda en tiempo real
              </div>
            </div>

            <div className="border-hair border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] p-8 mb-4">
              <div className="flex justify-between items-baseline mb-4.5">
                <Label>Interfaz y datos</Label>
                <span className="font-mono text-[12px] text-[var(--color-text-muted)]">
                  Inter · 400 / 500 / 600
                </span>
              </div>
              <div className="font-sans text-[20px] leading-[1.5]">
                Ves qué falta hoy, en qué centro, y llegas con lo correcto. La
                plataforma cruza oferta con demanda en vivo.
              </div>
            </div>

            <div className="border-hair border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] p-8 mb-12">
              <div className="flex justify-between items-baseline mb-4.5">
                <Label>Datos y etiquetas</Label>
                <span className="font-mono text-[12px] text-[var(--color-text-muted)]">
                  DM Mono · 400 / 500
                </span>
              </div>
              <div className="font-mono text-[18px] leading-[1.6] text-[var(--color-text-main)]">
                14:32 · 2.840 familias · 18.400 ítems/sem · ACTUALIZADO HACE 6M
              </div>
            </div>

            <Label>Escala tipográfica</Label>
            <div className="border-t border-hair border-[var(--color-border)]">
              {[
                ["Título · 56px", <span key="t" className="font-display font-semibold text-[36px] tracking-[-0.02em]">Aa</span>],
                ["Sección · 30px", <span key="s" className="font-display font-semibold text-[28px] tracking-[-0.02em]">Aa</span>],
                ["Cuerpo · 17px", <span key="b" className="font-sans text-[17px]">Aa · texto de párrafo</span>],
                ["UI · 14-15px", <span key="u" className="font-sans text-[14px]">Aa · interfaz y controles</span>],
                ["Label · 11px", <span key="l" className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-main)]">Etiqueta · tracking 0.05em</span>],
              ].map(([label, sample], i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-6 py-4 border-b last:border-b-0 border-hair border-[var(--color-border)]"
                >
                  <span className="font-mono text-[12px] text-[var(--color-text-muted)] w-32">
                    {label}
                  </span>
                  {sample}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 05 COMPONENTES — usando ui-vh reales */}
      <section
        id="s05"
        className="border-t border-hair border-[var(--color-border)] bg-[var(--color-surface)]"
      >
        <div className="max-w-[1100px] mx-auto px-10 py-24 grid md:grid-cols-[180px_1fr] gap-14">
          <SectionHeader n="05" label="Componentes" />
          <div>
            <H2>Piezas pequeñas, densas y legibles de un vistazo.</H2>
            <P>
              Cada componente comprime el máximo de estado en el mínimo de
              espacio. Bordes de medio punto, esquinas suaves, mono para los
              números. Estos ejemplos son los mismos componentes que viven en{" "}
              <code className="font-mono text-[14px]">src/components/ui-vh/</code>{" "}
              — si cambian aquí, cambia el producto.
            </P>

            <div className="mb-10">
              <Label>KindBadge · 5 tipos de centro</Label>
              <div className="flex flex-wrap gap-2.5">
                <KindBadge kind="albergue" />
                <KindBadge kind="acopio" />
                <KindBadge kind="medico" />
                <KindBadge kind="cocina" />
                <KindBadge kind="distribucion" />
              </div>
            </div>

            <div className="mb-10">
              <Label>StatusPill · estado del centro</Label>
              <div className="flex flex-wrap gap-2.5">
                <StatusPill status="urgente" long />
                <StatusPill status="activo" long />
                <StatusPill status="capacidad-llena" long />
                <StatusPill status="cerrado" long />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              <div>
                <Label>CapacityBar</Label>
                <div className="flex flex-col gap-3.5">
                  <CapacityBar pct={42} />
                  <CapacityBar pct={74} />
                  <CapacityBar pct={96} />
                </div>
              </div>
              <div>
                <Label>NeedTag · necesita / tiene</Label>
                <div className="flex flex-wrap gap-2">
                  <NeedTag>Agua</NeedTag>
                  <NeedTag>Medicamentos</NeedTag>
                  <NeedTag>Pañales</NeedTag>
                  <NeedTag variant="have">Ropa</NeedTag>
                  <NeedTag variant="have">Mantas</NeedTag>
                </div>
                <div className="mt-6">
                  <Label>Botones</Label>
                  <div className="flex flex-wrap gap-2.5">
                    <button className="font-sans text-[13px] px-3.5 py-2 rounded-md bg-[var(--color-critical)] text-white">
                      Quiero ayudar
                    </button>
                    <button className="font-sans text-[13px] px-3.5 py-2 rounded-md bg-[var(--color-operational)] text-white">
                      Enviar ayuda
                    </button>
                    <button className="font-sans text-[13px] px-3.5 py-2 rounded-md border-hair border-[var(--color-text-main)] text-[var(--color-text-main)]">
                      Ver detalle
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Label>CenterCard · composición completa</Label>
            <div
              className="max-w-[380px] bg-[var(--color-surface)] border-hair border-[var(--color-border)] rounded-lg p-4 flex flex-col gap-3"
              style={{ borderLeft: "2px solid var(--color-critical)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <KindBadge kind="albergue" />
                <div className="flex items-center gap-2">
                  <StatusPill status="urgente" />
                  <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                    8m
                  </span>
                </div>
              </div>
              <div>
                <div className="font-display font-semibold text-[15px] leading-[1.3]">
                  Albergue Liceo Bolívar
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--color-text-muted)]">
                  <MapPin size={12} />
                  <span>San Felipe, Yaracuy</span>
                </div>
              </div>
              <div className="h-px bg-[var(--color-border)]" />
              <CapacityBar pct={96} />
              <div>
                <div className="font-mono text-[11px] uppercase tracking-label text-[var(--color-text-muted)] mb-1.5">
                  Necesita urgente
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <NeedTag>Agua</NeedTag>
                  <NeedTag>Colchonetas</NeedTag>
                  <NeedTag>Pañales</NeedTag>
                </div>
              </div>
              <div className="flex gap-2 pt-0.5">
                <button className="flex-1 text-[13px] py-2 rounded-md bg-[var(--color-operational)] text-white">
                  Enviar ayuda
                </button>
                <button className="flex-1 text-[13px] py-2 rounded-md border-hair border-[var(--color-border)] text-[var(--color-text-main)]">
                  Ver detalle
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 06 ICONOGRAFÍA — lucide-react */}
      <section
        id="s06"
        className="border-t border-hair border-[var(--color-border)]"
      >
        <div className="max-w-[1100px] mx-auto px-10 py-24 grid md:grid-cols-[180px_1fr] gap-14">
          <SectionHeader n="06" label="Iconografía" />
          <div>
            <H2>Una sola línea, del logo a cada ícono.</H2>
            <P>
              La marca nace de un ícono de trazo: el pulso. Todo el sistema
              sigue esa misma regla —{" "}
              <strong className="font-semibold text-[var(--color-text-main)]">
                lucide-react
              </strong>
              , grid de 24, trazo 2 px, extremos redondeados. Los íconos
              heredan el color semántico vía <code className="font-mono text-[14px]">currentColor</code>.
            </P>

            <div className="flex justify-between items-baseline mb-4">
              <Label>Familia 1 · Tipos de centro</Label>
              <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                5 íconos · color por tipo
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
              <IconCard Icon={Home} label="Albergue" short="ALB" color="var(--color-operational)" />
              <IconCard Icon={Package} label="Acopio" short="ACO" />
              <IconCard Icon={Stethoscope} label="Punto médico" short="MED" color="var(--color-critical)" />
              <IconCard Icon={CookingPot} label="Cocina" short="COC" color="var(--color-caution)" />
              <IconCard Icon={Truck} label="Distribución" short="DIST" color="var(--color-resolved)" />
            </div>

            <div className="flex justify-between items-baseline mb-4">
              <Label>Familia 2 · Actores</Label>
              <span className="font-mono text-[11px] text-[var(--color-text-muted)]">5 íconos</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
              <IconCard Icon={HeartHandshake} label="Donador" />
              <IconCard Icon={Heart} label="Voluntario" />
              <IconCard Icon={Building2} label="Coordinador" />
              <IconCard Icon={Truck} label="Transportista" />
              <IconCard Icon={Compass} label="Diáspora" />
            </div>

            <div className="flex justify-between items-baseline mb-4">
              <Label>Familia 3 · Estado y métricas</Label>
              <span className="font-mono text-[11px] text-[var(--color-text-muted)]">8 íconos</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              <IconCard Icon={Activity} label="En vivo" color="var(--color-resolved)" />
              <IconCard Icon={AlertTriangle} label="Urgente" color="var(--color-critical)" />
              <IconCard Icon={Clock} label="Actualizado" />
              <IconCard Icon={Users} label="Familias" />
              <IconCard Icon={Layers} label="Stock" />
              <IconCard Icon={Droplet} label="Agua" color="var(--color-operational)" />
              <IconCard Icon={Pill} label="Medicamentos" color="var(--color-critical)" />
              <IconCard Icon={TrendingUp} label="Impacto" color="var(--color-resolved)" />
            </div>

            <div className="flex justify-between items-baseline mb-4">
              <Label>Familia 4 · Interfaz y navegación</Label>
              <span className="font-mono text-[11px] text-[var(--color-text-muted)]">10 íconos</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <IconCard Icon={MenuIcon} label="Menú" />
              <IconCard Icon={Search} label="Buscar" />
              <IconCard Icon={Filter} label="Filtros" />
              <IconCard Icon={MapPin} label="Ubicación" />
              <IconCard Icon={ChevronRight} label="Expandir" />
              <IconCard Icon={ChevronDown} label="Desplegar" />
              <IconCard Icon={X} label="Cerrar" />
              <IconCard Icon={Check} label="Confirmar" color="var(--color-resolved)" />
              <IconCard Icon={Plus} label="Agregar" />
              <IconCard Icon={ArrowRight} label="Continuar" color="var(--color-operational)" />
            </div>
          </div>
        </div>
      </section>

      {/* 07 VOZ Y TONO */}
      <section
        id="s07"
        className="border-t border-hair border-[var(--color-border)] bg-[var(--color-surface)]"
      >
        <div className="max-w-[1100px] mx-auto px-10 py-24 grid md:grid-cols-[180px_1fr] gap-14">
          <SectionHeader n="07" label="Voz y tono" />
          <div>
            <H2>Hablamos como un coordinador en terreno.</H2>
            <P>
              Preciso, directo, sin adornos. Urgente sin alarmismo. Cada palabra
              ayuda a alguien a tomar una decisión más rápido. Si una frase no
              mueve a la acción, sobra.
            </P>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-11">
              {[
                ["Directo", "Vamos al grano. Sujeto, verbo, dato."],
                ["Claro", "Sin jerga. Lo entiende cualquiera, en cualquier teléfono."],
                ["Urgente", "Transmite prioridad sin gritar ni dramatizar."],
                ["Humano", "Detrás de cada dato hay familias. No lo olvidamos."],
              ].map(([h, d]) => (
                <div
                  key={h}
                  className="border-hair border-[var(--color-border)] rounded-lg p-4.5 bg-[var(--color-bg)]"
                >
                  <div className="font-display font-semibold text-[16px] mb-1.5">
                    {h}
                  </div>
                  <div className="text-[13px] text-[var(--color-text-muted)] leading-[1.5]">
                    {d}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="border-hair border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg)]">
                <div className="px-4.5 py-3 border-b border-hair border-[var(--color-border)] flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-resolved)]" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-resolved)]">
                    Así sí
                  </span>
                </div>
                <div className="p-4.5 space-y-3.5">
                  <p className="text-[15px] leading-[1.5]">
                    "Este albergue necesita agua y colchonetas hoy. 184 familias."
                  </p>
                  <p className="text-[15px] leading-[1.5]">
                    "Registrá tu centro en 2 minutos."
                  </p>
                  <p className="text-[15px] leading-[1.5]">
                    "Ves qué falta. Llegás con lo correcto."
                  </p>
                </div>
              </div>
              <div className="border-hair border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg)]">
                <div className="px-4.5 py-3 border-b border-hair border-[var(--color-border)] flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-critical)]" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-critical)]">
                    Así no
                  </span>
                </div>
                <div className="p-4.5 space-y-3.5">
                  <p className="text-[15px] leading-[1.5] text-[var(--color-text-muted)] line-through">
                    "¡Tragedia sin precedentes! ¡Ayuda ya, no esperes!"
                  </p>
                  <p className="text-[15px] leading-[1.5] text-[var(--color-text-muted)] line-through">
                    "Complete el formulario de onboarding del centro."
                  </p>
                  <p className="text-[15px] leading-[1.5] text-[var(--color-text-muted)] line-through">
                    "Sinergia colaborativa para optimizar recursos."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 08 LAYOUT */}
      <section
        id="s08"
        className="border-t border-hair border-[var(--color-border)]"
      >
        <div className="max-w-[1100px] mx-auto px-10 py-24 grid md:grid-cols-[180px_1fr] gap-14">
          <SectionHeader n="08" label="Layout y grid" />
          <div>
            <H2>Bordes de medio punto. Aire medido.</H2>
            <P>
              La estructura es discreta a propósito: divisiones de 0.5px en
              lugar de cajas pesadas, esquinas de 4–8 px y un espaciado
              consistente. La jerarquía la marca el contenido, no el contenedor.
            </P>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div className="border-hair border-[var(--color-border)] rounded-lg p-6 bg-[var(--color-surface)]">
                <Label>Radios de esquina</Label>
                <div className="flex gap-4.5 items-end">
                  {[
                    [4, "4px · sm"],
                    [6, "6px · md"],
                    [8, "8px · lg"],
                  ].map(([r, l]) => (
                    <div key={l as string} className="text-center">
                      <div
                        className="w-14 h-14 bg-[var(--color-surface-alt)] border-hair border-[var(--color-border)]"
                        style={{ borderRadius: r as number }}
                      />
                      <div className="font-mono text-[11px] text-[var(--color-text-muted)] mt-2">
                        {l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-hair border-[var(--color-border)] rounded-lg p-6 bg-[var(--color-surface)]">
                <Label>Bordes</Label>
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className="flex-1" style={{ borderBottom: "0.5px solid #111" }} />
                    <span className="font-mono text-[11px] text-[var(--color-text-muted)] w-32">
                      0.5px · border-hair
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div className="flex-1 border-b-2 border-[var(--color-critical)]" />
                    <span className="font-mono text-[11px] text-[var(--color-text-muted)] w-32">
                      2px · acento card
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div
                      className="flex-1"
                      style={{ borderBottom: "1px dashed rgba(200,16,46,0.27)" }}
                    />
                    <span className="font-mono text-[11px] text-[var(--color-text-muted)] w-32">
                      dashed · área respeto
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-hair border-[var(--color-border)] rounded-lg p-6 bg-[var(--color-surface)]">
              <Label>Escala de espaciado · base 4px</Label>
              <div className="flex items-end gap-3.5 flex-wrap">
                {[8, 12, 16, 24, 40, 56, 96].map((h) => (
                  <div key={h} className="text-center">
                    <div
                      className="w-6 bg-[var(--color-critical)]"
                      style={{ height: h }}
                    />
                    <div className="font-mono text-[10px] text-[var(--color-text-muted)] mt-1.5">
                      {h}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4.5 flex gap-6 flex-wrap font-mono text-[12px] text-[var(--color-text-muted)]">
                <span>Ancho contenido · 1100px</span>
                <span>Ancho app · 1400px</span>
                <span>Padding lateral · 16–40px</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 09 OPEN SOURCE */}
      <section
        id="s09"
        className="border-t border-hair border-[var(--color-border)] bg-[var(--color-surface)]"
      >
        <div className="max-w-[1100px] mx-auto px-10 py-24 grid md:grid-cols-[180px_1fr] gap-14">
          <SectionHeader n="09" label="Open source" />
          <div>
            <H2>Público y libre.</H2>
            <P>
              Venezuela Ayuda es código abierto. La marca, los componentes y los
              tokens viven en el repo bajo licencia MIT. Si tu emergencia se
              parece a la nuestra, tómalo, adáptalo y úsalo.
            </P>
            <div className="border-hair border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] p-6">
              <div className="font-display font-semibold text-[18px] mb-2">
                Recursos del sistema
              </div>
              <ul className="font-mono text-[13px] text-[var(--color-text-main)] space-y-2">
                <li>
                  <code>src/styles.css</code>{" "}
                  <span className="text-[var(--color-text-muted)]">
                    · tokens de color, tipografía y radios
                  </span>
                </li>
                <li>
                  <code>src/components/ui-vh/</code>{" "}
                  <span className="text-[var(--color-text-muted)]">
                    · KindBadge, StatusPill, CapacityBar, NeedTag, Field, KindMetric
                  </span>
                </li>
                <li>
                  <code>src/data/mock.ts</code>{" "}
                  <span className="text-[var(--color-text-muted)]">
                    · tipos de centro, estados, KIND_BY_ID
                  </span>
                </li>
                <li>
                  <code>lucide-react</code>{" "}
                  <span className="text-[var(--color-text-muted)]">
                    · librería de iconografía
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-hair border-[var(--color-border)] py-12">
        <div className="max-w-[1100px] mx-auto px-10 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          <span>Venezuela Ayuda · Sistema de identidad v1.0</span>
          <span>MIT · Junio 2026</span>
        </div>
      </footer>
    </div>
  );
}
