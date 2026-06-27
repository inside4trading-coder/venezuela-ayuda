export interface NominatimAddress {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: NominatimAddress;
  place_id?: number;
  osm_type?: string;
}

const BASE = "https://nominatim.openstreetmap.org";
const COMMON = "format=jsonv2&addressdetails=1&accept-language=es";

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") return null;
    console.warn("nominatim fetch failed:", err);
    return null;
  }
}

export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<NominatimResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `${BASE}/search?${COMMON}&limit=5&countrycodes=ve&q=${encodeURIComponent(q)}`;
  const data = await fetchJson<NominatimResult[]>(url, signal);
  return Array.isArray(data) ? data : [];
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<NominatimResult | null> {
  const url = `${BASE}/reverse?${COMMON}&lat=${lat}&lon=${lon}`;
  return await fetchJson<NominatimResult>(url, signal);
}

export function extractCity(addr: NominatimAddress): string {
  return (
    addr.city ??
    addr.town ??
    addr.village ??
    addr.municipality ??
    addr.suburb ??
    addr.neighbourhood ??
    addr.county ??
    ""
  );
}
