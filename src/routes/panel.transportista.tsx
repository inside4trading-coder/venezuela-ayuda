import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PanelLayout } from "@/components/panel/PanelLayout";
import { ProfileFields } from "@/components/panel/ProfileFields";
import { useProfile } from "@/hooks/useProfile";
import { useMyRoutes } from "@/hooks/usePanelData";
import { Field, Select, TextInput, TextArea } from "@/components/ui-vh/Field";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/panel/transportista")({
  head: () => ({ meta: [{ title: "Panel transportista · Venezuela Ayuda" }] }),
  component: CarrierPanel,
});

function CarrierPanel() {
  const { profile } = useProfile();
  const { items, loading, reload } = useMyRoutes(profile?.id ?? null);
  const [form, setForm] = useState({
    origin_label: "",
    dest_label: "",
    cargo_summary: "",
    status: "planned",
  });
  const [creating, setCreating] = useState(false);

  const createRoute = async () => {
    if (!profile || !form.origin_label.trim() || !form.dest_label.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("routes").insert({
      carrier_id: profile.id,
      origin_label: form.origin_label.trim(),
      dest_label: form.dest_label.trim(),
      cargo_summary: form.cargo_summary.trim() || null,
      status: form.status,
    });
    setCreating(false);
    if (error) {
      console.error(error);
      toast.error("No se pudo crear la ruta");
      return;
    }
    setForm({ origin_label: "", dest_label: "", cargo_summary: "", status: "planned" });
    toast.success("Ruta registrada");
    reload();
  };

  const updateStatus = async (id: string, status: string) => {
    const patch: Record<string, any> = { status };
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("routes").update(patch).eq("id", id);
    if (error) {
      toast.error("No se pudo actualizar");
      return;
    }
    reload();
  };

  return (
    <PanelLayout
      expectedRoles={["transportista"]}
      title="Tu panel de transportista"
      subtitle="Registra rutas de traslado y marca entregas."
    >
      {profile && <ProfileFields profile={profile} />}

      <section className="space-y-4">
        <h2 className="font-display font-semibold text-[18px]">Nueva ruta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Origen">
            <TextInput
              value={form.origin_label}
              onChange={(e) => setForm({ ...form, origin_label: e.target.value })}
              placeholder="Acopio Catia"
            />
          </Field>
          <Field label="Destino">
            <TextInput
              value={form.dest_label}
              onChange={(e) => setForm({ ...form, dest_label: e.target.value })}
              placeholder="Albergue Macuto"
            />
          </Field>
        </div>
        <Field label="Resumen de carga">
          <TextArea
            value={form.cargo_summary}
            onChange={(e) => setForm({ ...form, cargo_summary: e.target.value })}
            placeholder="800 kg de agua + 200 colchonetas"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_auto] gap-3 items-end">
          <Field label="Estado">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="planned">Planeada</option>
              <option value="in_transit">En tránsito</option>
              <option value="delivered">Entregada</option>
            </Select>
          </Field>
          <button
            type="button"
            onClick={createRoute}
            disabled={creating || !form.origin_label.trim() || !form.dest_label.trim()}
            className="h-10 px-5 rounded-md bg-[var(--color-critical)] text-white font-display font-semibold text-[14px] disabled:opacity-50"
          >
            {creating ? "Creando…" : "Registrar ruta"}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-[18px]">Mis rutas ({items.length})</h2>
        {loading ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">Aún no has registrado rutas.</p>
        ) : (
          <div className="rounded-lg border-hair border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-[14px]">
              <thead className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)]">
                <tr className="text-left">
                  <th className="px-3 py-2 font-normal">Origen → Destino</th>
                  <th className="px-3 py-2 font-normal">Carga</th>
                  <th className="px-3 py-2 font-normal w-[160px]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-[var(--color-surface-alt)]" : ""}>
                    <td className="px-3 py-2">
                      {r.origin_label} → {r.dest_label}
                      <div className="text-[11px] font-mono text-[var(--color-text-muted)] mt-0.5">
                        {new Date(r.created_at).toLocaleDateString("es-VE")}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[13px]">
                      {r.cargo_summary ?? <span className="text-[var(--color-text-muted)]">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="text-[13px] bg-transparent outline-none"
                        value={r.status}
                        onChange={(e) => updateStatus(r.id, e.target.value)}
                      >
                        <option value="planned">Planeada</option>
                        <option value="in_transit">En tránsito</option>
                        <option value="delivered">Entregada</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PanelLayout>
  );
}
