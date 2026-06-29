# Venezuela Ayuda

**Plataforma de coordinación humanitaria en tiempo real — Terremoto Venezuela, 24 de junio de 2026**

> Conectamos donadores, voluntarios, centros de acopio, autoridades y familias afectadas en una sola plataforma operacional. Sin fricción. Sin burocracia. En vivo.

🔗 **Producción:** https://vnzla-ayuda.org/

---

## ¿Por qué existe esto?

El 24 de junio de 2026, Venezuela fue golpeada por un doble terremoto de magnitud 7.2 y 7.5 con epicentro en Yaracuy. Más de 900 muertos, miles de heridos, decenas de miles de familias desplazadas.

El problema no fue la falta de voluntad para ayudar. Fue la falta de coordinación.

- Donadores con agua y alimentos sin saber a qué centro llevarlos
- Centros de albergue desbordados de ropa y vacíos de medicamentos
- Voluntarios médicos sin saber dónde se necesitaban
- Cocinas comunitarias sin gas mientras otros centros tenían excedente
- Rutas de distribución paralizadas por falta de combustible y vehículos
- Familias buscando a sus seres queridos sin un registro central

**Venezuela Ayuda** es la capa de inteligencia que faltaba: un directorio en vivo que cruza oferta con demanda, en tiempo real, accesible desde cualquier teléfono.

---

## Qué hace la plataforma

### 5 tipos de centros coordinados

| Tipo | Qué hace | Métrica clave |
|------|----------|---------------|
| 🏠 **Albergue** | Aloja familias desplazadas | % ocupación / familias |
| 📦 **Acopio de donaciones** | Recibe y redistribuye especies | Ítems en stock / salidas |
| 🏥 **Punto médico** | Atención sanitaria de emergencia | Médicos activos / atenciones |
| 🍲 **Cocina comunitaria** | Prepara y distribuye alimentos | Raciones por día |
| 🚛 **Centro de distribución** | Última milla a familias | Entregas / vehículos activos |

### Módulos principales

- **Directorio de centros** (`/centros`) — filtros por tipo, estado, necesidades, capacidad
- **Necesidades agregadas** (`/necesidades`) — qué hace falta a nivel red, no centro a centro
- **Sobrevivientes** (`/rescatados`) — registro central de personas afectadas, con marcado de "reunido con familia", filtros por estado físico, cédula y ubicación
- **Edificios** (`/edificios`) — directorio de edificaciones con geolocalización automática vía Nominatim y calidad de datos con fuzzy matching
- **Voluntarios** (`/voluntarios`) — marketplace de roles abiertos por centro
- **Donaciones** (`/donaciones`) — alianza con la **Organización Solo Fe** para canalizar aportes
- **Impacto** (`/impacto`) — métricas públicas en vivo, incluyendo datos de la red ayudaavzla.com (sobrevivientes a salvo, en búsqueda)

### Panel por rol (10 perfiles)

Cada actor tiene su propio panel con permisos específicos vía RLS de Supabase:

| Panel | Para | Qué hace |
|-------|------|----------|
| `/panel/admin` | Administradores | Verificación de centros, gestión de roles, **herramienta de calidad de datos con fuzzy matching** para sobrevivientes y edificios |
| `/panel/autoridad` | Protección Civil, alcaldías | Vista táctica, georreferenciación |
| `/panel/centro` | Coordinadores de centro | Inventario en vivo, roles abiertos, estado |
| `/panel/data-entry` | Operadores de captura | Carga masiva de sobrevivientes y centros |
| `/panel/diaspora` | Venezolanos en el exterior | Métricas de impacto, dónde donar |
| `/panel/donador` | Donadores individuales | Historial, confirmaciones de entrega |
| `/panel/empresa` | Empresas patrocinadoras | Donaciones corporativas, branding |
| `/panel/ong` | ONGs aliadas | Integración de datos propios |
| `/panel/transportista` | Logística | Rutas activas, vehículos disponibles |
| `/panel/voluntario` | Voluntarios | Roles abiertos, postulaciones, asignaciones |

### Calidad de datos (Admin)

El panel de administración incluye una herramienta de **calidad de datos** con dos módulos:

1. **Sobrevivientes (Base de datos)** — detecta pares de registros con similitud ≥ 70% usando `pg_trgm` de PostgreSQL. Permite fusión manual (conservar A o B) o **limpieza automática** de todos los pares con similitud ≥ 78%.
2. **Edificios (Fuzzy Matching)** — detecta duplicados en el directorio de edificaciones usando distancia de Levenshtein desde el cliente. Geolocalización automática con la API de Nominatim.

---

## 🌐 API pública (datos abiertos)

