import { useMemo } from "react";
import { CENTERS } from "@/data/mock";

export function useInventory(centerId: string | undefined) {
  return useMemo(() => {
    const c = CENTERS.find((x) => x.id === centerId);
    return {
      necesita: c?.necesita ?? [],
      tieneSuficiente: c?.tieneSuficiente ?? [],
      isLoading: false as const,
    };
  }, [centerId]);
}
