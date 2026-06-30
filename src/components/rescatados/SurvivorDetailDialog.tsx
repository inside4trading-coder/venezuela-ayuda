import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Survivor } from "@/hooks/useSurvivors";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMarkSurvivorReunited } from "@/hooks/useMarkSurvivorReunited";
import { getConsolidatedCenter } from "@/lib/utils";

interface Props {
  survivor: Survivor | null;
  onClose: () => void;
  onUpdated?: () => void;
}

function getEstadoFisicoBadge(estado: string) {
  switch (estado) {
    case "estable":
      return { label: "Estable", classes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" };
    case "herido_leve":
      return { label: "Herido Leve", classes: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900" };
    case "herido_grave":
      return { label: "Herido Grave", classes: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900" };
    case "critico":
      return { label: "Crítico", classes: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900" };
    case "fallecido":
      return { label: "Fallecido", classes: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700" };
    default:
      return { label: estado || "Sin estado", classes: "bg-gray-100 text-gray-800 border-gray-200" };
  }
}

const IGNORE_DESC_KEYS = new Set(["Sexo"]);

const KNOWN_DESC_KEYS = [
  "Edad",
  "Procedencia",
  "Diagnóstico",
  "Condición",
  "Familiar",
  "Coment",
  "Área",
  "Piso/Cama",
  "Ubicación interna",
  "Contacto",
  "Edad/Det",
  "Sección",
  "Notas",
  "Centro",
  "Estado",
];

function parseDescription(desc: string | null): { fields: Array<[string, string]>; otros: string[] } {
  if (!desc) return { fields: [], otros: [] };
  const parts = desc.split(";").map((s) => s.trim()).filter(Boolean);
  const fields: Array<[string, string]> = [];
  const otros: string[] = [];
  for (const part of parts) {
    let skip = false;
    for (const key of IGNORE_DESC_KEYS) {
      if (part.startsWith(`${key}:`)) {
        skip = true;
        break;
      }
    }
    if (skip) continue;
    let matched = false;
    for (const key of KNOWN_DESC_KEYS) {
      const prefix = `${key}:`;
      if (part.startsWith(prefix)) {
        fields.push([key, part.slice(prefix.length).trim()]);
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (part.toLowerCase() === "menor de edad") {
        fields.push(["Menor de edad", "Sí"]);
      } else {
        otros.push(part);
      }
    }
  }
  return { fields, otros };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
      <dt className="text-[11px] uppercase tracking-label text-[var(--color-text-muted)] font-mono pt-0.5">
        {label}
      </dt>
      <dd className="text-[14px] text-[var(--color-text-main)] break-words">{children}</dd>
    </div>
  );
}

export function SurvivorDetailDialog({ survivor, onClose, onUpdated }: Props) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const { user } = useAuth();
  const { isAdmin } = useProfile();
  const { mark, unmark, busy } = useMarkSurvivorReunited();

  useEffect(() => {
    setConfirming(false);
    setNote("");
  }, [survivor?.id]);

  if (!survivor) return null;

  const badge = getEstadoFisicoBadge(survivor.estado_fisico);
  const { fields, otros } = parseDescription(survivor.descripcion);
  const isReunited = !!survivor.reunited_at;
  const noteValid = note.trim().length >= 5;

  const handleMark = async () => {
    const { ok, error } = await mark(survivor.id, note);
    if (!ok) {
      toast.error(error ?? "No se pudo marcar");
      return;
    }
    toast.success("Marcado como reunido con su familia");
    setConfirming(false);
    setNote("");
    onUpdated?.();
    onClose();
  };

  const handleUnmark = async () => {
    const { ok, error } = await unmark(survivor.id);
    if (!ok) {
      toast.error(error ?? "No se pudo deshacer");
      return;
    }
    toast.success("Marca de reencuentro removida");
    onUpdated?.();
    onClose();
  };

  const copyCedula = async () => {
    if (!survivor.cedula) return;
    try {
      await navigator.clipboard.writeText(survivor.cedula);
      setCopied(true);
      toast.success("Cédula copiada");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const centroConsolidado = getConsolidatedCenter(survivor.location_name);
  const ubicacionCompleta = [
    centroConsolidado,
    [survivor.current_city, survivor.current_state].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <Dialog open={!!survivor} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-[22px] pr-8">
            {survivor.full_name}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${badge.classes}`}
            >
              {badge.label}
            </span>
            {isReunited && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold border bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 inline-flex items-center gap-1">
                <HeartHandshake className="h-3 w-3" /> Reunido con familia
              </span>
            )}
            {survivor.verified ? (
              <span className="text-[11px] text-[var(--color-resolved)] uppercase tracking-label font-mono">
                ✓ Verificado
              </span>
            ) : (
              <span className="text-[11px] text-[var(--color-caution)] uppercase tracking-label font-mono">
                Pendiente
              </span>
            )}
          </div>
        </DialogHeader>

        {isReunited && (
          <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-[13px]">
            <p className="text-emerald-900 dark:text-emerald-200 font-medium">
              ✓ Reunido con su familia el{" "}
              {new Date(survivor.reunited_at!).toLocaleDateString("es-VE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {survivor.reunited_note && (
              <p className="text-emerald-800/80 dark:text-emerald-300/80 mt-1 italic">
                "{survivor.reunited_note}"
              </p>
            )}
            {isAdmin && survivor.registered_by !== "ayudaavzla.com" && (
              <button
                type="button"
                onClick={handleUnmark}
                disabled={busy}
                className="mt-2 text-[12px] text-[var(--color-critical)] hover:underline disabled:opacity-50"
              >
                Deshacer marca
              </button>
            )}
          </div>
        )}

        <dl className="mt-4">
          {survivor.cedula && (
            <Row label="Cédula">
              <div className="flex items-center gap-2">
                <span className="font-mono">{survivor.cedula}</span>
                <button
                  type="button"
                  onClick={copyCedula}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                  aria-label="Copiar cédula"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </Row>
          )}

          {ubicacionCompleta && <Row label="Ubicación">{ubicacionCompleta}</Row>}

          {survivor.location_name && centroConsolidado !== survivor.location_name && (
            <Row label="Detalle del lugar">
              <span className="italic">{survivor.location_name}</span>
            </Row>
          )}

          {survivor.location_type && (
            <Row label="Tipo de lugar">{survivor.location_type}</Row>
          )}

          {survivor.age_approx != null && !fields.some(([k]) => k === "Edad") && (
            <Row label="Edad">{survivor.age_approx} años (aprox.)</Row>
          )}

          {fields.map(([key, val], i) => (
            <Row key={`${key}-${i}`} label={key}>
              {val}
            </Row>
          ))}

          {otros.length > 0 && (
            <Row label="Otros datos">
              <ul className="list-disc pl-5 space-y-0.5">
                {otros.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </Row>
          )}

          {survivor.source_url && (
            <Row label="Fuente">
              <a
                href={survivor.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-operational)] hover:underline inline-flex items-center gap-1"
              >
                Ver fuente original <ExternalLink className="h-3 w-3" />
              </a>
            </Row>
          )}

          <Row label="Fecha de registro">
            {new Date(survivor.created_at).toLocaleString("es-VE", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Row>
        </dl>

        <p className="mt-4 text-[11px] text-[var(--color-text-muted)] italic">
          Si reconoces a esta persona como un familiar, confirma con el centro
          antes de movilizarte. Información cargada desde reportes oficiales.
        </p>

        {!isReunited && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            {survivor.registered_by === "ayudaavzla.com" || survivor.location_type === "Externo" ? (
              <div className="rounded-md border border-sky-100 dark:border-sky-950 bg-sky-50/50 dark:bg-sky-950/10 px-4 py-3 text-[13px] text-sky-850 dark:text-sky-350">
                <p className="font-semibold text-[14px]">Registro Externo (Lectura)</p>
                <p className="mt-1 text-sky-700 dark:text-sky-400">
                  Este registro proviene de **ayudaavzla.com**. Para notificar una reunificación familiar, debes hacerlo directamente en su plataforma.
                </p>
                {survivor.source_url && (
                  <a
                    href={survivor.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1f6fb2] hover:underline"
                  >
                    Ver en ayudaavzla.com <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ) : user ? (
              confirming ? (
                <div className="space-y-2">
                  <label className="block text-[12px] font-medium text-[var(--color-text-main)]">
                    Cuéntanos brevemente cómo se logró la reunión
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Ej. Lo encontró su hermana en el hospital esta mañana."
                    className="w-full px-3 py-2 text-[13px] rounded-md border-hair border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text-main)]"
                  />
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {note.trim().length}/5 caracteres mínimos
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirming(false);
                        setNote("");
                      }}
                      disabled={busy}
                      className="px-3 py-1.5 text-[13px] rounded-md border-hair border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleMark}
                      disabled={!noteValid || busy}
                      className="px-3 py-1.5 text-[13px] rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {busy ? "Guardando…" : "Confirmar reunión"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[13px] rounded-md border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium"
                >
                  <HeartHandshake className="h-4 w-4" />
                  Marcar como reunido con su familia
                </button>
              )
            ) : (
              <p className="text-[12px] text-[var(--color-text-muted)] text-center">
                Inicia sesión con Google desde el navbar para marcar la reunión con familia.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
