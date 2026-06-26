import { CENTER_KINDS, type CenterKind, type CenterStatus } from "@/data/mock";
import { countByKind } from "@/hooks/useCenters";

export interface FilterState {
  query: string;
  status: CenterStatus | "todos";
  needs: string[];
  kinds: CenterKind[];
}

const STATUSES: { value: CenterStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "urgente", label: "Urgente" },
  { value: "activo", label: "Activo" },
  { value: "capacidad-llena", label: "Capacidad llena" },
];

const NEEDS = ["Agua", "Alimentos", "Medicamentos", "Voluntarios", "Vehículos", "Combustible"];

export function FiltersPanel({
  value,
  onChange,
  visibleCount,
  total,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  visibleCount: number;
  total: number;
}) {
  const counts = countByKind();

  const toggleNeed = (n: string) => {
    const has = value.needs.includes(n);
    onChange({ ...value, needs: has ? value.needs.filter((x) => x !== n) : [...value.needs, n] });
  };
  const toggleKind = (k: CenterKind) => {
    const has = value.kinds.includes(k);
    onChange({ ...value, kinds: has ? value.kinds.filter((x) => x !== k) : [...value.kinds, k] });
  };

  return (
    <div className="p-5 space-y-6 text-[13px]">
      <div>
        <div className="mb-2 text-[11px] tracking-label uppercase text-[var(--color-text-muted)]">
          Tipo de centro
        </div>
        <div className="space-y-1.5">
          {CENTER_KINDS.map((k) => (
            <label key={k.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.kinds.includes(k.id)}
                onChange={() => toggleKind(k.id)}
                className="accent-[var(--color-operational)]"
                style={{ accentColor: `var(${k.colorVar})` }}
              />
              <span className="flex-1">{k.label}</span>
              <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                {counts[k.id]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11px] tracking-label uppercase text-[var(--color-text-muted)]">
          Búsqueda
        </div>
        <input
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Caracas, Maracay..."
          className="w-full border-hair border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 rounded-md text-[13px] placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      <div>
        <div className="mb-2 text-[11px] tracking-label uppercase text-[var(--color-text-muted)]">
          Estado operativo
        </div>
        <div className="space-y-1.5">
          {STATUSES.map((s) => (
            <label key={s.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                checked={value.status === s.value}
                onChange={() => onChange({ ...value, status: s.value })}
                className="accent-[var(--color-critical)]"
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11px] tracking-label uppercase text-[var(--color-text-muted)]">
          Necesita
        </div>
        <div className="space-y-1.5">
          {NEEDS.map((n) => (
            <label key={n} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value.needs.includes(n)}
                onChange={() => toggleNeed(n)}
                className="accent-[var(--color-operational)]"
              />
              <span>{n}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-hair border-[var(--color-border)] text-[12px] text-[var(--color-text-muted)] font-mono">
        Mostrando {visibleCount} de {total} centros
      </div>
    </div>
  );
}
