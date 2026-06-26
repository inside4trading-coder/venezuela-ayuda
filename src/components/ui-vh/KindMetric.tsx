import type { Center } from "@/data/mock";
import { CapacityBar } from "./CapacityBar";

/**
 * Métrica clave del centro según su tipo.
 * Altura visual reservada (~64px) para que las cards alineen.
 */
export function KindMetric({ center: c }: { center: Center }) {
  return (
    <div className="min-h-[64px]">
      {c.kind === "albergue" && (
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
              Capacidad
            </span>
            <span className="font-mono text-[12px]">
              {c.familiasActuales}/{c.capacidadMax} familias
            </span>
          </div>
          <CapacityBar pct={c.capacidadPct} showLabel={false} />
          <div className="mt-1 font-mono text-[11px] text-[var(--color-text-muted)]">
            {c.capacidadPct}% ocupado
          </div>
        </div>
      )}

      {c.kind === "acopio" && (
        <Grid>
          <Cell n={c.itemsEnInventario.toLocaleString("es-VE")} l="items en stock" />
          <Cell n={c.salidasSemana} l="salidas / sem" />
          <Cell n={c.vehiculosDisponibles} l="vehículos" />
        </Grid>
      )}

      {c.kind === "medico" && (
        <Grid>
          <Cell n={c.atencionesHoy} l="atenciones hoy" />
          <Cell n={c.medicosActivos} l="médicos activos" />
          <Cell n={c.tieneQuirofano ? "SÍ" : "NO"} l="quirófano" />
        </Grid>
      )}

      {c.kind === "cocina" && (
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
              Raciones hoy
            </span>
            <span className="font-mono text-[12px]">
              {c.racionesDia}/{c.racionesCapacidad}
            </span>
          </div>
          <CapacityBar
            pct={Math.round((c.racionesDia / c.racionesCapacidad) * 100)}
            showLabel={false}
          />
          <div className="mt-1 font-mono text-[11px] text-[var(--color-text-muted)]">
            Próxima entrega · {c.proximaEntrega}
          </div>
        </div>
      )}

      {c.kind === "distribucion" && (
        <Grid>
          <Cell n={c.entregasHoy} l="entregas hoy" />
          <Cell n={c.familiasRuta} l="familias en ruta" />
          <Cell n={c.vehiculosActivos} l="vehículos" />
        </Grid>
      )}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-2">{children}</div>;
}

function Cell({ n, l }: { n: number | string; l: string }) {
  return (
    <div>
      <div className="font-display font-semibold text-[18px] leading-none">{n}</div>
      <div className="mt-1 text-[10px] uppercase tracking-label text-[var(--color-text-muted)] leading-tight">
        {l}
      </div>
    </div>
  );
}
