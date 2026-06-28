import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Survivor } from "@/hooks/useSurvivors";

interface Props {
  survivor: Survivor | null;
  onClose: () => void;
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

const KNOWN_DESC_KEYS = [
  "Edad",
  "Sexo",
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

export function SurvivorDetailDialog({ survivor, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!survivor) return null;

  const badge = getEstadoFisicoBadge(survivor.estado_fisico);
  const { fields, otros } = parseDescription(survivor.descripcion);

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

  const ubicacionCompleta = [
    survivor.location_name,
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
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${badge.classes}`}
            >
              {badge.label}
            </span>
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

          {survivor.location_type && (
            <Row label="Tipo de lugar">{survivor.location_type}</Row>
          )}

          {survivor.age_approx != null && !fields.some(([k]) => k === "Edad") && (
            <Row label="Edad">{survivor.age_approx} años (aprox.)</Row>
          )}

          {survivor.gender && !fields.some(([k]) => k === "Sexo") && (
            <Row label="Género">{survivor.gender}</Row>
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
      </DialogContent>
    </Dialog>
  );
}
