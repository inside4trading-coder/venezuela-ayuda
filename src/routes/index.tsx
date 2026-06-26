import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useCenters } from "@/hooks/useCenters";
import { CenterCard } from "@/components/centers/CenterCard";
import { FiltersPanel, type FilterState } from "@/components/centers/FiltersPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Centros activos · Venezuela Ayuda" },
      {
        name: "description",
        content:
          "Directorio en vivo de centros de coordinación humanitaria tras el terremoto del 24 de junio de 2026.",
      },
    ],
  }),
  component: Directory,
});

function Directory() {
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    status: "todos",
    needs: [],
    kinds: [],
  });
  const { centers, total } = useCenters(filters);

  return (
    <div className="flex">
      {/* Sidebar desktop */}
      <aside
        className="hidden lg:block w-[260px] shrink-0 bg-[var(--color-surface-alt)] border-r border-hair border-[var(--color-border)] min-h-[calc(100vh-88px)]"
        style={{ borderRightWidth: "0.5px" }}
      >
        <FiltersPanel
          value={filters}
          onChange={setFilters}
          visibleCount={centers.length}
          total={total}
        />
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="font-display font-semibold text-[28px] leading-tight">
              Centros activos
            </h1>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
              {centers.length} centros visibles · actualizados en vivo
            </p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button
                className="lg:hidden inline-flex items-center gap-2 text-[13px] px-3 py-2 border-hair border-[var(--color-text-main)] rounded-md"
                style={{ borderWidth: "0.5px" }}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 bg-[var(--color-surface-alt)]">
              <FiltersPanel
                value={filters}
                onChange={setFilters}
                visibleCount={centers.length}
                total={total}
              />
            </SheetContent>
          </Sheet>
        </div>

        {centers.length === 0 ? (
          <div className="border-hair border-[var(--color-border)] rounded-lg p-10 text-center bg-[var(--color-surface)]">
            <p className="text-[15px] text-[var(--color-text-main)]">
              No hay centros que coincidan
            </p>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
              Ajusta los filtros o busca otra ciudad.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {centers.map((c) => (
              <CenterCard key={c.id} center={c} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
