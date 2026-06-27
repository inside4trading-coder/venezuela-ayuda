import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Need, NeedLevel } from "@/data/mock";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: string;
  category: string;
}

export function useInventory(centerId: string | undefined) {
  const [necesita, setNecesita] = useState<Need[]>([]);
  const [tieneSuficiente, setTieneSuficiente] = useState<string[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(!!centerId);

  useEffect(() => {
    if (!centerId) {
      setNecesita([]);
      setTieneSuficiente([]);
      setInventory([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    async function load() {
      try {
        // Necesidades del centro
        const { data: needsData } = await supabase
          .from("needs")
          .select("nombre, nivel, cantidad_aprox")
          .eq("center_id", centerId);

        // Inventario del centro
        const { data: inventoryData } = await supabase
          .from("inventory_items")
          .select("id, name, quantity, unit, status, category")
          .eq("center_id", centerId);

        if (!active) return;

        const needs: Need[] = (needsData ?? []).map((n) => ({
          nombre: n.nombre ?? "",
          nivel: (n.nivel as NeedLevel) ?? "medio",
          cantidadAprox: n.cantidad_aprox ?? "",
        }));

        const inv: InventoryItem[] = (inventoryData ?? []).map((i) => ({
          id: i.id,
          name: i.name ?? "",
          quantity: i.quantity ?? 0,
          unit: i.unit ?? "",
          status: i.status ?? "",
          category: i.category ?? "",
        }));

        // Items con stock suficiente (quantity > 0 y status != 'critico')
        const suficiente = inv
          .filter((i) => i.quantity > 0 && i.status !== "critico")
          .map((i) => i.name);

        setNecesita(needs);
        setTieneSuficiente(suficiente);
        setInventory(inv);
      } catch (err) {
        console.error("useInventory error:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [centerId]);

  return { necesita, tieneSuficiente, inventory, isLoading };
}
