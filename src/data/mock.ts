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
  espacio: string; // tipo de espacio físico (iglesia/escuela/galpón…)
  coordinador: string;
  telefono: string;
  email: string;
  horario: string;
  necesita: Need[];
  tieneUrgente: string[];
  tieneSuficiente: string[];
  actualizadoHaceMin: number;
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
  colorVar: string; // CSS var name (without var())
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

export const CENTERS: Center[] = [
  // ───────── Albergues
  {
    id: "los-palos-grandes",
    nombre: "Centro Comunitario Los Palos Grandes",
    kind: "albergue",
    espacio: "Sede comunal",
    estado: "urgente",
    ciudad: "Caracas",
    estadoVe: "Miranda",
    direccion: "Av. Andrés Bello con 4ta transversal, Los Palos Grandes, Caracas",
    coordinador: "María Fernanda Briceño",
    telefono: "+58 412 555 0142",
    email: "lospalosgrandes@venezuelaayuda.org",
    horario: "Lun–Dom 7:00 – 20:00",
    familiasActuales: 156,
    capacidadMax: 200,
    capacidadPct: 78,
    familiasHoy: 42,
    voluntariosActivos: 14,
    necesita: [
      { nombre: "Agua potable", nivel: "critico", cantidadAprox: "2.000 litros" },
      { nombre: "Colchonetas", nivel: "alto", cantidadAprox: "80 unidades" },
      { nombre: "Pañales", nivel: "alto", cantidadAprox: "120 paquetes" },
    ],
    tieneUrgente: ["Agua potable", "Colchonetas", "Pañales"],
    tieneSuficiente: ["Ropa adulto", "Ropa niños"],
    actualizadoHaceMin: 8,
  },
  {
    id: "san-judas-tadeo",
    nombre: "Iglesia San Judas Tadeo",
    kind: "albergue",
    espacio: "Iglesia",
    estado: "capacidad-llena",
    ciudad: "La Guaira",
    estadoVe: "Vargas",
    direccion: "Calle Real de Macuto, La Guaira",
    coordinador: "Padre José Ramírez",
    telefono: "+58 414 555 0178",
    email: "sanjudas@venezuelaayuda.org",
    horario: "Lun–Dom 6:00 – 21:00",
    familiasActuales: 182,
    capacidadMax: 200,
    capacidadPct: 91,
    familiasHoy: 68,
    voluntariosActivos: 22,
    necesita: [
      { nombre: "Alimentos no perecederos", nivel: "critico", cantidadAprox: "500 kg" },
      { nombre: "Voluntarios logística", nivel: "alto", cantidadAprox: "10 personas" },
    ],
    tieneUrgente: ["Alimentos", "Voluntarios logística"],
    tieneSuficiente: ["Agua potable", "Ropa"],
    actualizadoHaceMin: 22,
  },

  // ───────── Acopio
  {
    id: "acopio-chacao",
    nombre: "Acopio Central Chacao",
    kind: "acopio",
    espacio: "Galpón municipal",
    estado: "activo",
    ciudad: "Caracas",
    estadoVe: "Miranda",
    direccion: "Av. Francisco de Miranda, Centro Comercial El Recreo, Caracas",
    coordinador: "Luis Beltrán",
    telefono: "+58 412 555 0301",
    email: "acopio.chacao@venezuelaayuda.org",
    horario: "Lun–Sáb 8:00 – 18:00",
    itemsEnInventario: 4820,
    salidasSemana: 36,
    m2Almacen: 600,
    vehiculosDisponibles: 4,
    necesita: [
      { nombre: "Vehículos", nivel: "critico", cantidadAprox: "3 camionetas" },
      { nombre: "Voluntarios logística", nivel: "alto", cantidadAprox: "15 personas" },
    ],
    tieneUrgente: ["Vehículos", "Voluntarios logística"],
    tieneSuficiente: ["Ropa adulto", "Ropa niños", "Zapatos"],
    actualizadoHaceMin: 12,
  },
  {
    id: "acopio-maracay",
    nombre: "Acopio Maracay Sur",
    kind: "acopio",
    espacio: "Bodega industrial",
    estado: "urgente",
    ciudad: "Maracay",
    estadoVe: "Aragua",
    direccion: "Zona Industrial San Vicente, Galpón 12, Maracay",
    coordinador: "Andreína Salas",
    telefono: "+58 416 555 0322",
    email: "acopio.maracay@venezuelaayuda.org",
    horario: "Lun–Dom 7:00 – 19:00",
    itemsEnInventario: 1240,
    salidasSemana: 58,
    m2Almacen: 900,
    vehiculosDisponibles: 1,
    necesita: [
      { nombre: "Agua potable", nivel: "critico", cantidadAprox: "5.000 litros" },
      { nombre: "Alimentos no perecederos", nivel: "critico", cantidadAprox: "800 kg" },
      { nombre: "Vehículos", nivel: "critico", cantidadAprox: "2 camiones" },
    ],
    tieneUrgente: ["Agua", "Alimentos", "Vehículos"],
    tieneSuficiente: [],
    actualizadoHaceMin: 5,
  },

  // ───────── Médico
  {
    id: "medico-la-guaira",
    nombre: "Punto Médico La Guaira",
    kind: "medico",
    espacio: "Ambulatorio adaptado",
    estado: "urgente",
    ciudad: "La Guaira",
    estadoVe: "Vargas",
    direccion: "Calle El Faro con Av. Soublette, La Guaira",
    coordinador: "Dra. Carmen Oropeza",
    telefono: "+58 414 555 0411",
    email: "medico.laguaira@venezuelaayuda.org",
    horario: "24 horas",
    atencionesHoy: 137,
    medicosActivos: 6,
    medicamentosCriticos: ["Insulina", "Antibióticos IV", "Analgésicos opioides", "Suero fisiológico"],
    tieneQuirofano: false,
    necesita: [
      { nombre: "Medicamentos básicos", nivel: "critico", cantidadAprox: "200 cajas" },
      { nombre: "Voluntarios médicos", nivel: "critico", cantidadAprox: "5 personas" },
      { nombre: "Kit primeros auxilios", nivel: "alto", cantidadAprox: "80 kits" },
    ],
    tieneUrgente: ["Medicamentos", "Voluntarios médicos"],
    tieneSuficiente: ["Vendas", "Guantes"],
    actualizadoHaceMin: 4,
  },
  {
    id: "medico-valencia",
    nombre: "Punto Médico Valencia Norte",
    kind: "medico",
    espacio: "Carpa hospitalaria",
    estado: "activo",
    ciudad: "Valencia",
    estadoVe: "Carabobo",
    direccion: "Av. Bolívar Norte frente al estadio, Valencia",
    coordinador: "Dr. Antonio Pérez",
    telefono: "+58 412 555 0167",
    email: "medico.valencia@venezuelaayuda.org",
    horario: "06:00 – 22:00",
    atencionesHoy: 84,
    medicosActivos: 9,
    medicamentosCriticos: ["Medicamentos crónicos", "Antihipertensivos"],
    tieneQuirofano: true,
    necesita: [
      { nombre: "Medicamentos crónicos", nivel: "critico", cantidadAprox: "300 cajas" },
      { nombre: "Sillas de ruedas", nivel: "medio", cantidadAprox: "8 unidades" },
    ],
    tieneUrgente: ["Medicamentos crónicos"],
    tieneSuficiente: ["Personal médico", "Insumos básicos"],
    actualizadoHaceMin: 18,
  },

  // ───────── Cocina
  {
    id: "cocina-catia",
    nombre: "Cocina Comunitaria Catia",
    kind: "cocina",
    espacio: "Cocina parroquial",
    estado: "activo",
    ciudad: "Caracas",
    estadoVe: "Distrito Capital",
    direccion: "Av. Sucre, Catia, Caracas",
    coordinador: "Rosa Contreras",
    telefono: "+58 414 555 0199",
    email: "cocina.catia@venezuelaayuda.org",
    horario: "04:00 – 20:00",
    racionesDia: 720,
    racionesCapacidad: 1000,
    cocinerosActivos: 11,
    proximaEntrega: "Hoy 18:30",
    necesita: [
      { nombre: "Gas doméstico", nivel: "critico", cantidadAprox: "6 bombonas" },
      { nombre: "Alimentos no perecederos", nivel: "alto", cantidadAprox: "300 kg" },
    ],
    tieneUrgente: ["Gas doméstico"],
    tieneSuficiente: ["Voluntarios cocina"],
    actualizadoHaceMin: 15,
  },
  {
    id: "cocina-san-felipe",
    nombre: "Cocina San Felipe",
    kind: "cocina",
    espacio: "Cocina polideportivo",
    estado: "urgente",
    ciudad: "San Felipe",
    estadoVe: "Yaracuy",
    direccion: "Av. La Patria, Polideportivo Municipal, San Felipe",
    coordinador: "Carlos Mendoza",
    telefono: "+58 416 555 0123",
    email: "cocina.sanfelipe@venezuelaayuda.org",
    horario: "05:00 – 21:00",
    racionesDia: 410,
    racionesCapacidad: 800,
    cocinerosActivos: 6,
    proximaEntrega: "Hoy 19:00",
    necesita: [
      { nombre: "Generadores", nivel: "critico", cantidadAprox: "1 unidad" },
      { nombre: "Agua potable", nivel: "critico", cantidadAprox: "1.500 litros" },
      { nombre: "Combustible", nivel: "alto", cantidadAprox: "200 litros" },
    ],
    tieneUrgente: ["Generadores", "Agua", "Combustible"],
    tieneSuficiente: [],
    actualizadoHaceMin: 9,
  },

  // ───────── Distribución
  {
    id: "ruta-vargas-norte",
    nombre: "Ruta Vargas Norte",
    kind: "distribucion",
    espacio: "Punto móvil",
    estado: "activo",
    ciudad: "La Guaira",
    estadoVe: "Vargas",
    direccion: "Salida desde Acopio La Guaira hacia Macuto–Caraballeda",
    coordinador: "Pedro Marcano",
    telefono: "+58 412 555 0512",
    email: "ruta.vargas@venezuelaayuda.org",
    horario: "Lun–Dom 6:00 – 18:00",
    familiasRuta: 240,
    entregasHoy: 87,
    zonasCubiertas: ["Macuto", "Caraballeda", "Naiguatá"],
    vehiculosActivos: 3,
    necesita: [
      { nombre: "Combustible", nivel: "critico", cantidadAprox: "400 litros" },
      { nombre: "Voluntarios logística", nivel: "alto", cantidadAprox: "8 personas" },
    ],
    tieneUrgente: ["Combustible"],
    tieneSuficiente: ["Cajas de ayuda"],
    actualizadoHaceMin: 7,
  },
  {
    id: "ruta-aragua-costa",
    nombre: "Ruta Aragua Costa",
    kind: "distribucion",
    espacio: "Punto móvil",
    estado: "urgente",
    ciudad: "Maracay",
    estadoVe: "Aragua",
    direccion: "Salida desde Acopio Maracay Sur hacia Ocumare–Choroní",
    coordinador: "Luisa Carrasquel",
    telefono: "+58 424 555 0190",
    email: "ruta.aragua@venezuelaayuda.org",
    horario: "Lun–Dom 5:30 – 19:00",
    familiasRuta: 380,
    entregasHoy: 34,
    zonasCubiertas: ["Ocumare de la Costa", "Cata", "Choroní"],
    vehiculosActivos: 1,
    necesita: [
      { nombre: "Vehículos", nivel: "critico", cantidadAprox: "2 camionetas 4x4" },
      { nombre: "Combustible", nivel: "critico", cantidadAprox: "600 litros" },
    ],
    tieneUrgente: ["Vehículos", "Combustible"],
    tieneSuficiente: [],
    actualizadoHaceMin: 25,
  },
];

