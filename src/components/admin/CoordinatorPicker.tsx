import { useEffect, useMemo, useRef, useState } from "react";
import { ROLE_LABEL, type ProfileRole } from "@/hooks/useProfile";
import { TextInput } from "@/components/ui-vh/Field";

export interface CoordinatorCandidate {
  id: string;
  full_name: string | null;
  email: string | null;
  role: ProfileRole;
  center_id: string | null;
}

interface Props {
  candidates: CoordinatorCandidate[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

const MAX_VISIBLE = 20;

function matches(c: CoordinatorCandidate, q: string): boolean {
  if (!q) return true;
  const hay = `${c.full_name ?? ""} ${c.email ?? ""}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function labelFor(c: CoordinatorCandidate): string {
  return c.full_name?.trim() || c.email || "(sin nombre)";
}

export function CoordinatorPicker({ candidates, value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => candidates.find((c) => c.id === value) ?? null,
    [candidates, value],
  );

  const filtered = useMemo(() => candidates.filter((c) => matches(c, query)), [candidates, query]);
  const visible = filtered.slice(0, MAX_VISIBLE);
  const hiddenCount = filtered.length - visible.length;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const pick = (c: CoordinatorCandidate) => {
    onChange(c.id);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown") {
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlight >= 0 && visible[highlight]) {
      e.preventDefault();
      pick(visible[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  if (selected) {
    return (
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-md border-hair border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] min-w-[200px]"
        style={{ borderWidth: "0.5px" }}
      >
        <span className="truncate flex-1" title={selected.email ?? ""}>
          {labelFor(selected)}
        </span>
        <button
          type="button"
          onClick={clear}
          aria-label="Quitar selección"
          className="text-[var(--color-text-muted)] hover:text-[var(--color-critical)] px-1"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative min-w-[220px]">
      <TextInput
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? "Buscar por nombre o email…"}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open && (
        <div className="absolute right-0 left-0 z-20 mt-1 rounded-md border-hair border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden">
          {visible.length === 0 ? (
            <p className="px-3 py-3 text-[12px] text-[var(--color-text-muted)]">
              Sin coincidencias
            </p>
          ) : (
            <>
              <ul role="listbox" className="max-h-72 overflow-auto">
                {visible.map((c, i) => (
                  <li
                    key={c.id}
                    role="option"
                    aria-selected={highlight === i}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(c);
                    }}
                    onMouseEnter={() => setHighlight(i)}
                    className={`px-3 py-2 cursor-pointer ${
                      highlight === i
                        ? "bg-[var(--color-surface-alt)]"
                        : "hover:bg-[var(--color-surface-alt)]"
                    }`}
                  >
                    <div className="text-[13px] text-[var(--color-text-main)]">
                      {labelFor(c)}{" "}
                      <span className="text-[var(--color-text-muted)]">
                        · {ROLE_LABEL[c.role] ?? c.role}
                      </span>
                      {c.center_id && (
                        <span className="text-[var(--color-caution)] ml-1">(ya coord.)</span>
                      )}
                    </div>
                    {c.email && (
                      <div className="text-[11px] text-[var(--color-text-muted)] font-mono truncate">
                        {c.email}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {hiddenCount > 0 && (
                <p className="px-3 py-2 text-[11px] text-[var(--color-text-muted)] border-t border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                  Mostrando {visible.length} de {filtered.length} — refina tu búsqueda
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
