# Plan: 5 tipos de centro con flujos diferenciados

Nota sobre el mock: como pasamos de 3 a 5 tipos, en lugar de 9 centros voy con **10 centros (2 por tipo)** para mantener el directorio balanceado sin inflarlo. Si prefieres 15 (3 por tipo) lo ajusto.

## 1. Modelo de datos (`src/data/mock.ts`)

Nuevo discriminante `CenterKind`:

```text
"albergue" | "acopio" | "medico" | "cocina" | "distribucion"
```

`Center` se vuelve unión discriminada. Campos comunes: `id, nombre, kind, estado, ciudad, estadoVe, direccion, coordinador, telefono, email, horario, necesita[], tieneSuficiente[], actualizadoHaceMin`.

Campos específicos por `kind`:

- **albergue**: `familiasActuales`, `capacidadMax`, `capacidadPct`, `familiasHoy`
- **acopio**: `itemsEnInventario`, `salidasSemana`, `m2Almacen`, `vehiculosDisponibles`
- **medico**: `atencionesHoy`, `medicosActivos`, `medicamentosCriticos[]`, `tieneQuirofano: boolean`
- **cocina**: `racionesDia`, `racionesCapacidad`, `cocinerosActivos`, `proximaEntrega: string`
- **distribucion**: `familiasRuta`, `entregasHoy`, `zonasCubiertas[]`, `vehiculosActivos`

Catálogos nuevos: `CENTER_KINDS` con `{ id, label, labelPlural, microcopy, icon, color }`. Cada uno hereda un color semántico ya existente del sistema (sin agregar tokens nuevos): albergue → operational, acopio → text-main, médico → critical, cocina → caution, distribución → resolved.

10 centros mock (2 por tipo) con datos realistas en Caracas, La Guaira, Maracay, Valencia, San Felipe y Barquisimeto. Reemplazo total — los 6 actuales se descartan.

`TOP_DEMAND` y `RECENT_ACTIVITY` se reescriben para reflejar la mezcla de tipos (ej. "Cocina Catia preparó 800 raciones", "Acopio Chacao despachó 2 camiones").

`IMPACT_METRICS` agrega desglose por tipo: `{ albergues, acopios, medicos, cocinas, distribucion }` además de los totales.

## 2. Componentes UI nuevos (`src/components/ui-vh/`)

- **`KindBadge.tsx`** — pill tipográfica con label corto (ALB / ACO / MED / COC / DIST) + nombre completo opcional. Borde 0.5px con color del tipo, sin fill.
- **`KindMetric.tsx`** — componente polimórfico que recibe `center` y renderiza la métrica clave del tipo (barra, contador o lista corta) con la misma altura visual en todos los tipos para que las cards alineen.
- `CapacityBar` se mantiene, ahora solo usada por albergue/cocina.

## 3. Filtros (`src/components/centers/FiltersPanel.tsx`)

Nuevo bloque **superior** "Tipo de centro" — primera decisión del usuario. Lista vertical con checkbox por tipo + contador (`Albergues · 2`). Múltiple selección. Estado `kinds: CenterKind[]` en el filtro; vacío = todos.

Debajo siguen los filtros existentes: búsqueda, estado operacional, necesidades.

En mobile (sheet) el bloque de tipo aparece primero.

## 4. Hook (`src/hooks/useCenters.ts`)

`CenterFilters` agrega `kinds?: CenterKind[]`. Filtrado por intersección. Firma estable, devuelve siempre `{ centers, total, isLoading }`.

`useImpact` devuelve también el desglose por tipo.

## 5. Card (`src/components/centers/CenterCard.tsx`)

- Esquina superior izquierda: `KindBadge` (siempre visible, antes que el StatusPill).
- Header: nombre + ciudad.
- Cuerpo: `KindMetric` (cambia por tipo, misma altura reservada ~64px).
- Footer: necesidades top 3 + "actualizado hace Xm".
- Borde lateral izquierdo 2px con color del tipo (no del estado) — el estado va en pill arriba a la derecha. Esto hace el tipo legible desde lejos sin agregar peso visual.

## 6. Detalle de centro (`src/routes/centro.$id.tsx`)

Switch por `kind` en la columna principal:

