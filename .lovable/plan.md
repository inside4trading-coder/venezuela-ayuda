# Landing explicativa en `/` con secciones por actor

El directorio actual (que hoy vive en `/`) pasa a `/centros`. La nueva landing toma `/` y explica cómo funciona la plataforma a los 4 actores. Sin datos reales, todo mock como el resto del MVP.

## 1. Ruta y navegación

- `src/routes/index.tsx` → reescrito como landing.
- `src/routes/centros.tsx` *(nuevo)* → recibe el contenido actual del home (directorio + filtros + grid de centros). Se mueve tal cual desde `index.tsx`.
- `Navbar`: agregar enlace "Centros" apuntando a `/centros`. El logo sigue yendo a `/`. El CTA "Registrar centro" se mantiene.
- `LiveTicker`: sin cambios.
- `routeTree.gen.ts` se regenera solo.

## 2. Estructura de la landing (media, una pantalla por bloque)

```text
┌─ Hero
│  H1, subtítulo, 2 CTAs (Ver centros · Registrar centro), microestado en vivo
├─ Cómo funciona (3 pasos)
│  1. Centros se registran  2. Mostramos qué necesitan  3. Tú llegas o donas
├─ Para cada actor (4 bloques apilados)
│  · Donadores particulares
│  · Voluntarios
│  · Coordinadores de centro
│  · Empresas y diáspora
├─ Tipos de centro (strip de 5 chips con KindBadge + microcopy)
├─ Impacto en vivo (4 métricas de useImpact + link a /impacto)
└─ Cierre: "Esto no reemplaza a nadie. Coordina." + CTAs finales
```

### Bloque por actor

Cada uno con la misma plantilla para mantener ritmo visual:

- Etiqueta corta en DM Mono uppercase (ej. `DONADOR`).
- Título de una línea ("Encuentra dónde tu donación rinde hoy").
- 2-3 bullets de qué puede hacer.
- 1 CTA contextual:
  - Donadores → `/centros?need=…`
  - Voluntarios → `/voluntarios`
  - Coordinadores → `/registrar-centro`
  - Empresas/diáspora → `/centros?kind=acopio,distribucion` + nota "Próximamente: convenios y constancias"

Layout: grid de 2 columnas en desktop (alternando lado de la etiqueta para romper monotonía sin ser decorativo), 1 columna en mobile. Borde superior 0.5px entre bloques.

### Tipos de centro

Reusar `KindBadge` existente. Strip horizontal con los 5 tipos + una línea de microcopy cada uno (sacada de `CENTER_KINDS` en `mock.ts`).

### Impacto en vivo

Reusar `useImpact()`. 4 números grandes (familias, centros activos, necesidades cubiertas hoy, voluntarios). Link "Ver desglose completo →" a `/impacto`.

## 3. Componentes

- `src/components/landing/Hero.tsx` *(nuevo)*
- `src/components/landing/HowItWorks.tsx` *(nuevo)* — 3 pasos
- `src/components/landing/ActorBlock.tsx` *(nuevo)* — plantilla reutilizable, props: `etiqueta, titulo, bullets[], cta:{label,to,params?}`
- `src/components/landing/KindStrip.tsx` *(nuevo)* — strip de los 5 tipos
- `src/components/landing/ImpactStrip.tsx` *(nuevo)* — 4 métricas + link

Sin nuevos tokens de color. Sin box-shadow (salvo `:focus-visible`). Tipografía y bordes 0.5px del sistema. Cero emojis y cero numeración decorativa — los pasos van con label en DM Mono (`PASO UNO`, `PASO DOS`, `PASO TRES`).

## 4. Archivos a tocar

- `src/routes/index.tsx` — reemplazo total: landing.
- `src/routes/centros.tsx` *(nuevo)* — contenido actual del home.
- `src/components/layout/Navbar.tsx` — agregar enlace "Centros".
- `src/components/landing/*` — 5 componentes nuevos.

## 5. Fuera de alcance

- No se tocan `/voluntarios`, `/registrar-centro`, `/necesidades`, `/impacto`, `/centro/$id`.
- No se modifica `mock.ts` ni hooks.
- No se agregan rutas extra (FAQ, equipo, manifiesto) — esos quedan para Fase 2 si los pides.
