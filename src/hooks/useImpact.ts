import { IMPACT_METRICS, RECENT_ACTIVITY, TOP_DEMAND } from "@/data/mock";

export function useImpact() {
  return {
    metrics: IMPACT_METRICS,
    topDemand: TOP_DEMAND,
    recentActivity: RECENT_ACTIVITY,
    porTipo: IMPACT_METRICS.porTipo,
    isLoading: false as const,
  };
}
