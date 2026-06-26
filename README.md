# Venezuela Ayuda

**Plataforma de coordinación humanitaria en tiempo real — Terremoto Venezuela, 24 de junio de 2026**

> Conectamos donadores, voluntarios, centros de acopio y familias afectadas en una sola plataforma operacional. Sin fricción. Sin burocracia. En vivo.

---

## ¿Por qué existe esto?

El 24 de junio de 2026, Venezuela fue golpeada por un doble terremoto de magnitud 7.2 y 7.5 con epicentro en Yaracuy. Más de 900 muertos, miles de heridos, decenas de miles de familias desplazadas.

El problema no fue la falta de voluntad para ayudar. Fue la falta de coordinación.

- Donadores con agua y alimentos sin saber a qué centro llevarlos
- Centros de albergue desbordados de ropa y vacíos de medicamentos
- Voluntarios médicos sin saber dónde se necesitaban
- Cocinas comunitarias sin gas mientras otros centros tenían excedente
- Rutas de distribución paralizadas por falta de combustible y vehículos

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

### Para cada actor

**Donador** — ve qué necesita cada centro exactamente, en qué cantidad y con qué nivel de urgencia. Anuncia su llegada antes de ir.

**Voluntario** — registra su perfil y skills (médico, logística, transporte, cocina). La plataforma lo conecta con el centro que más lo necesita en su zona.

**Coordinador de centro** — registra y actualiza su centro en 2 minutos. El directorio se actualiza en tiempo real para todos los demás.

**Transportista** — ve las rutas activas, conecta centros de acopio con albergues y zonas de distribución.

**Diáspora venezolana** — ve el impacto en vivo de la red: familias atendidas, raciones distribuidas, voluntarios coordinados.

---

## Estado actual — Fase 1 (MVP)

✅ Directorio de centros con filtros por tipo, estado y necesidades  
✅ Cards con métricas específicas por tipo de centro  
✅ Formulario de registro de centros  
✅ Formulario de voluntarios  
✅ Panel de impacto con métricas en vivo  
✅ Vista de necesidades agregadas por ítem  
✅ Live ticker de situación operacional  
✅ Responsive — funciona en cualquier teléfono  

⏳ Fase 2 (próxima): Supabase + Google Auth + datos reales en tiempo real  
⏳ Fase 3: Backoffice por roles + notificaciones push  
⏳ Fase 4: PWA instalable + modo offline  

---

## Stack técnico

```
Frontend    React + TypeScript + TanStack Router
Estilos     Tailwind CSS v4 + sistema de tokens propio
UI Base     shadcn/ui (Radix UI) + componentes propios
Build       Vite + Bun
Deploy      Vercel (auto-deploy desde GitHub)
Backend*    Supabase (Fase 2)
Auth*       Google OAuth via Supabase (Fase 2)
```

### Sistema de diseño

La identidad visual está construida sobre un sistema de tokens CSS propio — no el esquema por defecto de Tailwind. Cada color tiene un significado operacional:

```css
--color-critical:    #C8102E   /* Urgente — rojo bandera venezolana */
--color-operational: #1A56DB   /* CTAs primarios — azul operacional */
--color-resolved:    #057A55   /* Cubierto / OK */
--color-caution:     #B45309   /* Capacidad llena — precaución */
--color-text-muted:  #6B7280   /* Metadata y timestamps */
```

Tipografía: **DM Sans** (display), **Inter** (UI y datos), **DM Mono** (timestamps y cantidades).

---

## Arquitectura del código

```
src/
├── data/
│   └── mock.ts              # Tipos TypeScript + datos mock (reemplazable por Supabase)
├── hooks/
│   ├── useCenters.ts        # Filtrado y búsqueda de centros
│   ├── useInventory.ts      # Inventario por centro
│   └── useImpact.ts         # Métricas globales
├── components/
│   ├── centers/             # CenterCard, FiltersPanel
│   ├── layout/              # LiveTicker, Navbar
│   └── ui-vh/               # Badge, StatusPill, CapacityBar, NeedTag, KindBadge
└── routes/
    ├── index.tsx            # Directorio principal
    ├── centro.$id.tsx       # Detalle de centro
    ├── registrar-centro.tsx # Formulario de registro
    ├── necesidades.tsx      # Necesidades agregadas
    ├── voluntarios.tsx      # Registro de voluntarios
    └── impacto.tsx          # Panel público de impacto
```

### Decisión de arquitectura clave

Los hooks (`useCenters`, `useInventory`, `useImpact`) tienen **firma estable**. Hoy devuelven datos mock. En Fase 2, su interior apuntará a Supabase — los componentes que los consumen no cambian una sola línea.

```typescript
// Hoy — mock
export function useCenters(filters: CenterFilters) {
  return { centers: CENTERS.filter(...), total, isLoading: false }
}

// Fase 2 — misma firma, fuente real
export function useCenters(filters: CenterFilters) {
  const { data, isLoading } = useQuery(supabase.from('centers')...)
  return { centers: data, total, isLoading }
}
```

---

## Correr localmente

**Prerrequisitos:** Node.js 18+ o Bun 1.0+

```bash
# Clonar
git clone https://github.com/inside4trading-coder/venezuela-ayuda.git
cd venezuela-ayuda

# Instalar dependencias
bun install

# Desarrollo
bun run dev

# Build producción
bun run build
```

La app corre en `http://localhost:3000`

---

## Roadmap

### Fase 2 — Backend real (próximas 72h)
- [ ] Supabase: schema de base de datos + Row Level Security
- [ ] Google OAuth — login con un click, sin crear cuenta nueva
- [ ] Formularios que guardan datos reales
- [ ] Realtime: inventario se actualiza en vivo entre coordinadores
- [ ] Verificación de centros antes de publicar

### Fase 3 — Backoffice y roles
- [ ] Panel de coordinador de centro — gestión de inventario
- [ ] Panel de admin — verificación y moderación
- [ ] Panel de donador — historial y confirmación de entregas
- [ ] Notificaciones push cuando un centro cercano marca urgencia

### Fase 4 — PWA y escala
- [ ] Progressive Web App — instalable desde el navegador
- [ ] Modo offline — funciona sin conexión en zonas afectadas
- [ ] Mapa interactivo con geolocalización
- [ ] API pública para integración con otras plataformas de ayuda
- [ ] App nativa (React Native + Expo) para iOS y Android

---

## Cómo contribuir

Este proyecto nació en menos de 24 horas. Hay mucho por hacer y toda ayuda suma.

**Si eres desarrollador** — abre un issue o un PR. Las áreas más urgentes están marcadas en el roadmap.

**Si coordinás un centro** — registralo en la plataforma. Cada centro real que se suma hace la red más útil para todos.

**Si tenés contactos en Venezuela** — comparte la URL. La plataforma solo funciona si llega a quienes la necesitan.

**Si representás una ONG o organización** — escríbenos para integración directa de datos y acceso de administrador.

---

## Equipo

Construido con urgencia y propósito por venezolanos y amigos de Venezuela que creen que la tecnología puede hacer la diferencia en una emergencia.

---

## Licencia

MIT — usa este código libremente para ayudar. Si lo adaptas para otra emergencia humanitaria, nos encantaría saberlo.

---

<div align="center">
  <strong>Venezuela Ayuda</strong> · Construido el 27 de junio de 2026 · 
  <a href="https://venezuelaayuda.com">venezuelaayuda.com</a>
</div>
