# Venezuela Ayuda

**Plataforma de coordinación humanitaria en tiempo real — Terremoto Venezuela, 24 de junio de 2026**

> Conectamos donadores, voluntarios, centros de acopio, autoridades y familias afectadas en una sola plataforma operacional. Sin fricción. Sin burocracia. En vivo.

🔗 **Producción:** https://vnzla-ayuda.org/

---

## ¿Por qué existe esto?

El 24 de junio de 2026, Venezuela fue golpeada por un doble terremoto de magnitud 7.2 y 7.5 con epicentro en Yaracuy. El problema no fue la falta de voluntad para ayudar, sino la falta de coordinación: donadores sin destino claro, centros con excedentes de unos productos y carencias de otros, voluntarios sin asignación y familias buscando a sus seres queridos sin un registro central.

**Venezuela Ayuda** es la capa de inteligencia que faltaba: un directorio en vivo que cruza oferta con demanda y permite coordinar la respuesta desde cualquier teléfono.

## Qué hace la plataforma

### Centros coordinados

| Tipo | Función | Métrica |
|---|---|---|
| 🏠 Albergue | Aloja familias desplazadas | Ocupación y familias |
| 📦 Acopio | Recibe y redistribuye donaciones | Stock y salidas |
| 🏥 Punto médico | Atención sanitaria de emergencia | Médicos y atenciones |
| 🍲 Cocina comunitaria | Prepara y distribuye alimentos | Raciones por día |
| 🚛 Distribución | Última milla a familias | Entregas y vehículos |

### Módulos

- Directorio de centros (`/centros`) con filtros por tipo, estado, necesidades y capacidad.
- Necesidades agregadas (`/necesidades`) a nivel de red.
- Sobrevivientes (`/rescatados`) con búsqueda por nombre, cédula, ubicación, estado físico y marcado de reunificación familiar.
- Edificios (`/edificios`) con geolocalización Nominatim y detección fuzzy de duplicados.
- Voluntarios (`/voluntarios`) y roles abiertos por centro.
- Donaciones (`/donaciones`) mediante la Organización Solo Fe.
- Impacto (`/impacto`) con métricas locales y datos federados de ayudaavzla.com.

### Paneles por rol

10 perfiles con permisos mediante RLS de Supabase: admin, autoridad, centro, data-entry, diáspora, donador, empresa, ONG, transportista y voluntario.

### Calidad de datos

El panel admin detecta duplicados de sobrevivientes con `pg_trgm` (similitud ≥70%), permite fusiones manuales y limpieza automática desde ≥78%, y aplica fuzzy matching con Levenshtein a edificios. Las funciones RPC usan `SECURITY DEFINER` para evitar bloqueos de RLS.

## API pública

Cinco vistas REST de Supabase PostgREST: `survivors_public`, `centers_public`, `inventory_public`, `needs_public` y `volunteer_roles_public`.

- `inventory_public` = lo que el centro tiene.
- `needs_public` = lo que el centro pide.
- Los registros incluyen `verified` y tags de verificación.
- No se expone cédula; los menores se anonimizan; las personas reunidas se excluyen; no se exponen voluntarios individuales.

```bash
curl -H "apikey: <APIKEY>" \\
     -H "Authorization: Bearer <APIKEY>" \\
     -H "Accept-Profile: public" \\
     "https://kqtilzssuynblfkuqxyx.supabase.co/rest/v1/survivors_public?limit=10"
```

## Stack

React 19 · TypeScript · TanStack Router · Vanilla CSS · Vite 7 · Bun · Vercel · Supabase (PostgreSQL, Auth, RLS, Storage, Realtime) · Google OAuth · PostgREST · Nominatim · `pg_trgm`.

## Arquitectura

```text
src/
├── data/              donaciones, roles y fixtures
├── hooks/             centros, sobrevivientes, impacto, ticker y paneles
├── lib/               Supabase, queries, Nominatim y campos requeridos
├── components/        centers, landing, layout y ui
└── routes/            centros, sobrevivientes, edificios, necesidades, donaciones,
                       voluntarios, impacto y paneles por rol

supabase/
└── migrations/        más de 20 migraciones versionadas

endpoints/              propuestas y documentación de la API federada
```

## Desarrollo local

```bash
git clone https://github.com/inside4trading-coder/venezuela-ayuda.git
cd venezuela-ayuda
bun install
bun run dev       # http://localhost:3000
bun run build
bun run lint
```

Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Para aplicar migraciones: `supabase db push`.

## Roadmap

- ✅ MVP, backend Supabase, Google OAuth, RLS y paneles por rol.
- ✅ Donaciones, API pública y federación de datos.
- ✅ Edificios, fuzzy matching, calidad de datos y dominio propio.
- ⏳ PWA instalable, modo offline, mapa interactivo, notificaciones y app móvil.

## Contribuir y licencia

Abre issues o PRs, registra centros reales o contacta para integraciones con ONG y autoridades. MIT — usa este código libremente para ayudar.
