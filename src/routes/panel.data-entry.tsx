import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PanelLayout } from "@/components/panel/PanelLayout";
import { ProfileFields } from "@/components/panel/ProfileFields";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { InventoryItemsTable } from "@/components/centers/InventoryItemsTable";

export const Route = createFileRoute("/panel/data-entry")({
  head: () => ({ meta: [{ title: "Panel de carga · Venezuela Ayuda" }] }),
  component: DataEntryPanel,
});

interface CenterRow {
  id: string;
  name: string | null;
  type: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
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

function DataEntryPanel() {
  const { profile, isVerified } = useProfile();
  const [centers, setCenters] = useState<CenterRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ID del centro cuyo inventario está desplegado (null = ninguno)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id || !isVerified) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("centers")
        .select("id, name, type, city, state, created_at, verified_at")
        .eq("created_by", profile.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) console.error(error);
      setCenters((data as CenterRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [profile?.id, isVerified]);

  const pendingCount = centers.filter((c) => !c.verified_at).length;
  const verifiedCount = centers.length - pendingCount;

  return (
    <PanelLayout
      expectedRoles={["data_entry"]}
      title="Carga de datos"
      subtitle="Registra centros en lote. No se te asignan como coordinador; un admin los vincula a coordinadores reales después."
    >
      {profile && <ProfileFields profile={profile} />}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display font-semibold text-[18px]">Centros que has cargado</h2>
          <Link
            to="/registrar-centro"
            className="h-10 px-4 rounded-md bg-[var(--color-critical)] text-white text-[13px] font-display font-semibold leading-[40px]"
          >
            + Registrar nuevo centro
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Total cargados" value={centers.length} />
          <Stat label="Pendientes de verificación" value={pendingCount} />
          <Stat label="Verificados" value={verifiedCount} />
        </div>

        {loading ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
        ) : centers.length === 0 ? (
          <div className="rounded-lg border-hair border-[var(--color-border)] p-6 text-center text-[13px] text-[var(--color-text-muted)]">
            Aún no has cargado centros. Empieza con el botón de arriba.
          </div>
        ) : (
          <div className="rounded-lg border-hair border-[var(--color-border)] overflow-hidden divide-y divide-[var(--color-border)]">
            {centers.map((c) => (
              <CenterAccordion
                key={c.id}
                center={c}
                open={expandedId === c.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === c.id ? null : c.id))
                }
              />
            ))}
          </div>
        )}
      </section>
    </PanelLayout>
  );
}

// ─── Acordeón por centro ──────────────────────────────────────────────────────

interface CenterAccordionProps {
  center: CenterRow;
  open: boolean;
  onToggle: () => void;
}

function CenterAccordion({ center, open, onToggle }: CenterAccordionProps) {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Cargar inventario la primera vez que se abre
  useEffect(() => {
    if (!open || loaded) return;
    let active = true;
    (async () => {
      setLoadingInv(true);
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, center_id, name, category, quantity, unit, status")
        .eq("center_id", center.id);
      if (!active) return;
      if (error) console.error(error);
      setInventory((data as InventoryRow[]) ?? []);
      setLoaded(true);
      setLoadingInv(false);
    })();
    return () => {
      active = false;
    };
  }, [open, loaded, center.id]);

  const addItem = async (item: { name: string; quantity: number; unit: string; status: string }) => {
    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        center_id: center.id,
        name: item.name || null,
        quantity: item.quantity,
        unit: item.unit || null,
        status: item.status || null,
      })
      .select("id, center_id, name, category, quantity, unit, status")
      .single();
    if (error) {
      console.error(error);
      toast.error(error.message || "No se pudo añadir el ítem");
      return;
    }
    setInventory((xs) => [...xs, data as InventoryRow]);
    toast.success("Ítem añadido");
  };

  const updateItem = async (id: string, patch: Partial<InventoryRow>) => {
    setInventory((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await supabase
      .from("inventory_items")
      .update(patch)
      .eq("id", id);
    if (error) {
      console.error(error);
      toast.error("No se pudo actualizar");
    }
  };

  const deleteItem = async (id: string) => {
    const prev = inventory;
    setInventory((xs) => xs.filter((x) => x.id !== id));
    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", id);
    if (error) {
      console.error(error);
      toast.error("No se pudo borrar");
      setInventory(prev);
    }
  };

  return (
    <div>
      {/* Fila del centro */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-3 py-3 text-left hover:bg-[var(--color-surface-alt)] transition-colors"
      >
        <div className="min-w-0">
          <Link
            to="/centro/$id"
            params={{ id: center.id }}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-[14px] hover:underline truncate block"
          >
            {center.name ?? "(sin nombre)"}
          </Link>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            {[center.type, center.city, center.state].filter(Boolean).join(" · ")}{" "}
            — {new Date(center.created_at).toLocaleDateString("es-VE")}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {center.verified_at ? (
            <span className="text-[11px] uppercase tracking-label px-2 py-0.5 rounded-sm border-hair border-[var(--color-resolved)] text-[var(--color-resolved)]">
              Verificado
            </span>
          ) : (
            <span className="text-[11px] uppercase tracking-label px-2 py-0.5 rounded-sm border-hair border-[var(--color-caution)] text-[var(--color-caution)]">
              Pendiente
            </span>
          )}
          <span
            className="text-[var(--color-text-muted)] text-[11px] leading-none select-none"
            aria-hidden
          >
            {open ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {/* Panel de inventario desplegable */}
      {open && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5">
          <InventoryItemsTable
            items={inventory}
            onAdd={addItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
            loading={loadingInv}
            title={`Inventario — ${center.name ?? "este centro"}`}
          />
        </div>
      )}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border-hair border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="font-display font-semibold text-[24px] leading-none">{value}</div>
      <div className="mt-2 text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
        {label}
      </div>
    </div>
  );
}
