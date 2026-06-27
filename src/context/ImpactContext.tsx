import { createContext, useContext, type ReactNode } from "react";
import { useImpact } from "@/hooks/useImpact";
import type { ImpactMetrics, DemandItem, ActivityEntry } from "@/hooks/useImpact";

interface ImpactContextValue {
  metrics: ImpactMetrics;
  topDemand: DemandItem[];
  recentActivity: ActivityEntry[];
  porTipo: ImpactMetrics["porTipo"];
  isLoading: boolean;
}

const ImpactContext = createContext<ImpactContextValue | null>(null);

export function ImpactProvider({ children }: { children: ReactNode }) {
  const value = useImpact();
  return <ImpactContext.Provider value={value}>{children}</ImpactContext.Provider>;
}

/** Consume los métricos de impacto. Debe estar dentro de <ImpactProvider>. */
export function useImpactContext(): ImpactContextValue {
  const ctx = useContext(ImpactContext);
  if (!ctx) throw new Error("useImpactContext must be used inside <ImpactProvider>");
  return ctx;
}
