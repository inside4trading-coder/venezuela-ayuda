import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Field, Select, TextInput } from "@/components/ui-vh/Field";
import {
  InventoryItemsTable,
  type InventoryDraftItem,
} from "@/components/centers/InventoryItemsTable";
import { CheckGrid } from "@/components/ui-vh/CheckGrid";
import {
  CENTER_KINDS,
  ESTADOS_VENEZUELA,
  KIND_BY_ID,
  NEED_CATALOG,
  type CenterKind,
} from "@/data/mock";
import { VOLUNTEER_ROLES } from "@/data/volunteer-roles";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AuthButton } from "@/components/auth/AuthButton";

export const Route = createFileRoute("/registrar-centro")({
  head: () => ({
    meta: [
      { title: "Registrar centro · Venezuela Ayuda" },
      {
        name: "description",
        content:
          "Registra un centro de coordinación humanitaria para coordinar ayuda tras el terremoto.",
      },
    ],
  }),
  component: RegisterCenter,
});

type Kind = CenterKind | "";

interface FormState {
  nombre: string;
  kind: Kind;
  espacio: string;
  estadoVe: string;
  ciudad: string;
  direccion: string;
  coordinador: string;
  telefono: string;
  email: string;
  capacidadMax: string;
  familiasActuales: string;
  m2Almacen: string;
  vehiculosDisponibles: string;
  medicosActivos: string;
  tieneQuirofano: boolean;
  racionesCapacidad: string;
  cocinerosActivos: string;
  familiasRuta: string;
  zonasCubiertas: string;
  estado: string;
  necesita: string[];
  tiene: string[];
  necesitaVoluntarios: string[];
}

const EMPTY: FormState = {
  nombre: "",
  kind: "",
  espacio: "",
  estadoVe: "",
  ciudad: "",
  direccion: "",
  coordinador: "",
  telefono: "",
  email: "",
  capacidadMax: "",
  familiasActuales: "",
  m2Almacen: "",
  vehiculosDisponibles: "",
  medicosActivos: "",
  tieneQuirofano: false,
  racionesCapacidad: "",
  cocinerosActivos: "",
  familiasRuta: "",
  zonasCubiertas: "",
  estado: "",
  necesita: [],
  tiene: [],
  necesitaVoluntarios: [],
};

