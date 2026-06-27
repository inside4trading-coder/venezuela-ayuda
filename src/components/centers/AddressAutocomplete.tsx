import { useEffect, useRef, useState } from "react";
import { TextInput } from "@/components/ui-vh/Field";
import { extractCity, searchAddress, type NominatimResult } from "@/lib/nominatim";

export interface AddressPick {
  direccion: string;
  ciudad: string;
  estado: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelect: (picked: AddressPick) => void;
  placeholder?: string;
}

export function AddressAutocomplete({ value, onChange, onSelect, placeholder }: Props) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const lastPicked = useRef<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const q = value.trim();
    if (q.length < 3 || q === lastPicked.current) {
      setResults([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      const data = await searchAddress(q, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setResults(data);
      setOpen(data.length > 0);
      setHighlight(-1);
      setLoading(false);
    }, 500);
    return () => {
      clearTimeout(t);
      ctrl.abort();
      setLoading(false);
    };
  }, [value]);

  // Click outside closes
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

  const pick = (r: NominatimResult) => {
    const picked: AddressPick = {
      direccion: r.display_name,
      ciudad: extractCity(r.address),
      estado: r.address.state ?? "",
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    };
    lastPicked.current = picked.direccion;
    onChange(picked.direccion);
    onSelect(picked);
    setOpen(false);
    setResults([]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      pick(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? "Empieza a escribir la dirección…"}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-text-muted)]">
          Buscando…
        </span>
      )}
      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-auto rounded-md border-hair border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
        >
          {results.map((r, i) => (
            <li
              key={r.place_id ?? `${r.lat}-${r.lon}-${i}`}
              role="option"
              aria-selected={highlight === i}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(r);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`px-3 py-2 text-[13px] cursor-pointer ${
                highlight === i
                  ? "bg-[var(--color-surface-alt)]"
                  : "hover:bg-[var(--color-surface-alt)]"
              }`}
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