export const IMPACT_METRICS = {
  centrosActivos: 96,
  familiasAtendidas: 5320,
  voluntarios: 312,
  estados: 23,
  porTipo: {
    albergue: { total: 47, metricaLabel: "familias alojadas", metricaValor: 2840 },
    acopio: { total: 23, metricaLabel: "items movidos / sem", metricaValor: 18400 },
    medico: { total: 12, metricaLabel: "atenciones / sem", metricaValor: 4120 },
    cocina: { total: 8, metricaLabel: "raciones / día", metricaValor: 6800 },
    distribucion: { total: 6, metricaLabel: "entregas / sem", metricaValor: 1980 },
  },
} as const;

export const TOP_DEMAND: DemandItem[] = [
  { nombre: "Agua potable", total: 38 },
  { nombre: "Combustible", total: 31 },
  { nombre: "Alimentos no perecederos", total: 29 },
  { nombre: "Medicamentos básicos", total: 27 },
  { nombre: "Vehículos", total: 22 },
  { nombre: "Voluntarios médicos", total: 19 },
  { nombre: "Gas doméstico", total: 14 },
  { nombre: "Generadores", total: 11 },
];

export const RECENT_ACTIVITY: ActivityEntry[] = [
  { centro: "Acopio Chacao", accion: "Despachó 2 camiones hacia La Guaira", haceMin: 6 },
  { centro: "Punto Médico La Guaira", accion: "Solicitó 5 médicos voluntarios", haceMin: 4 },
  { centro: "Cocina Catia", accion: "Preparó 720 raciones para hoy", haceMin: 15 },
  { centro: "Ruta Vargas Norte", accion: "Entregó ayuda a 87 familias", haceMin: 7 },
  { centro: "Centro Los Palos Grandes", accion: "Solicitó 2.000 L de agua", haceMin: 8 },
  { centro: "Acopio Maracay Sur", accion: "Recibió 800 kg de alimentos", haceMin: 32 },
  { centro: "Cocina San Felipe", accion: "Alcanzó 410 raciones servidas", haceMin: 9 },
  { centro: "Ruta Aragua Costa", accion: "Solicitó 2 camionetas 4x4", haceMin: 25 },
  { centro: "Iglesia San Judas Tadeo", accion: "Marcó capacidad al 91%", haceMin: 22 },
  { centro: "Punto Médico Valencia", accion: "Habilitó quirófano de campaña", haceMin: 48 },
];
