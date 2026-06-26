import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCenter } from "@/hooks/useCenters";
import { StatusPill } from "@/components/ui-vh/StatusPill";
import { KindBadge } from "@/components/ui-vh/KindBadge";
import { CapacityBar } from "@/components/ui-vh/CapacityBar";
import { Field, TextInput } from "@/components/ui-vh/Field";
import {
  CENTERS,
  type Center,
  type CenterKind,
  type NeedLevel,
} from "@/data/mock";

export const Route = createFileRoute("/centro/$id")({
  head: ({ params }) => {
    const c = CENTERS.find((x) => x.id === params.id);
    return {
      meta: [
        { title: c ? `${c.nombre} · Venezuela Ayuda` : "Centro · Venezuela Ayuda" },
        {
          name: "description",
          content: c
            ? `Necesidades en tiempo real de ${c.nombre} en ${c.ciudad}, ${c.estadoVe}.`
            : "Detalle de centro de coordinación humanitaria.",
        },
      ],
    };
  },
  component: CenterDetail,
  notFoundComponent: () => (
    <div className="max-w-[640px] mx-auto p-10 text-center">
      <h1 className="font-display text-[22px] mb-2">No encontramos este centro</h1>
      <p className="text-[13px] text-[var(--color-text-muted)]">
        Quizá fue cerrado o el enlace cambió.
      </p>
      <Link
        to="/"
        className="inline-block mt-4 text-[13px] text-[var(--color-operational)] underline"
      >
        Volver al directorio
      </Link>
    </div>
  ),
});

const NIVEL_LABEL: Record<NeedLevel, string> = {
  critico: "Crítico",
  alto: "Alto",
  medio: "Medio",
};
const NIVEL_COLOR: Record<NeedLevel, string> = {
  critico: "text-[var(--color-critical)] border-[var(--color-critical)]",
  alto: "text-[var(--color-caution)] border-[var(--color-caution)]",
  medio: "text-[var(--color-text-muted)] border-[var(--color-border)]",
};

const FORM_LABEL: Record<CenterKind, { title: string; submit: string; placeholder: string }> = {
  albergue: { title: "Anuncio de llegada", submit: "Anunciar mi llegada", placeholder: "Agua, colchonetas..." },
  acopio: { title: "Coordinar donación", submit: "Coordinar entrega", placeholder: "200 kg de alimentos..." },
  medico: { title: "Ofrecer servicio médico", submit: "Ofrecer mi turno", placeholder: "Pediatría, trauma, paramédico..." },
  cocina: { title: "Aportar a la cocina", submit: "Coordinar entrega", placeholder: "10 bombonas de gas, 50 kg arroz..." },
  distribucion: { title: "Sumarse a la ruta", submit: "Sumarme a la ruta", placeholder: "Vehículo 4x4, combustible..." },
};

