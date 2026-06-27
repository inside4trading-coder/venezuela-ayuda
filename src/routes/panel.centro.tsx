import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { Field, Select, TextInput } from "@/components/ui-vh/Field";
import { AuthButton } from "@/components/auth/AuthButton";

export const Route = createFileRoute("/panel/centro")({
  head: () => ({
    meta: [{ title: "Panel · Mi centro · Venezuela Ayuda" }],
  }),
  component: CenterPanel,
});

interface CenterRow {
  id: string;
  name: string | null;
  type: string | null;
  status: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  capacity: number | null;
  capacity_used: number | null;
  verified_at: string | null;
}

interface InventoryRow {
  id: string;
  center_id: string;
  name: string;
  category: string | null;
  quantity: number;
  unit: string;
  status: string;
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "activo", label: "Activo" },
  { value: "critico", label: "Crítico / urgente" },
  { value: "lleno", label: "Capacidad llena" },
  { value: "inactivo", label: "Cerrado temporalmente" },
];

const INV_STATUS: Array<{ value: string; label: string }> = [
  { value: "ok", label: "OK" },
  { value: "bajo", label: "Bajo" },
  { value: "critico", label: "Crítico" },
];

// Etiquetas contextuales de capacidad según tipo de centro
const CAPACITY_LABELS: Record<string, { total: string; used: string }> = {
  albergue:     { total: "Capacidad familias",    used: "Familias actuales" },
  acopio:       { total: "Superficie almacén m²", used: "Ítems en stock" },
  medico:       { total: "Capacidad atenciones/día", used: "Atenciones hoy" },
  cocina:       { total: "Raciones/día capacidad",   used: "Raciones servidas hoy" },
  distribucion: { total: "Familias en ruta planeada", used: "Entregas hoy" },
};

const KIND_HINTS: Record<string, string> = {
  albergue:     "Mantén el conteo de familias actualizado para que voluntarios y donadores sepan si hay cupo.",
  acopio:       "Mantén el inventario al día; los transportistas leen esta información para programar rutas.",
  medico:       "Reporta atenciones diarias y marca como crítico cualquier medicamento que falte.",
  cocina:       "Actualiza raciones servidas y agrega insumos críticos al inventario.",
  distribucion: "Registra entregas diarias y coordina con transportistas vía /panel/transportista.",
};

function CenterPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profLoading, isCoordinator, isAdmin } = useProfile();
  const [center, setCenter] = useState<CenterRow | null>(null);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loadingCenter, setLoadingCenter] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", quantity: "", unit: "unidades", status: "ok" });

  const centerId = profile?.center_id ?? null;

  useEffect(() => {
    if (!centerId) {
      setLoadingCenter(false);
      return;
    }
    let active = true;
    (async () => {
      setLoadingCenter(true);
      const { data: c, error: ce } = await supabase
        .from("centers")
        .select(
          "id, name, type, status, city, state, address, phone, capacity, capacity_used, verified_at"
        )
        .eq("id", centerId)
        .single();
      const { data: inv, error: ie } = await supabase
        .from("inventory_items")
        .select("id, center_id, name, category, quantity, unit, status")
        .eq("center_id", centerId);
      if (!active) return;
      if (ce) console.error(ce);
      if (ie) console.error(ie);
      setCenter((c as CenterRow) ?? null);
      setInventory((inv as InventoryRow[]) ?? []);
      setLoadingCenter(false);
    })();
    return () => {
      active = false;
    };
  }, [centerId]);

  if (authLoading || profLoading) return <Gate>Cargando…</Gate>;

  if (!user) {
    return (
      <Gate>
        <h1 className="font-display text-[22px] mb-2">Inicia sesión para acceder al panel</h1>
        <div className="flex justify-center mt-4"><AuthButton /></div>
      </Gate>
    );
  }

  if (!isCoordinator && !isAdmin) {
    return (
      <Gate>
        <h1 className="font-display text-[22px] mb-2">No tienes permisos de coordinador</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
          Solo los coordinadores asignados a un centro pueden ver este panel.
        </p>
        <Link to="/" className="text-[13px] text-[var(--color-operational)] underline">
          Volver al directorio
        </Link>
      </Gate>
    );
  }

  if (!centerId) {
    return (
      <Gate>
        <h1 className="font-display text-[22px] mb-2">Aún no estás vinculado a un centro</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-5">
          Registra tu centro y quedarás vinculado como coordinador pendiente de verificación.
        </p>
        <Link
          to="/registrar-centro"
          className="inline-block h-11 px-5 rounded-md bg-[var(--color-critical)] text-white font-display font-semibold text-[14px] leading-[44px]"
        >
          Registrar mi centro
        </Link>
      </Gate>
    );
  }

  if (loadingCenter) return <Gate>Cargando centro…</Gate>;
  if (!center) {
    return (
      <Gate>
        <h1 className="font-display text-[22px] mb-2">No encontramos tu centro</h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Puede haber sido eliminado o tu vínculo cambió. Contacta soporte.
        </p>
      </Gate>
    );
  }

  const saveCenter = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("centers")
      .update({
        name: center.name,
        status: center.status,
        capacity: center.capacity,
        capacity_used: center.capacity_used,
        phone: center.phone,
        address: center.address,
      })
      .eq("id", center.id);
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("No se pudo guardar");
    } else {
      toast.success("Centro actualizado");
    }
  };

  const addItem = async () => {
    const qty = parseFloat(newItem.quantity);
    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        center_id: center.id,
        name: newItem.name.trim() || null,
        quantity: isNaN(qty) ? 0 : qty,
        unit: newItem.unit?.trim() || null,
        status: newItem.status || null,
      })
      .select("id, center_id, name, category, quantity, unit, status")
      .single();
    if (error) {
      console.error(error);
      toast.error("No se pudo añadir el ítem");
      return;
    }
    setInventory((xs) => [...xs, data as InventoryRow]);
    setNewItem({ name: "", quantity: "", unit: "unidades", status: "ok" });
    toast.success("Ítem añadido");
  };

  const updateItem = async (id: string, patch: Partial<InventoryRow>) => {
    setInventory((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("inventory_items").update(patch).eq("id", id);
    if (error) {
      console.error(error);
      toast.error("No se pudo actualizar");
    }
  };

  const deleteItem = async (id: string) => {
    const prev = inventory;
    setInventory((xs) => xs.filter((x) => x.id !== id));
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("No se pudo borrar");
      setInventory(prev);
    }
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8 space-y-10">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-[28px] leading-tight">{center.name}</h1>
          <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
            {center.city}, {center.state} · {center.type}
          </p>
        </div>
        <div>
          {center.verified_at ? (
            <span className="text-[12px] uppercase tracking-label px-2 py-1 rounded-sm border-hair border-[var(--color-resolved)] text-[var(--color-resolved)]">
              Verificado
            </span>
          ) : (
            <span className="text-[12px] uppercase tracking-label px-2 py-1 rounded-sm border-hair border-[var(--color-caution)] text-[var(--color-caution)]">
              Pendiente de verificación
            </span>
          )}
        </div>
      </header>

      {center.type && KIND_HINTS[center.type] && (
        <div className="rounded-lg border-hair border-[var(--color-operational)] bg-[var(--color-surface)] p-4 text-[13px]"
             style={{ borderLeftWidth: "3px" }}>
          {KIND_HINTS[center.type]}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-display font-semibold text-[18px]">Datos del centro</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre">
            <TextInput value={center.name ?? ""} onChange={(e) => setCenter({ ...center, name: e.target.value })} />
          </Field>
          <Field label="Estado operativo">
            <Select value={center.status ?? "activo"} onChange={(e) => setCenter({ ...center, status: e.target.value })}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
          <Field label={CAPACITY_LABELS[center.type ?? ""]?.total ?? "Capacidad total"}>
            <TextInput type="number" min="0" value={center.capacity ?? ""} onChange={(e) => setCenter({ ...center, capacity: e.target.value === "" ? null : Number(e.target.value) })} />
          </Field>
          <Field label={CAPACITY_LABELS[center.type ?? ""]?.used ?? "Capacidad usada"}>
            <TextInput type="number" min="0" value={center.capacity_used ?? ""} onChange={(e) => setCenter({ ...center, capacity_used: e.target.value === "" ? null : Number(e.target.value) })} />
          </Field>
          <Field label="Teléfono">
            <TextInput value={center.phone ?? ""} onChange={(e) => setCenter({ ...center, phone: e.target.value })} />
          </Field>
          <Field label="Dirección">
            <TextInput value={center.address ?? ""} onChange={(e) => setCenter({ ...center, address: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveCenter}
            disabled={saving}
            className="h-10 px-5 rounded-md bg-[var(--color-critical)] text-white font-display font-semibold text-[14px] disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display font-semibold text-[18px]">Inventario</h2>

        <div className="rounded-lg border-hair border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-[14px]">
            <thead className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
              <tr className="text-left">
                <th className="px-3 py-2 font-normal">Ítem</th>
                <th className="px-3 py-2 font-normal w-[120px]">Cantidad</th>
                <th className="px-3 py-2 font-normal w-[120px]">Unidad</th>
                <th className="px-3 py-2 font-normal w-[140px]">Estado</th>
                <th className="px-3 py-2 font-normal w-[80px]"></th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((it, i) => (
                <tr key={it.id} className={i % 2 === 0 ? "bg-[var(--color-surface-alt)]" : ""}>
                  <td className="px-3 py-2">
                    <input
                      className="w-full bg-transparent outline-none"
                      defaultValue={it.name}
                      onBlur={(e) => e.target.value !== it.name && updateItem(it.id, { name: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="w-full bg-transparent outline-none font-mono"
                      defaultValue={it.quantity}
                      onBlur={(e) => Number(e.target.value) !== it.quantity && updateItem(it.id, { quantity: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full bg-transparent outline-none"
                      defaultValue={it.unit}
                      onBlur={(e) => e.target.value !== it.unit && updateItem(it.id, { unit: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="bg-transparent outline-none text-[13px]"
                      value={it.status}
                      onChange={(e) => updateItem(it.id, { status: e.target.value })}
                    >
                      {INV_STATUS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => deleteItem(it.id)}
                      className="text-[12px] text-[var(--color-critical)] hover:underline"
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-[13px] text-[var(--color-text-muted)]">
                    Sin ítems aún. Añade el primero abajo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_140px_auto] gap-3 items-end">
          <Field label="Nuevo ítem">
            <TextInput placeholder="Agua potable" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
          </Field>
          <Field label="Cantidad">
            <TextInput type="number" min="0" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} />
          </Field>
          <Field label="Unidad">
            <TextInput value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
          </Field>
          <Field label="Estado">
            <Select value={newItem.status} onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}>
              {INV_STATUS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
          <button
            type="button"
            onClick={addItem}
            className="h-10 px-4 rounded-md bg-[var(--color-text-main)] text-[var(--color-bg)] font-display font-semibold text-[13px] disabled:opacity-50"
          >
            Añadir
          </button>
        </div>
      </section>
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[520px] mx-auto px-4 py-16 text-center">{children}</div>;
}
