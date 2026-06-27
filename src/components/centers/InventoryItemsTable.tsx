import { useState } from "react";
import { Field, Select, TextInput } from "@/components/ui-vh/Field";

export interface InventoryDraftItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: string;
}

export const INV_STATUS: Array<{ value: string; label: string }> = [
  { value: "ok", label: "OK" },
  { value: "bajo", label: "Bajo" },
  { value: "critico", label: "Crítico" },
];

interface Props {
  items: InventoryDraftItem[];
  onAdd: (item: Omit<InventoryDraftItem, "id">) => void | Promise<void>;
  onUpdate: (id: string, patch: Partial<InventoryDraftItem>) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  loading?: boolean;
  title?: string;
  emptyHint?: string;
}

export function InventoryItemsTable({
  items,
  onAdd,
  onUpdate,
  onDelete,
  loading,
  title,
  emptyHint = "Sin ítems aún. Añade el primero abajo.",
}: Props) {
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    unit: "unidades",
    status: "ok",
  });

  const handleAdd = async () => {
    if (!newItem.name.trim()) return;
    const qty = parseFloat(newItem.quantity);
    await onAdd({
      name: newItem.name.trim(),
      quantity: Number.isFinite(qty) ? qty : 0,
      unit: newItem.unit?.trim() || "unidades",
      status: newItem.status || "ok",
    });
    setNewItem({ name: "", quantity: "", unit: "unidades", status: "ok" });
  };

  return (
    <div className="space-y-4">
      {title && <h3 className="font-display font-semibold text-[15px]">{title}</h3>}

      {loading ? (
        <p className="text-[13px] text-[var(--color-text-muted)]">Cargando inventario…</p>
      ) : (
        <>
          <div className="rounded-lg border-hair border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-[14px]">
              <thead className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
                <tr className="text-left">
                  <th className="px-3 py-2 font-normal">Ítem</th>
                  <th className="px-3 py-2 font-normal w-[110px]">Cantidad</th>
                  <th className="px-3 py-2 font-normal w-[110px]">Unidad</th>
                  <th className="px-3 py-2 font-normal w-[130px]">Estado</th>
                  <th className="px-3 py-2 font-normal w-[70px]"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr
                    key={it.id}
                    className={i % 2 === 0 ? "bg-[var(--color-surface-alt)]" : ""}
                  >
                    <td className="px-3 py-2">
                      <input
                        className="w-full bg-transparent outline-none"
                        defaultValue={it.name}
                        onBlur={(e) =>
                          e.target.value !== it.name &&
                          onUpdate(it.id, { name: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-full bg-transparent outline-none font-mono"
                        defaultValue={it.quantity}
                        onBlur={(e) =>
                          Number(e.target.value) !== it.quantity &&
                          onUpdate(it.id, { quantity: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full bg-transparent outline-none"
                        defaultValue={it.unit}
                        onBlur={(e) =>
                          e.target.value !== it.unit &&
                          onUpdate(it.id, { unit: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="bg-transparent outline-none text-[13px]"
                        value={it.status}
                        onChange={(e) => onUpdate(it.id, { status: e.target.value })}
                      >
                        {INV_STATUS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onDelete(it.id)}
                        className="text-[12px] text-[var(--color-critical)] hover:underline"
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-5 text-center text-[13px] text-[var(--color-text-muted)]"
                    >
                      {emptyHint}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px_110px_130px_auto] gap-3 items-end">
            <Field label="Nuevo ítem">
              <TextInput
                placeholder="Agua potable"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </Field>
            <Field label="Cantidad">
              <TextInput
                type="number"
                min="0"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              />
            </Field>
            <Field label="Unidad">
              <TextInput
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              />
            </Field>
            <Field label="Estado">
              <Select
                value={newItem.status}
                onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
              >
                {INV_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <button
              type="button"
              onClick={handleAdd}
              className="h-10 px-4 rounded-md bg-[var(--color-text-main)] text-[var(--color-bg)] font-display font-semibold text-[13px]"
            >
              Añadir
            </button>
          </div>
        </>
      )}
    </div>
  );
}
