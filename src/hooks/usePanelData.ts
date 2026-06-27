import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface DonationRow {
  id: string;
  donor_id: string | null;
  center_id: string | null;
  type: string;
  description: string | null;
  amount: number | null;
  currency: string | null;
  from_country: string | null;
  company_name: string | null;
  tax_id: string | null;
  status: string;
  created_at: string;
  delivered_at: string | null;
}

export interface RouteRow {
  id: string;
  carrier_id: string | null;
  origin_center: string | null;
  dest_center: string | null;
  origin_label: string | null;
  dest_label: string | null;
  cargo_summary: string | null;
  status: string;
  scheduled_for: string | null;
  delivered_at: string | null;
  created_at: string;
}

const DONATION_COLS =
  "id, donor_id, center_id, type, description, amount, currency, from_country, company_name, tax_id, status, created_at, delivered_at";
const ROUTE_COLS =
  "id, carrier_id, origin_center, dest_center, origin_label, dest_label, cargo_summary, status, scheduled_for, delivered_at, created_at";

export function useMyDonations(userId: string | null) {
  const [items, setItems] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("donations")
      .select(DONATION_COLS)
      .eq("donor_id", userId)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setItems((data as DonationRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    reload();
  }, [userId]);

  return { items, loading, reload };
}

export function useMyRoutes(userId: string | null) {
  const [items, setItems] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("routes")
      .select(ROUTE_COLS)
      .eq("carrier_id", userId)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setItems((data as RouteRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    reload();
  }, [userId]);

  return { items, loading, reload };
}

export interface AggregateStats {
  centers_total: number;
  centers_verified: number;
  centers_pending: number;
  donations_total: number;
  donations_delivered: number;
  routes_total: number;
  routes_in_transit: number;
  volunteers_total: number;
}

export function useAggregateStats() {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const [centers, donations, routes, volunteers] = await Promise.all([
      supabase.from("centers").select("verified_at", { count: "exact", head: false }),
      supabase.from("donations").select("status", { count: "exact", head: false }),
      supabase.from("routes").select("status", { count: "exact", head: false }),
      supabase.from("volunteers").select("status", { count: "exact", head: true }),
    ]);

    const centersData = (centers.data as Array<{ verified_at: string | null }>) ?? [];
    const donationsData = (donations.data as Array<{ status: string }>) ?? [];
    const routesData = (routes.data as Array<{ status: string }>) ?? [];

    setStats({
      centers_total: centers.count ?? centersData.length,
      centers_verified: centersData.filter((c) => c.verified_at).length,
      centers_pending: centersData.filter((c) => !c.verified_at).length,
      donations_total: donations.count ?? donationsData.length,
      donations_delivered: donationsData.filter((d) => d.status === "delivered").length,
      routes_total: routes.count ?? routesData.length,
      routes_in_transit: routesData.filter((r) => r.status === "in_transit").length,
      volunteers_total: volunteers.count ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  return { stats, loading, reload };
}
