import type { ReactNode } from "react";

interface Props {
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  className?: string;
  children?: ReactNode;
}

function buildMapsUrl(address?: string | null, lat?: number | null, lng?: number | null): string | null {
  if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (address && address.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return null;
}

export function AddressLink({ address, lat, lng, className, children }: Props) {
  const url = buildMapsUrl(address, lat, lng);
  const visibleText = children ?? address;
  if (!url || !visibleText) return null;

  const label = typeof visibleText === "string" ? visibleText : (address ?? "ubicación");

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Abrir en Google Maps: ${label}`}
      className={className ?? "text-[var(--color-operational)] hover:underline"}
    >
      {visibleText}
    </a>
  );
}
