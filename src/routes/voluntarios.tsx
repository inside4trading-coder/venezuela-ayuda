import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Field, Select, TextArea, TextInput } from "@/components/ui-vh/Field";
import { CheckGrid } from "@/components/ui-vh/CheckGrid";
import { ESTADOS_VENEZUELA } from "@/data/mock";
import { VOLUNTEER_ROLES } from "@/data/volunteer-roles";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/voluntarios")({
  head: () => ({
    meta: [
      { title: "Quiero ser voluntario · Venezuela Ayuda" },
      {
        name: "description",
        content: "Súmate a la red de voluntarios coordinados en los centros activos.",
      },
    ],
  }),
  component: VolunteersPage,
});

function VolunteersPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    estado: "",
    ciudad: "",
    disponibilidad: "",
    notas: "",
    roles: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleRole = (r: string) =>
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r],
    }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const blank = (s: string) => (s && s.trim() ? s.trim() : null);
      const { error } = await supabase.from("volunteers").insert({
        user_id: user?.id ?? null,
        name: blank(form.nombre),
        phone: blank(form.telefono),
        state: blank(form.estado),
        city: blank(form.ciudad),
        availability: blank(form.disponibilidad),
        notes: blank(form.notas),
        roles: form.roles,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Recibimos tu registro — te llamamos en menos de 24 horas");
      setForm({
        nombre: "",
        telefono: "",
        estado: "",
        ciudad: "",
        disponibilidad: "",
        notas: "",
        roles: [],
      });
      setDone(true);
    } catch (err: any) {
      console.error("Error registrando voluntario:", err);
      const detail = err?.message || err?.details || "";
      toast.error(
        detail ? `No se pudo registrar: ${detail}` : "Hubo un problema al registrarte.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto px-4 py-8 lg:py-12">
      <header className="mb-8">
        <h1 className="font-display font-semibold text-[28px] leading-tight">
          Quiero ser voluntario
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-text-muted)]">
          Te asignamos al centro más cercano que necesite tu perfil.
        </p>
      </header>

      {done && user && (
        <div
          className="mb-6 rounded-lg border-hair border-[var(--color-operational)] bg-[var(--color-surface)] p-4 text-[14px]"
          style={{ borderLeftWidth: "3px" }}
        >
          <p className="mb-2 font-medium">
            Como ya tienes cuenta, puedes ver los centros que coinciden con tu perfil
            y postularte directamente.
          </p>
          <Link
            to="/panel/voluntario"
            className="inline-block h-9 px-4 rounded-md bg-[var(--color-critical)] text-white text-[13px] font-display font-semibold leading-[36px]"
          >
            Ver centros que te necesitan
          </Link>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <Field label="Nombre completo">
          <TextInput
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Teléfono">
            <TextInput
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </Field>
          <Field label="Estado">
            <Select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {ESTADOS_VENEZUELA.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Ciudad o municipio">
          <TextInput
            value={form.ciudad}
            onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
          />
        </Field>
        <Field label="Disponibilidad">
          <Select
            value={form.disponibilidad}
            onChange={(e) => setForm({ ...form, disponibilidad: e.target.value })}
          >
            <option value="">Selecciona…</option>
            <option>Mañanas (entre semana)</option>
            <option>Tardes (entre semana)</option>
            <option>Fines de semana</option>
            <option>Tiempo completo / emergencia</option>
          </Select>
        </Field>

        <div>
          <div className="mb-2 text-[13px]">¿En qué puedes ayudar?</div>
          <CheckGrid options={VOLUNTEER_ROLES} selected={form.roles} onToggle={toggleRole} cols={2} />
        </div>

        <Field label="Notas (opcional)">
          <TextArea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Idiomas, formación médica, vehículo, etc."
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-md bg-[var(--color-critical)] text-white font-display font-semibold text-[16px] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Registrando…" : "Quiero ayudar"}
        </button>

        {!user && (
          <p className="text-center text-[12px] text-[var(--color-text-muted)]">
            <Link to="/" className="underline">
              Entra con Google
            </Link>{" "}
            para postularte a un centro específico y seguir el estado de tu solicitud.
          </p>
        )}
      </form>
    </div>
  );
}
