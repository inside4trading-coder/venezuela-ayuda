// Catálogo central de roles de voluntariado.
// Mismo set en el form público /voluntarios, registrar-centro, panel.centro,
// panel.voluntario y centro.$id — para que coincidan en el match.
export const VOLUNTEER_ROLES: readonly string[] = [
  "Logística en centro",
  "Conductor / vehículo propio",
  "Médico o enfermero",
  "Cocina y reparto de alimentos",
  "Atención a niños",
  "Comunicación / redes",
] as const;
