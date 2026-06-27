// ─────────────────────────────────────────────────────────────
// mock.ts — static constants and TypeScript types only.
// The CENTERS array has been removed: all center data now comes
// from Supabase via useCenters() / useCenter() hooks.
// ─────────────────────────────────────────────────────────────

export type CenterStatus = "urgente" | "activo" | "capacidad-llena" | "cerrado";
export type NeedLevel = "critico" | "alto" | "medio";

export type CenterKind =
  | "albergue"
  | "acopio"
  | "medico"
  | "cocina"
  | "distribucion";

export interface Need {
  nombre: string;
  nivel: NeedLevel;
  cantidadAprox: string;
}

interface BaseCenter {
  id: string;
  nombre: string;
  kind: CenterKind;
  estado: CenterStatus;
  ciudad: string;
  estadoVe: string;
  direccion: string;
  espacio: string;
  coordinador: string;
  telefono: string;
  email: string;
  horario: string;
  necesita: Need[];
  tieneUrgente: string[];
  tieneSuficiente: string[];
  actualizadoHaceMin: number;
  lat?: number | null;
  lng?: number | null;
}

export interface AlbergueCenter extends BaseCenter {
  kind: "albergue";
  familiasActuales: number;
  capacidadMax: number;
  capacidadPct: number;
  familiasHoy: number;
  voluntariosActivos: number;
}

export interface AcopioCenter extends BaseCenter {
  kind: "acopio";
  itemsEnInventario: number;
  salidasSemana: number;
  m2Almacen: number;
  vehiculosDisponibles: number;
}

export interface MedicoCenter extends BaseCenter {
  kind: "medico";
  atencionesHoy: number;
  medicosActivos: number;
  medicamentosCriticos: string[];
  tieneQuirofano: boolean;
}

export interface CocinaCenter extends BaseCenter {
  kind: "cocina";
  racionesDia: number;
  racionesCapacidad: number;
  cocinerosActivos: number;
  proximaEntrega: string;
}

export interface DistribucionCenter extends BaseCenter {
  kind: "distribucion";
  familiasRuta: number;
  entregasHoy: number;
  zonasCubiertas: string[];
  vehiculosActivos: number;
}

export type Center =
  | AlbergueCenter
  | AcopioCenter
  | MedicoCenter
  | CocinaCenter
  | DistribucionCenter;

export interface ActivityEntry {
  centro: string;
  accion: string;
  haceMin: number;
}

export interface DemandItem {
  nombre: string;
  total: number;
}

export interface KindMeta {
  id: CenterKind;
  label: string;
  short: string;
  plural: string;
  microcopy: string;
  colorVar: string;
}

export const CENTER_KINDS: KindMeta[] = [
  {
    id: "albergue",
    label: "Albergue",
    plural: "Albergues",
    short: "ALB",
    microcopy: "Aloja a familias desplazadas",
    colorVar: "--color-operational",
  },
  {
    id: "acopio",
    label: "Acopio de donaciones",
    plural: "Acopios",
    short: "ACO",
    microcopy: "Recibe y redistribuye especies",
    colorVar: "--color-text-main",
  },
  {
    id: "medico",
    label: "Punto médico",
    plural: "Puntos médicos",
    short: "MED",
    microcopy: "Atención sanitaria y medicamentos",
    colorVar: "--color-critical",
  },
  {
    id: "cocina",
    label: "Cocina comunitaria",
    plural: "Cocinas",
    short: "COC",
    microcopy: "Prepara y reparte raciones",
    colorVar: "--color-caution",
  },
  {
    id: "distribucion",
    label: "Centro de distribución",
    plural: "Distribución",
    short: "DIST",
    microcopy: "Última milla hasta las familias",
    colorVar: "--color-resolved",
  },
];

export const KIND_BY_ID: Record<CenterKind, KindMeta> = Object.fromEntries(
  CENTER_KINDS.map((k) => [k.id, k]),
) as Record<CenterKind, KindMeta>;

export const ESTADOS_VENEZUELA = [
  "Amazonas",
  "Anzoátegui",
  "Apure",
  "Aragua",
  "Barinas",
  "Bolívar",
  "Carabobo",
  "Cojedes",
  "Delta Amacuro",
  "Distrito Capital",
  "Falcón",
  "Guárico",
  "Lara",
  "Mérida",
  "Miranda",
  "Monagas",
  "Nueva Esparta",
  "Portuguesa",
  "Sucre",
  "Táchira",
  "Trujillo",
  "Vargas",
  "Yaracuy",
  "Zulia",
] as const;

export const NEED_CATALOG = [
  "Agua potable",
  "Alimentos no perecederos",
  "Medicamentos básicos",
  "Medicamentos crónicos",
  "Ropa adulto",
  "Ropa niños",
  "Zapatos",
  "Colchonetas/frazadas",
  "Pañales",
  "Kit primeros auxilios",
  "Generadores",
  "Combustible",
  "Carpas",
  "Voluntarios médicos",
  "Voluntarios logística",
  "Vehículos",
] as const;