function RegisterCenter() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isAdmin, isDataEntry, isLoading: profLoading, refresh: refreshProfile } = useProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [inventarioInicial, setInventarioInicial] = useState<InventoryDraftItem[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  if (authLoading || profLoading) {
    return <Gate>Cargando…</Gate>;
  }

  if (!user) {
    return (
      <Gate>
        <h1 className="font-display text-[22px] mb-2">Inicia sesión para registrar tu centro</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-5">
          Necesitamos saber quién coordina el centro. Entra con Google y continúa.
        </p>
        <div className="flex justify-center"><AuthButton /></div>
      </Gate>
    );
  }

  if (profile?.role === "pending") {
    return (
      <Gate>
        <h1 className="font-display text-[22px] mb-2">Elige primero tu rol</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-5">
          Necesitamos saber cómo vas a participar en la plataforma.
        </p>
        <Link
          to="/onboarding"
          className="inline-block h-11 px-5 rounded-md bg-[var(--color-critical)] text-white font-display font-semibold text-[14px] leading-[44px]"
        >
          Ir a elegir rol
        </Link>
      </Gate>
    );
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleArr = (k: "necesita" | "tiene", v: string) =>
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
    }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      // Mapear status del form al schema de Supabase
      const statusMap: Record<string, string> = {
        urgente: "critico",
        activo: "activo",
        "capacidad-llena": "lleno",
        cerrado: "inactivo",
      };

      // Calcular capacity y capacity_used según tipo
      let capacity: number | null = null;
      let capacity_used: number | null = null;

      if (form.kind === "albergue") {
        capacity = parseInt(form.capacidadMax) || null;
        capacity_used = parseInt(form.familiasActuales) || null;
      } else if (form.kind === "acopio") {
        capacity = parseInt(form.m2Almacen) || null;
        capacity_used = null;
      } else if (form.kind === "medico") {
        capacity_used = parseInt(form.medicosActivos) || null;
      } else if (form.kind === "cocina") {
        capacity = parseInt(form.racionesCapacidad) || null;
      } else if (form.kind === "distribucion") {
        capacity = parseInt(form.familiasRuta) || null;
      }

      // Insertar el centro (RLS exige created_by = uid y verified_at = null)
      const blank = (s: string) => (s && s.trim() ? s.trim() : null);
      const { data: centerData, error: centerError } = await supabase
        .from("centers")
        .insert({
          name: blank(form.nombre),
          type: form.kind || null,
          status: form.estado ? (statusMap[form.estado] ?? "activo") : null,
          address: blank(form.direccion),
          city: blank(form.ciudad),
          state: blank(form.estadoVe),
          phone: blank(form.telefono),
          capacity,
          capacity_used,
          needed_roles: form.necesitaVoluntarios,
          verified_at: null,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (centerError) throw centerError;

      const centerId = centerData.id;

      // Vínculo automático como coordinador SOLO si el rol del usuario es
      // self-service tradicional (no admin, no data_entry). Admin y data_entry
      // cargan centros que se asignan a coordinadores reales después.
      if (!isAdmin && !isDataEntry) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ role: "coordinador", center_id: centerId })
          .eq("id", user.id);
        if (profileError) console.warn("No se pudo vincular coordinador:", profileError);
        else await refreshProfile();
      }

      // Insertar necesidades (catálogo de checkboxes)
      const needsToInsert = form.necesita.map((nombre) => ({
        center_id: centerId,
        nombre,
        nivel: "medio" as const,
        cantidad_aprox: "",
      }));

      if (needsToInsert.length > 0) {
        const { error: needsError } = await supabase
          .from("needs")
          .insert(needsToInsert);
        if (needsError) console.warn("Error insertando necesidades:", needsError);
      }

      // Carga inicial de inventario estructurado
      if (inventarioInicial.length > 0) {
        const inventoryRows = inventarioInicial.map(({ id: _drop, ...rest }) => ({
          ...rest,
          center_id: centerId,
        }));
        const { error: invError } = await supabase
          .from("inventory_items")
          .insert(inventoryRows);
        if (invError) console.warn("Error insertando inventario inicial:", invError);
      }

      // Registrar en activity_log
      await supabase.from("activity_log").insert({
        center_id: centerId,
        message: `Centro registrado: ${form.nombre}`,
      });

      toast.success(
        isDataEntry
          ? "Centro cargado — quedó pendiente de verificación y asignación de coordinador"
          : "Centro registrado — un admin lo revisará en menos de 2 horas",
      );
      setForm(EMPTY);
      setInventarioInicial([]);
      setErrors({});
      if (isDataEntry) navigate({ to: "/panel/data-entry" });
      else if (!isAdmin) navigate({ to: "/panel/centro" });
    } catch (err: any) {
      console.error("Error registrando centro:", err);
      const detail = err?.message || err?.error_description || err?.details || "";
      toast.error(detail ? `No se pudo registrar: ${detail}` : "Hubo un problema al registrar el centro.");
    } finally {
      setSubmitting(false);
    }
  };

  const kindMeta = form.kind ? KIND_BY_ID[form.kind] : null;

  return (
    <div className="max-w-[640px] mx-auto px-4 py-8 lg:py-12">
      <header className="mb-8">
        <h1 className="font-display font-semibold text-[28px] leading-tight">
          Registrar centro
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-text-muted)]">
          Si abriste un espacio para recibir familias, donaciones, atención médica, raciones o
          coordinar entregas, regístralo aquí. Verificamos antes de publicar.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-10" noValidate>
        <Section title="Sobre el centro">
          <Field label="Nombre del centro" required error={errors.nombre}>
            <TextInput value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </Field>

          <Field label="Tipo de operación" required error={errors.kind}>
            <Select
              value={form.kind}
              onChange={(e) => set("kind", e.target.value as Kind)}
            >
              <option value="">Selecciona…</option>
              {CENTER_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </Select>
            {kindMeta && (
              <span className="mt-1 block text-[12px] text-[var(--color-text-muted)]">
                {kindMeta.microcopy}
              </span>
            )}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tipo de espacio físico" required error={errors.espacio}>
              <TextInput
                value={form.espacio}
                onChange={(e) => set("espacio", e.target.value)}
                placeholder="Iglesia, escuela, galpón…"
              />
            </Field>
            <Field label="Estado" required error={errors.estadoVe}>
              <Select value={form.estadoVe} onChange={(e) => set("estadoVe", e.target.value)}>
                <option value="">Selecciona…</option>
                {ESTADOS_VENEZUELA.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Ciudad o municipio" required error={errors.ciudad}>
            <TextInput value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} />
          </Field>
          <Field label="Dirección exacta" required error={errors.direccion}>
            <TextInput
              value={form.direccion}
              onChange={(e) => set("direccion", e.target.value)}
            />
          </Field>
          <Field label="Coordinador" required error={errors.coordinador}>
            <TextInput
              value={form.coordinador}
              onChange={(e) => set("coordinador", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Teléfono" required error={errors.telefono}>
              <TextInput
                value={form.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                placeholder="+58 ..."
              />
            </Field>
            <Field label="Email" required error={errors.email}>
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Situación actual">
          {!form.kind && (
            <p className="text-[13px] text-[var(--color-text-muted)] italic">
              Selecciona primero el tipo de operación para mostrar los campos relevantes.
            </p>
          )}

          {form.kind === "albergue" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Capacidad máxima (familias)" required error={errors.capacidadMax}>
                <TextInput
                  type="number"
                  min="0"
                  value={form.capacidadMax}
                  onChange={(e) => set("capacidadMax", e.target.value)}
                />
              </Field>
              <Field label="Familias actualmente" required error={errors.familiasActuales}>
                <TextInput
                  type="number"
                  min="0"
                  value={form.familiasActuales}
                  onChange={(e) => set("familiasActuales", e.target.value)}
                />
              </Field>
            </div>
          )}

          {form.kind === "acopio" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Superficie de almacén (m²)" required error={errors.m2Almacen}>
                <TextInput
                  type="number"
                  min="0"
                  value={form.m2Almacen}
                  onChange={(e) => set("m2Almacen", e.target.value)}
                />
              </Field>
              <Field
                label="Vehículos disponibles"
                required
                error={errors.vehiculosDisponibles}
              >
                <TextInput
                  type="number"
                  min="0"
                  value={form.vehiculosDisponibles}
                  onChange={(e) => set("vehiculosDisponibles", e.target.value)}
                />
              </Field>
            </div>
          )}

          {form.kind === "medico" && (
            <>
              <Field label="Médicos activos" required error={errors.medicosActivos}>
                <TextInput
                  type="number"
                  min="0"
                  value={form.medicosActivos}
                  onChange={(e) => set("medicosActivos", e.target.value)}
                />
              </Field>
              <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tieneQuirofano}
                  onChange={(e) => set("tieneQuirofano", e.target.checked)}
                  className="accent-[var(--color-critical)]"
                />
                <span>Cuenta con quirófano de campaña</span>
              </label>
            </>
          )}

          {form.kind === "cocina" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Capacidad de raciones / día"
                required
                error={errors.racionesCapacidad}
              >
                <TextInput
                  type="number"
                  min="0"
                  value={form.racionesCapacidad}
                  onChange={(e) => set("racionesCapacidad", e.target.value)}
                />
              </Field>
              <Field label="Cocineros activos" required error={errors.cocinerosActivos}>
                <TextInput
                  type="number"
                  min="0"
                  value={form.cocinerosActivos}
                  onChange={(e) => set("cocinerosActivos", e.target.value)}
                />
              </Field>
            </div>
          )}

          {form.kind === "distribucion" && (
            <>
              <Field label="Familias en ruta" required error={errors.familiasRuta}>
                <TextInput
                  type="number"
                  min="0"
                  value={form.familiasRuta}
                  onChange={(e) => set("familiasRuta", e.target.value)}
                />
              </Field>
              <Field label="Zonas cubiertas">
                <TextInput
                  value={form.zonasCubiertas}
                  onChange={(e) => set("zonasCubiertas", e.target.value)}
                  placeholder="Macuto, Caraballeda, Naiguatá"
                />
              </Field>
            </>
          )}

          <Field label="Estado del centro" required error={errors.estado}>
            <Select value={form.estado} onChange={(e) => set("estado", e.target.value)}>
              <option value="">Selecciona…</option>
              <option value="activo">Activo</option>
              <option value="urgente">Urgente</option>
              <option value="capacidad-llena">Capacidad llena</option>
              <option value="cerrado">Cerrado temporalmente</option>
            </Select>
          </Field>
        </Section>

        <Section title="Qué necesitan">
          <CheckGrid
            options={NEED_CATALOG as readonly string[]}
            selected={form.necesita}
            onToggle={(v) => toggleArr("necesita", v)}
          />
        </Section>

        <Section title="Inventario inicial">
          <p className="text-[13px] text-[var(--color-text-muted)] -mt-1 mb-3">
            Carga lo que el centro ya tiene en stock (cantidad, unidad, estado).
            Los data entry y el coordinador podrán editar esto desde su panel.
          </p>
          <InventoryItemsTable
            items={inventarioInicial}
            onAdd={(item) =>
              setInventarioInicial((xs) => [
                ...xs,
                { ...item, id: crypto.randomUUID() },
              ])
            }
            onUpdate={(id, patch) =>
              setInventarioInicial((xs) =>
                xs.map((x) => (x.id === id ? { ...x, ...patch } : x)),
              )
            }
            onDelete={(id) =>
              setInventarioInicial((xs) => xs.filter((x) => x.id !== id))
            }
            emptyHint="Sin ítems aún. Es opcional — puedes cargar el inventario después."
          />
        </Section>

        <Section title="Qué tienen en abundancia">
          <CheckGrid
            options={NEED_CATALOG as readonly string[]}
            selected={form.tiene}
            onToggle={(v) => toggleArr("tiene", v)}
          />
        </Section>

        <Section title="Voluntarios que necesitas">
          <p className="text-[12px] text-[var(--color-text-muted)] -mt-1">
            Marca los perfiles que tu centro necesita ahora. Las personas inscritas
            como voluntarios verán tu centro en su panel y podrán postularse.
          </p>
          <CheckGrid
            options={VOLUNTEER_ROLES}
            selected={form.necesitaVoluntarios}
            onToggle={(v) =>
              setForm((f) => ({
                ...f,
                necesitaVoluntarios: f.necesitaVoluntarios.includes(v)
                  ? f.necesitaVoluntarios.filter((x) => x !== v)
                  : [...f.necesitaVoluntarios, v],
              }))
            }
            cols={2}
          />
        </Section>

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-md bg-[var(--color-critical)] text-white font-display font-semibold text-[16px] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Registrando…" : "Registrar centro"}
          </button>
          <p className="mt-3 text-[13px] text-[var(--color-text-muted)] text-center">
            Verificamos la información antes de publicarla. Te contactamos en menos de 2 horas.
          </p>
        </div>
      </form>
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[520px] mx-auto px-4 py-16 text-center">{children}</div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display font-semibold text-[22px] leading-tight">{title}</h2>
      <div className="h-px bg-[var(--color-border)]" />
      <div className="space-y-4 pt-2">{children}</div>
    </section>
  );
}
