import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CONSOLIDATED_CENTERS = [
  "Hospital Dr. José María Vargas",
  "Hospital Pérez Carreño",
  "Parque del Oeste Alí Primera",
  "Refugio Campo de Golf Caribe",
  "Hospital Domingo Luciani",
  "Hospital Universitario de Caracas",
  "Hospital Ana Francisca Pérez de León II",
  "Hospital Periférico de Catia",
  "Cruz Roja",
  "Refugio La Lucha",
  "Refugio Belo Horizonte",
  "Otro / Registro Externo"
];

export function getConsolidatedCenter(rawLoc: string | null | undefined): string | null {
  if (!rawLoc) return null;
  const loc = rawLoc.toLowerCase();
  
  if (loc.includes("vargas")) {
    return "Hospital Dr. José María Vargas";
  }
  if (loc.includes("perez carreco") || loc.includes("perez carreño") || loc.includes("carreño") || loc.includes("carreco")) {
    return "Hospital Pérez Carreño";
  }
  if (loc.includes("ali primera") || loc.includes("parque del oeste")) {
    return "Parque del Oeste Alí Primera";
  }
  if (loc.includes("golf caribe") || loc.includes("caribean golf") || loc.includes("campo de golf")) {
    return "Refugio Campo de Golf Caribe";
  }
  if (loc.includes("luciani")) {
    return "Hospital Domingo Luciani";
  }
  if (loc.includes("universitario")) {
    return "Hospital Universitario de Caracas";
  }
  if (loc.includes("perez de leon")) {
    return "Hospital Ana Francisca Pérez de León II";
  }
  if (loc.includes("periferico de catia") || loc.includes("periférico de catia")) {
    return "Hospital Periférico de Catia";
  }
  if (loc.includes("cruz roja")) {
    return "Cruz Roja";
  }
  if (loc.includes("lucha")) {
    return "Refugio La Lucha";
  }
  if (loc.includes("belo horizonte") || loc.includes("bello horizonte")) {
    return "Refugio Belo Horizonte";
  }
  
  return "Otro / Registro Externo";
}