- **albergue**: bloque "Capacidad familiar" con barra + cifras.
- **acopio**: bloque "Inventario y flujo" con items en almacén, salidas/semana, vehículos.
- **medico**: bloque "Atención médica" con atenciones/día, médicos activos, lista de medicamentos críticos, indicador de quirófano.
- **cocina**: bloque "Producción de raciones" con barra raciones/día vs capacidad + próxima entrega.
- **distribucion**: bloque "Rutas activas" con familias en ruta, entregas hoy, zonas cubiertas, vehículos.

Sidebar 40%: igual que ahora (necesidades + tiene + form de llegada), con el form adaptando el copy ("Llegar como voluntario" / "Coordinar entrega de donación" / "Ofrecer servicio médico" según tipo).

## 7. Formulario de registro (`src/routes/registrar-centro.tsx`)

Primera sección "Sobre el centro" — el campo `tipo` cambia de `iglesia/escuela/...` (que era infraestructura física) a **`kind`** (función operativa: albergue/acopio/médico/cocina/distribución). Infraestructura pasa a campo secundario "Tipo de espacio físico".

Sección "Situación actual" se vuelve condicional según `kind` seleccionado — campos dinámicos: si albergue muestra capacidad familiar; si acopio muestra m² y vehículos; si médico muestra médicos activos y especialidades; etc.

Microcopy debajo del selector de tipo explica brevemente cada flujo en una línea.

## 8. Página de impacto (`src/routes/impacto.tsx`)

Hero metrics: 4 cifras globales + **strip horizontal con desglose por tipo** debajo (5 chips: `47 albergues · 23 acopios · 12 puntos médicos · 8 cocinas · 6 rutas`).

Sección nueva "Por tipo de operación" con mini-cards (una por tipo) mostrando: total de centros, métrica agregada del tipo (familias alojadas / items movidos / atenciones / raciones / entregas), top necesidad.

`TOP_DEMAND` y tabla de actividad se mantienen pero los items mezclan acciones de los 5 tipos.

## 9. LiveTicker (`src/components/layout/LiveTicker.tsx`)

Los mensajes rotativos incluyen los 5 tipos para que la diversidad se perciba desde la primera pantalla.

## 10. Restricciones (sin cambios)

- Cero tokens de color nuevos — reuso del sistema actual.
- Cero box-shadow salvo `:focus-visible`.
- Tipografía y bordes 0.5px intactos.
- Sin numeración decorativa.
- Empty states como instrucción.
- Toasts vía sonner, sin persistencia.

## Detalles técnicos

- **Unión discriminada**: `Center` queda como `AlbergueCenter | AcopioCenter | MedicoCenter | CocinaCenter | DistribucionCenter`, todos extienden `BaseCenter`. Los componentes que renderizan campos específicos usan narrowing por `kind`.
- **Hooks**: firma sin cambios salvo el nuevo filtro `kinds`. Cero acoplamiento a la fuente de datos — sigue listo para Cloud en Fase 2.
- **Sin rutas nuevas**: la diferenciación por tipo se resuelve con filtros y badges, no con tabs ni rutas separadas (consistente con tu elección).
- **Sin numeración / sin emojis** en los badges de tipo: label de 3-4 letras en DM Mono uppercase con `tracking-label`.
- **Mobile**: el bloque de tipo en el sheet de filtros usa los mismos checkboxes, no un selector segmentado.

## Archivos a tocar

- `src/data/mock.ts` — reescritura completa de tipos y data
- `src/hooks/useCenters.ts`, `src/hooks/useImpact.ts` — soporte `kinds` y desglose
- `src/components/ui-vh/KindBadge.tsx` *(nuevo)*
- `src/components/ui-vh/KindMetric.tsx` *(nuevo)*
- `src/components/centers/CenterCard.tsx` — badge tipo + métrica polimórfica + borde lateral por tipo
- `src/components/centers/FiltersPanel.tsx` — bloque "Tipo de centro" arriba
- `src/components/layout/LiveTicker.tsx` — mensajes de los 5 tipos
- `src/routes/centro.$id.tsx` — bloques condicionales por kind + copy del form
- `src/routes/registrar-centro.tsx` — selector de kind + campos condicionales
- `src/routes/impacto.tsx` — desglose por tipo y mini-cards
- `src/routes/index.tsx` — pasar filtro `kinds` al hook