Para que medios, ONG, otras apps y la red federada del [`endpoint-agent-kit`](https://github.com/Hainrixz/enpoint-agentkit) puedan consumir los datos sin depender del frontend.

### Endpoints

| Recurso | URL | Perfil del kit |
|---|---|---|
| Sobrevivientes (sin PII) | `/rest/v1/survivors_public` | `persona-desaparecida` |
| Centros de acopio | `/rest/v1/centers_public` | `general` |
| Inventario (lo que el centro **tiene**) | `/rest/v1/inventory_public` | `general` |
| Necesidades (lo que el centro **pide**) | `/rest/v1/needs_public` | `general` |
| Roles de voluntariado | `/rest/v1/volunteer_roles_public` | `general` |

**Host:** `https://kqtilzssuynblfkuqxyx.supabase.co`

### Headers obligatorios

```
apikey:         sb_publishable_udPVuneAoBbPorp0N0nd-w_pLgp36S8
Authorization:  Bearer sb_publishable_udPVuneAoBbPorp0N0nd-w_pLgp36S8
Accept-Profile: public
```

### Ejemplo

```bash
curl -H "apikey: sb_publishable_udPVuneAoBbPorp0N0nd-w_pLgp36S8" \
     -H "Authorization: Bearer sb_publishable_udPVuneAoBbPorp0N0nd-w_pLgp36S8" \
     -H "Accept-Profile: public" \
     "https://kqtilzssuynblfkuqxyx.supabase.co/rest/v1/survivors_public?select=*&limit=10"
```

### Garantías de privacidad

- **Sobrevivientes:** sin `cedula`. Menores de 18 con `person_name` y `age` enmascarados — sólo ciudad/estado.
- **Reunidos:** las personas marcadas como reunidas con su familia desaparecen del endpoint automáticamente.
- **Voluntarios:** no se exponen personas individuales — sólo qué roles abiertos hay por centro.

### Estado de verificación

Las vistas exponen **todos** los registros (verificados y no verificados). El consumidor distingue mediante:

- Campo booleano `verified` en cada fila.
- Tag `'no_verificado'` (sobrevivientes y centros) en el array `tags`.

Filtrar por verificados desde el cliente: agregá `?verified=eq.true` a la URL.

---

## Stack técnico

```
Frontend    React 19 + TypeScript + TanStack Router
Estilos     Vanilla CSS + sistema de tokens propio
Build       Vite 7
Deploy      Vercel (auto-deploy desde GitHub) → dominio https://vnzla-ayuda.org
Backend     Supabase (PostgreSQL + Auth + RLS + Storage + Realtime)
Auth        Google OAuth via Supabase
API pública Supabase PostgREST + vistas SQL filtradas (public.*_public)
Geocoding   Nominatim (OpenStreetMap) — sin costo, sin API key
Similitud   pg_trgm (PostgreSQL) — búsqueda de duplicados con índices GIN
```

### Sistema de diseño

La identidad visual está construida sobre un sistema de tokens CSS propio. Cada color tiene un significado operacional:

```css
--color-critical:    #C8102E   /* Urgente — rojo bandera venezolana */
--color-operational: #1A56DB   /* CTAs primarios — azul operacional */
--color-resolved:    #057A55   /* Cubierto / OK */
--color-caution:     #B45309   /* Capacidad llena — precaución */
--color-text-muted:  #6B7280   /* Metadata y timestamps */
```

Tipografía: **DM Sans** (display), **Inter** (UI y datos), **DM Mono** (timestamps y cantidades).

Manual de marca disponible en `/marca`.

---

## Arquitectura del código

```
src/
├── data/
│   ├── donaciones.ts        # Datos de la alianza Solo Fe
│   ├── volunteer-roles.ts   # Catálogo de roles
│   └── mock.ts              # Fixtures de desarrollo
├── hooks/                    # Toda la lógica de datos (Supabase + cache)
│   ├── useCenters.ts        # Directorio con degradación graceful
│   ├── useSurvivors.ts      # Sobrevivientes con paginación y filtros
│   ├── useImpact.ts         # Métricas en vivo (local + red externa)
│   ├── useLiveStats.ts      # Ticker operacional
│   ├── useMarkSurvivorReunited.ts
│   └── usePanelData.ts
├── lib/
│   ├── supabase.ts          # Cliente Supabase
│   ├── queries.ts           # Queries base
│   ├── nominatim.ts         # Geocoding (edificios)
│   └── requiredFields.ts
├── components/
│   ├── centers/             # CenterCard, FiltersPanel
│   ├── landing/             # Hero, HowItWorks, ActorBlock, KindStrip, ImpactStrip
│   ├── layout/              # LiveTicker, Navbar
│   └── ui/                  # Badge, StatusPill, CapacityBar, NeedTag, KindBadge
└── routes/
    ├── index.tsx, centros.tsx, centro.$id.tsx
    ├── donaciones.tsx, rescatados.tsx, necesidades.tsx, edificios.tsx
    ├── voluntarios.tsx, impacto.tsx, onboarding.tsx
    ├── registrar-centro.tsx, marca.tsx
    └── panel.{admin,autoridad,centro,data-entry,diaspora,
                donador,empresa,ong,transportista,voluntario}.tsx

supabase/
└── migrations/              # 20+ migraciones versionadas
    ├── 20260627_create_volunteers_donations_inventory.sql
    ├── 20260628_survivors_add_cedula.sql
    ├── 20260628_survivors_family_reunited.sql
    ├── 20260629_public_api_views.sql
    ├── 20260630_buildings_rls_policies.sql
    └── 20260630_survivors_merge_functions.sql  ← calidad de datos con SECURITY DEFINER

endpoints/                    # Propuestas para redes federadas
└── README.md                # Documentación de la API pública
```

---

## Correr localmente

**Prerrequisitos:** Node.js 18+ o Bun 1.0+

```bash
git clone https://github.com/inside4trading-coder/venezuela-ayuda.git
cd venezuela-ayuda

bun install
bun run dev          # http://localhost:3000

bun run build        # producción
bun run lint
```

### Variables de entorno

```bash
VITE_SUPABASE_URL=https://kqtilzssuynblfkuqxyx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

### Aplicar migraciones de Supabase

```bash
# Vía CLI de Supabase
supabase db push

# O manual: pegar contenido de supabase/migrations/*.sql en Dashboard → SQL Editor
```

> ⚠️ Las migraciones de calidad de datos (`20260630_survivors_merge_functions.sql`) requieren la extensión `pg_trgm` activa en la BD.

---

## Roadmap

### ✅ Fase 1 — MVP (24 jun 2026)
- Directorio de centros, filtros, cards por tipo
- Formularios de registro
- Métricas en vivo, live ticker
- Responsive mobile-first

### ✅ Fase 2 — Backend real (27 jun 2026)
- Supabase con schema completo + RLS por rol
- Google OAuth (login en 1 click)
- Datos reales — el SPA dejó de depender de mocks
- Realtime para inventario y ticker
- Verificación de centros por admin

### ✅ Fase 3 — Backoffice y roles (27-28 jun 2026)
- 10 paneles por rol con permisos vía RLS
- Panel admin: verificación, moderación, fusión de duplicados de sobrevivientes
- Carga masiva (data-entry) con detección de cédulas duplicadas
- Marcado de "reunido con familia" para sobrevivientes

### ✅ Fase 4 — Alianzas y datos abiertos (28-29 jun 2026)
- Módulo `/donaciones` con la **Organización Solo Fe**
- API pública (5 endpoints REST sobre vistas SQL filtradas)
- Integración con el `endpoint-agent-kit` para registro en redes federadas

### ✅ Fase 5 — Calidad de datos y enriquecimiento (29-30 jun 2026)
- Módulo **Edificios** (`/edificios`) con geolocalización automática vía Nominatim
- **Herramienta de calidad de datos** en panel admin: fuzzy matching con `pg_trgm`, limpieza automática de duplicados (umbral configurable)
- Funciones RPC de fusión con `SECURITY DEFINER` para evitar bloqueos de RLS
- Integración de métricas externas (red ayudaavzla.com) en hero y `/impacto`
- Dominio propio: **https://vnzla-ayuda.org**
- Módulo de sobrevivientes renombrado a `/rescatados` como CTA principal

### ⏳ Fase 6 — PWA y escala
- [ ] Progressive Web App instalable
- [ ] Modo offline para zonas con conectividad intermitente
- [ ] Mapa interactivo con geolocalización
- [ ] Notificaciones push cuando un centro cercano marca urgencia
- [ ] App nativa (React Native + Expo) para iOS y Android
- [ ] Más alianzas con ONG y autoridades locales

---

## Cómo contribuir

Este proyecto nació en menos de 24 horas y sigue creciendo cada día. Hay mucho por hacer y toda ayuda suma.

- **Desarrolladores** — abrí un issue o un PR. Las áreas más urgentes están marcadas en el roadmap.
- **Coordinadores de centro** — registrá tu centro en la plataforma. Cada centro real suma a la red.
- **ONGs y organizaciones** — escribinos para integración directa de datos y acceso de admin.
- **Periodistas / investigadores** — usá la [API pública](#-api-pública-datos-abiertos) para tus reportes. Pedimos sólo que cites la fuente.
- **Diáspora** — compartí la URL. La plataforma sólo funciona si llega a quienes la necesitan.

---

## Aliados

- 🟢 **Organización Solo Fe** — canalización de donaciones (`/donaciones`)
- 🔗 **Red ayudaavzla.com** — datos federados de sobrevivientes (47.000+ personas registradas)
- 🔗 **Red `endpoint-agent-kit`** — federación de datos cívicos (`endpoints/`)

---

## Licencia

MIT — usá este código libremente para ayudar. Si lo adaptás para otra emergencia humanitaria, nos encantaría saberlo.

---

<div align="center">
  <strong>Venezuela Ayuda</strong> · Construido el 27 de junio de 2026 ·
  <a href="https://vnzla-ayuda.org/">https://vnzla-ayuda.org/</a>
</div>
