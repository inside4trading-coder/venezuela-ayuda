import { useState } from "react";
import { toast } from "sonner";
import { extractCity, reverseGeocode } from "@/lib/nominatim";
import type { AddressPick } from "./AddressAutocomplete";

interface Props {
  onResolved: (picked: AddressPick) => void;
  disabled?: boolean;
}

const SUPPORTED = typeof navigator !== "undefined" && !!navigator.geolocation;

function geoMessage(code: number): string {
  if (code === 1) return "permiso denegado";
  if (code === 2) return "no disponible";
  if (code === 3) return "tiempo agotado";
  return "error desconocido";
}

export function UseMyLocationButton({ onResolved, disabled }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!SUPPORTED) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await reverseGeocode(latitude, longitude);
        const picked: AddressPick = {
          direccion: res?.display_name ?? "",
          ciudad: res ? extractCity(res.address) : "",
          estado: res?.address.state ?? "",
          lat: latitude,
          lng: longitude,
        };
        onResolved(picked);
        setLoading(false);
        toast.success(
          res
            ? "Ubicación detectada"
            : "Coordenadas obtenidas (completa la dirección manualmente)",
        );
      },
      (err) => {
        setLoading(false);
        toast.error(`No se pudo obtener tu ubicación: ${geoMessage(err.code)}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const isDisabled = disabled || loading || !SUPPORTED;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      title={!SUPPORTED ? "Tu navegador no soporta geolocalización" : undefined}
      className="h-10 px-3 rounded-md border-hair border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] font-medium text-[var(--color-text-main)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {loading ? "Detectando…" : "📍 Usar mi ubicación"}
    </button>
  );
}
