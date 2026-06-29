# Endpoints públicos de `venezuela-ayuda`

Datos cívicos abiertos vía Supabase PostgREST + vistas SQL filtradas (`public.*_public`).
Sin código serverless, sin auth dedicada — el `anon key` ya es público.

## URLs base

```
BASE = https://kqtilzssuynblfkuqxyx.supabase.co/rest/v1
APIKEY = sb_publishable_udPVuneAoBbPorp0N0nd-w_pLgp36S8
```

### Headers obligatorios

Tres headers son requeridos en cada request (este proyecto Supabase tiene `graphql_public` como schema por defecto, así que hay que indicar explícitamente `public`):

| Header            | Valor                                            |
|-------------------|--------------------------------------------------|
| `apikey`          | el APIKEY de arriba                              |
| `Authorization`   | `Bearer <APIKEY>`                                |
| `Accept-Profile`  | `public`                                         |

Ejemplo `curl`:

```bash
curl -H "apikey: $APIKEY" \
     -H "Authorization: Bearer $APIKEY" \
     -H "Accept-Profile: public" \
     "$BASE/survivors_public?select=*&limit=10"
```

| Recurso              | URL                                  | Perfil del kit          |
|----------------------|--------------------------------------|-------------------------|
| Sobrevivientes       | `BASE/survivors_public?select=*`     | `persona-desaparecida`  |
| Centros de acopio    | `BASE/centers_public?select=*`       | `general`               |
| Inventario / necesidades | `BASE/inventory_public?select=*` | `general`               |
| Roles de voluntariado | `BASE/volunteer_roles_public?select=*` | `general`            |

Paginación PostgREST: `?limit=50&offset=0`. Max recomendado: `limit=200`.

## Garantías de privacidad

- **Sobrevivientes:** sin `cedula`. Para menores de 18 (`age_approx < 18`) se enmascaran nombre y edad — sólo ciudad/estado.
- **Reunidos:** las personas marcadas como `reunited_at` desaparecen del endpoint automáticamente (modelo federado del kit: la fuente conserva derecho de borrado).
- **Sólo verificados:** todas las vistas filtran `verified = true` o `verified_at is not null`.
- **Voluntarios:** no se exponen personas individuales — sólo qué roles abiertos hay por centro.

## Smoke test

```bash
ANON=sb_publishable_udPVuneAoBbPorp0N0nd-w_pLgp36S8
URL=https://kqtilzssuynblfkuqxyx.supabase.co/rest/v1
for v in survivors_public centers_public inventory_public volunteer_roles_public; do
  echo "=== $v ==="
  curl -s \
    -H "apikey: $ANON" \
    -H "Authorization: Bearer $ANON" \
    -H "Accept-Profile: public" \
    "$URL/$v?select=*&limit=2" | jq '.[0]'
done
```

PowerShell equivalente:

```powershell
$ANON = "sb_publishable_udPVuneAoBbPorp0N0nd-w_pLgp36S8"
$URL  = "https://kqtilzssuynblfkuqxyx.supabase.co/rest/v1"
foreach ($v in @("survivors_public","centers_public","inventory_public","volunteer_roles_public")) {
  Write-Host "=== $v ===" -ForegroundColor Cyan
  curl.exe -s `
    -H "apikey: $ANON" `
    -H "Authorization: Bearer $ANON" `
    -H "Accept-Profile: public" `
    "$URL/$v?select=*&limit=2"
  Write-Host ""
}
```

## Regenerar las `propuesta.*.json` con `endpoint-agent-kit`

Requiere Node.js ≥ 20.

```bash
# Una vez
npx @hainrixz/enpoint-agentkit init --agent=claude

# Por cada vista
ANON=sb_publishable_udPVuneAoBbPorp0N0nd-w_pLgp36S8
URL=https://kqtilzssuynblfkuqxyx.supabase.co/rest/v1

curl -s -H "apikey: $ANON" "$URL/survivors_public?select=*&limit=5" > /tmp/s.json
npx @hainrixz/enpoint-agentkit sample /tmp/s.json --profile=persona-desaparecida \
  > endpoints/propuesta.survivors.json

curl -s -H "apikey: $ANON" "$URL/centers_public?select=*&limit=5" > /tmp/c.json
npx @hainrixz/enpoint-agentkit sample /tmp/c.json --profile=general \
  > endpoints/propuesta.centers.json

# Repetir para inventory_public, donations_public, volunteer_roles_public
```

Tras `sample`, **editar cada JSON a mano** para añadir:
- `source_name` (ej. `"Venezuela Ayuda — Sobrevivientes"`)
- `endpoint_url` completa
- `http_method: "GET"`
- `auth_type: "api_key"`, `auth_header: "apikey"` (el valor NO va dentro del JSON — el kit bloquea secretos)
- `pagination: { "style": "offset", "limit_param": "limit", "offset_param": "offset", "page_size": 100 }`
- `data_path: ""` (PostgREST devuelve array en la raíz)
- `contact_email`

## Validar y auditar

```bash
npm run endpoints:validate   # strict para survivors
npm run endpoints:audit      # 48 checks de conformidad
```

## Registrar en la red federada

```bash
npx @hainrixz/enpoint-agentkit submit endpoints/propuesta.survivors.json
# (repetir para cada propuesta)
```

## Rollback

Las vistas son aditivas. Para retirar todo:

```sql
drop view if exists public.survivors_public;
drop view if exists public.centers_public;
drop view if exists public.inventory_public;
drop view if exists public.donations_public;
drop view if exists public.volunteer_roles_public;
```

Las tablas originales no se tocan.
