import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Field, Select, TextArea, TextInput } from "@/components/ui-vh/Field";
import { ESTADOS_VENEZUELA } from "@/data/mock";
import { supabase } from "@/lib/supabase";

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

const ROLES = [
  "Logística en centro",
  "Conductor / vehículo propio",
  "Médico o enfermero",
  "Cocina y reparto de alimentos",
  "Atención a niños",
  "Comunicación / redes",
];

function VolunteersPage() {
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
    } catch (err: any) {
      console.error("Error registrando voluntario:", err);
      toast.error("Hubo un problema al registrarte. Intenta de nuevo.");
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

      <form onSubmit={onSubmit} className="space-y-6">
        <Field label="Nombre completo" required>
          <TextInput
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Teléfono" required>
            <TextInput
              required
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </Field>
          <Field label="Estado" required>
            <Select
              required
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
        <Field label="Ciudad o municipio" required>
          <TextInput
            required
            value={form.ciudad}
            onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
          />
        </Field>
        <Field label="Disponibilidad" required>
          <Select
            required
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
            {ROLES.map((r) => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.roles.includes(r)}
                  onChange={() => toggleRole(r)}
                  className="accent-[var(--color-operational)]"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
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
      </form>
    </div>
  );
}
