interface Props {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  cols?: 2 | 3;
}

/**
 * Grid de checkboxes para selección múltiple sobre un catálogo.
 * Usado por: registrar-centro, voluntarios (form público), panel.centro,
 * ProfileFields (skills de voluntario).
 */
export function CheckGrid({ options, selected, onToggle, cols = 3 }: Props) {
  const gridCls =
    cols === 2
      ? "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2";

  return (
    <div className={`${gridCls} text-[13px]`}>
      {options.map((o) => (
        <label key={o} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(o)}
            onChange={() => onToggle(o)}
            className="accent-[var(--color-operational)]"
          />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}
