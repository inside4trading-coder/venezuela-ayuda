*[Versión en español](README.es.md)*

# Venezuela Ayuda

**Real-time humanitarian coordination platform — Venezuela earthquake, June 24, 2026**

> Connecting donors, volunteers, relief centers, authorities, and affected families through one operational platform. No friction. No bureaucracy. Live.

🔗 **Production:** https://vnzla-ayuda.org/

---

## Why it exists

On June 24, 2026, Venezuela was hit by a double earthquake measuring 7.2 and 7.5, centered in Yaracuy. The problem was not a lack of willingness to help, but a lack of coordination: donors had no clear destination, centers had surpluses of some supplies and shortages of others, volunteers had no assignments, and families had no central registry to find their loved ones.

**Venezuela Ayuda** is the missing intelligence layer: a live directory that matches supply with demand and coordinates the response from any phone.

## What the platform does

### Coordinated center types

| Type | Function | Metric |
|---|---|---|
| 🏠 Shelter | Houses displaced families | Occupancy and families |
| 📦 Donation center | Receives and redistributes donations | Stock and dispatches |
| 🏥 Medical point | Emergency healthcare | Medical staff and visits |
| 🍲 Community kitchen | Prepares and distributes food | Meals per day |
| 🚛 Distribution center | Last-mile delivery to families | Deliveries and vehicles |

### Modules

- Center directory (`/centros`) with filters by type, status, needs, and capacity.
- Aggregated needs (`/necesidades`) at network level.
- Survivors (`/rescatados`) with search by name, ID number, location, physical condition, and family-reunification status.
- Buildings (`/edificios`) with Nominatim geolocation and fuzzy duplicate detection.
- Volunteers (`/voluntarios`) and open roles by center.
- Donations (`/donaciones`) through Organización Solo Fe.
- Impact (`/impacto`) with local metrics and federated data from ayudaavzla.com.

### Role-based panels

10 profiles with permissions enforced through Supabase RLS: admin, authority, center, data entry, diaspora, donor, company, NGO, transporter, and volunteer.

### Data quality

The admin panel detects duplicate survivor records with PostgreSQL `pg_trgm` (similarity ≥70%), supports manual merges and automatic cleanup from ≥78%, and applies Levenshtein fuzzy matching to buildings. RPC functions use `SECURITY DEFINER` to avoid RLS conflicts.

## Public API

Five REST views exposed through Supabase PostgREST: `survivors_public`, `centers_public`, `inventory_public`, `needs_public`, and `volunteer_roles_public`.

- `inventory_public` represents what a center has in stock.
- `needs_public` represents what a center is requesting.
- Records include `verified` and verification tags.
- ID numbers are not exposed; minors are anonymized; reunited people are excluded; individual volunteers are not exposed.

```bash
curl -H "apikey: <APIKEY>" \\
     -H "Authorization: Bearer <APIKEY>" \\
     -H "Accept-Profile: public" \\
     "https://kqtilzssuynblfkuqxyx.supabase.co/rest/v1/survivors_public?limit=10"
```

## Stack

React 19 · TypeScript · TanStack Router · Vanilla CSS · Vite 7 · Bun · Vercel · Supabase (PostgreSQL, Auth, RLS, Storage, Realtime) · Google OAuth · PostgREST · Nominatim · `pg_trgm`.

## Architecture

```text
src/
├── data/              donations, roles, and fixtures
├── hooks/             centers, survivors, impact, ticker, and panels
├── lib/               Supabase, queries, Nominatim, and required fields
├── components/        centers, landing, layout, and UI
└── routes/            centers, survivors, buildings, needs, donations,
                       volunteers, impact, and role-based panels

supabase/
└── migrations/        20+ versioned migrations

endpoints/              federated API proposals and documentation
```

## Local development

**Prerequisites:** Node.js 18+ or Bun 1.0+

```bash
git clone https://github.com/inside4trading-coder/venezuela-ayuda.git
cd venezuela-ayuda
bun install
bun run dev       # http://localhost:3000
bun run build
bun run lint
```

Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Apply migrations with `supabase db push`.

## Roadmap

- ✅ MVP, Supabase backend, Google OAuth, RLS, and role-based panels.
- ✅ Donations, public API, and data federation.
- ✅ Buildings, fuzzy matching, data quality, and custom domain.
- ⏳ Installable PWA, offline mode, interactive map, notifications, and mobile app.

## Contributing and license

Open issues or pull requests, register real centers, or contact the team about NGO and authority integrations. MIT — use this code freely to help.