function CenterDetail() {
  const { id } = Route.useParams();
  const { center } = useCenter(id);
  if (!center) throw notFound();

  const [form, setForm] = useState({ nombre: "", lleva: "", cantidad: "", cuando: "" });
  const formCfg = FORM_LABEL[center.kind];

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <nav className="text-[13px] text-[var(--color-text-muted)] mb-5">
        <Link to="/" className="hover:text-[var(--color-text-main)]">
          Centros
        </Link>
        <span className="mx-2">→</span>
        <span className="text-[var(--color-text-main)]">{center.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* Main */}
        <div className="min-w-0 space-y-8">
          <header className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <KindBadge kind={center.kind} long />
              <StatusPill status={center.estado} long />
              <span className="font-mono text-[12px] text-[var(--color-text-muted)]">
                Actualizado hace {center.actualizadoHaceMin} min
              </span>
            </div>
            <h1 className="font-display font-semibold text-[28px] leading-tight">
              {center.nombre}
            </h1>
            <div className="text-[14px] text-[var(--color-text-muted)]">
              {center.ciudad}, {center.estadoVe} · {center.espacio}
            </div>
          </header>

          <KindBlock center={center} />

          <section>
            <h2 className="font-display font-semibold text-[17px] mb-3">Qué necesitan ahora</h2>
            <div className="rounded-lg overflow-hidden border-hair border-[var(--color-border)]">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
                    <th className="px-4 py-2 font-normal">Ítem</th>
                    <th className="px-4 py-2 font-normal">Nivel</th>
                    <th className="px-4 py-2 font-normal text-right">Cantidad aprox.</th>
                  </tr>
                </thead>
                <tbody>
                  {center.necesita.map((n, i) => (
                    <tr
                      key={n.nombre}
                      className={i % 2 === 0 ? "bg-[var(--color-surface-alt)]" : ""}
                    >
                      <td className="px-4 py-3">{n.nombre}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block border-hair rounded-sm px-1.5 py-0.5 text-[11px] uppercase tracking-label ${NIVEL_COLOR[n.nivel]}`}
                        >
                          {NIVEL_LABEL[n.nivel]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[13px]">
                        {n.cantidadAprox}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {center.tieneSuficiente.length > 0 && (
            <section>
              <h2 className="font-display font-semibold text-[17px] mb-3">Ya tienen suficiente</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-6 text-[14px]">
                {center.tieneSuficiente.map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="text-[var(--color-resolved)]">✓</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-display font-semibold text-[17px] mb-3">Cómo llegar</h2>
            <p className="text-[15px]">{center.direccion}</p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(center.direccion)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 text-[14px] text-[var(--color-operational)] hover:underline"
            >
              Abrir en Google Maps →
            </a>
          </section>

          <section>
            <h2 className="font-display font-semibold text-[17px] mb-3">Horario</h2>
            <p className="text-[14px] font-mono">{center.horario}</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-[17px] mb-3">Coordinador</h2>
            <table className="text-[14px]">
              <tbody>
                <tr>
                  <td className="pr-6 py-1 text-[var(--color-text-muted)]">Nombre</td>
                  <td className="py-1">{center.coordinador}</td>
                </tr>
                <tr>
                  <td className="pr-6 py-1 text-[var(--color-text-muted)]">Teléfono</td>
                  <td className="py-1 font-mono">{center.telefono}</td>
                </tr>
                <tr>
                  <td className="pr-6 py-1 text-[var(--color-text-muted)]">Email</td>
                  <td className="py-1">{center.email}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        {/* Sidebar acción */}
        <aside className="lg:sticky lg:top-24 self-start space-y-4">
          <div className="bg-[var(--color-surface)] border-hair border-[var(--color-border)] rounded-lg p-5 space-y-5">
            <KindSidebarStat center={center} />

            <form
              className="space-y-3 pt-4 border-t border-hair border-[var(--color-border)]"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Anuncio enviado — el coordinador fue notificado");
                setForm({ nombre: "", lleva: "", cantidad: "", cuando: "" });
              }}
            >
              <div className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
                {formCfg.title}
              </div>
              <Field label="Tu nombre">
                <TextInput
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </Field>
              <Field label="Qué llevas u ofreces">
                <TextInput
                  required
                  placeholder={formCfg.placeholder}
                  value={form.lleva}
                  onChange={(e) => setForm({ ...form, lleva: e.target.value })}
                />
              </Field>
              <Field label="Cantidad o duración">
                <TextInput
                  required
                  placeholder="50 litros · turno 4 h..."
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                />
              </Field>
              <Field label="Cuándo llegas">
                <TextInput
                  required
                  placeholder="Hoy 17:00"
                  value={form.cuando}
                  onChange={(e) => setForm({ ...form, cuando: e.target.value })}
                />
              </Field>
              <button
                type="submit"
                className="w-full text-[14px] px-3 py-2.5 rounded-md bg-[var(--color-operational)] text-white hover:opacity-90"
              >
                {formCfg.submit}
              </button>
            </form>

            <div className="pt-4 border-t border-hair border-[var(--color-border)]">
              <p className="text-[13px] mb-3">¿Tienes tiempo para ayudar?</p>
              <button
                onClick={() => toast.success("Te contactaremos para coordinar tu turno")}
                className="w-full text-[13px] px-3 py-2 rounded-md border-hair border-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)]"
                style={{ borderWidth: "0.5px" }}
              >
                Unirme como voluntario
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function KindBlock({ center: c }: { center: Center }) {
  if (c.kind === "albergue") {
    return (
      <Section title="Capacidad familiar">
        <div className="grid grid-cols-3 gap-6">
          <BigStat n={`${c.capacidadPct}%`} l="ocupación" />
          <BigStat n={c.familiasActuales} l={`familias / ${c.capacidadMax}`} />
          <BigStat n={c.familiasHoy} l="ingresos hoy" />
        </div>
        <div className="mt-4">
          <CapacityBar pct={c.capacidadPct} showLabel={false} />
        </div>
      </Section>
    );
  }
  if (c.kind === "acopio") {
    return (
      <Section title="Inventario y flujo">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <BigStat n={c.itemsEnInventario.toLocaleString("es-VE")} l="items en stock" />
          <BigStat n={c.salidasSemana} l="salidas / sem" />
          <BigStat n={`${c.m2Almacen} m²`} l="almacén" />
          <BigStat n={c.vehiculosDisponibles} l="vehículos" />
        </div>
      </Section>
    );
  }
  if (c.kind === "medico") {
    return (
      <Section title="Atención médica">
        <div className="grid grid-cols-3 gap-6">
          <BigStat n={c.atencionesHoy} l="atenciones hoy" />
          <BigStat n={c.medicosActivos} l="médicos activos" />
          <BigStat n={c.tieneQuirofano ? "Sí" : "No"} l="quirófano" />
        </div>
        {c.medicamentosCriticos.length > 0 && (
          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)] mb-2">
              Medicamentos críticos
            </div>
            <div className="flex flex-wrap gap-1.5">
              {c.medicamentosCriticos.map((m) => (
                <span
                  key={m}
                  className="border-hair border-[var(--color-critical)] text-[var(--color-critical)] rounded-sm px-2 py-0.5 text-[12px]"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>
    );
  }
  if (c.kind === "cocina") {
    const pct = Math.round((c.racionesDia / c.racionesCapacidad) * 100);
    return (
      <Section title="Producción de raciones">
        <div className="grid grid-cols-3 gap-6">
          <BigStat n={c.racionesDia} l={`de ${c.racionesCapacidad} raciones`} />
          <BigStat n={c.cocinerosActivos} l="cocineros activos" />
          <BigStat n={c.proximaEntrega} l="próxima entrega" />
        </div>
        <div className="mt-4">
          <CapacityBar pct={pct} showLabel={false} />
        </div>
      </Section>
    );
  }
  // distribucion
  return (
    <Section title="Rutas activas">
      <div className="grid grid-cols-3 gap-6">
        <BigStat n={c.entregasHoy} l="entregas hoy" />
        <BigStat n={c.familiasRuta} l="familias en ruta" />
        <BigStat n={c.vehiculosActivos} l="vehículos activos" />
      </div>
      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)] mb-2">
          Zonas cubiertas
        </div>
        <div className="flex flex-wrap gap-1.5">
          {c.zonasCubiertas.map((z) => (
            <span
              key={z}
              className="border-hair border-[var(--color-border)] rounded-sm px-2 py-0.5 text-[12px]"
            >
              {z}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}

function KindSidebarStat({ center: c }: { center: Center }) {
  if (c.kind === "albergue") {
    return (
      <div>
        <div className="font-display font-semibold text-[32px] leading-none">
          {c.capacidadPct}%
        </div>
        <div className="mt-2">
          <CapacityBar pct={c.capacidadPct} showLabel={false} />
        </div>
        <div className="mt-1 text-[12px] text-[var(--color-text-muted)]">
          de familias ({c.familiasActuales} / {c.capacidadMax})
        </div>
      </div>
    );
  }
  if (c.kind === "acopio") {
    return (
      <SidebarBig
        n={c.itemsEnInventario.toLocaleString("es-VE")}
        l={`items · ${c.salidasSemana} salidas/sem`}
      />
    );
  }
  if (c.kind === "medico") {
    return <SidebarBig n={c.atencionesHoy} l={`atenciones hoy · ${c.medicosActivos} médicos`} />;
  }
  if (c.kind === "cocina") {
    const pct = Math.round((c.racionesDia / c.racionesCapacidad) * 100);
    return (
      <div>
        <div className="font-display font-semibold text-[32px] leading-none">{c.racionesDia}</div>
        <div className="mt-2">
          <CapacityBar pct={pct} showLabel={false} />
        </div>
        <div className="mt-1 text-[12px] text-[var(--color-text-muted)]">
          raciones hoy · próxima {c.proximaEntrega}
        </div>
      </div>
    );
  }
  return (
    <SidebarBig n={c.entregasHoy} l={`entregas hoy · ${c.familiasRuta} familias en ruta`} />
  );
}

function SidebarBig({ n, l }: { n: number | string; l: string }) {
  return (
    <div>
      <div className="font-display font-semibold text-[32px] leading-none">{n}</div>
      <div className="mt-2 text-[12px] text-[var(--color-text-muted)]">{l}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-semibold text-[17px] mb-3">{title}</h2>
      <div className="bg-[var(--color-surface)] border-hair border-[var(--color-border)] rounded-lg p-5">
        {children}
      </div>
    </section>
  );
}

function BigStat({ n, l }: { n: number | string; l: string }) {
  return (
    <div>
      <div className="font-display font-semibold text-[24px] leading-none">{n}</div>
      <div className="mt-1.5 text-[12px] text-[var(--color-text-muted)] leading-tight">{l}</div>
    </div>
  );
}
