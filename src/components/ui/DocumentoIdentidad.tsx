import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentoIdentidadProps {
  documentoTipo: "cedula" | "pasaporte";
  documentoNumero: string;
  onTipoChange: (tipo: "cedula" | "pasaporte") => void;
  onNumeroChange: (numero: string) => void;
  readOnly?: boolean;
  tipoError?: boolean;
  numeroError?: boolean;
}

export function DocumentoIdentidad({
  documentoTipo,
  documentoNumero,
  onTipoChange,
  onNumeroChange,
  readOnly = false,
  tipoError = false,
  numeroError = false,
}: DocumentoIdentidadProps) {
  const placeholder =
    documentoTipo === "cedula" ? "Ej: V-12345678" : "Ej: AB123456789";

  if (readOnly) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className="block mb-1.5 text-[13px] text-[var(--color-text-muted)] font-medium">
            Tipo de documento
          </span>
          <div className="text-[14px] text-[var(--color-text-main)]">
            {documentoTipo === "cedula"
              ? "Cédula de identidad (venezolano)"
              : "Pasaporte (extranjero)"}
          </div>
        </div>
        <div>
          <span className="block mb-1.5 text-[13px] text-[var(--color-text-muted)] font-medium">
            Número de documento
          </span>
          <div className="text-[14px] text-[var(--color-text-main)] font-mono">
            {documentoNumero || "—"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label className="text-[13px] text-[var(--color-text-main)]">
          Tipo de documento
        </Label>
        <Select
          value={documentoTipo}
          onValueChange={(val) => onTipoChange(val as "cedula" | "pasaporte")}
        >
          <SelectTrigger className={`w-full h-9 border border-input bg-transparent text-[14px] ${tipoError ? "border-red-500 focus:ring-red-500" : ""}`}>
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--color-surface)] border-[var(--color-border)]">
            <SelectItem value="cedula">Cédula de identidad (venezolano)</SelectItem>
            <SelectItem value="pasaporte">Pasaporte (extranjero)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[13px] text-[var(--color-text-main)]">
          Número de documento
        </Label>
        <Input
          type="text"
          value={documentoNumero}
          onChange={(e) => onNumeroChange(e.target.value)}
          placeholder={placeholder}
          className={`h-9 border border-input bg-transparent px-3 py-2 text-[14px] ${numeroError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
        />
      </div>
    </div>
  );
}
