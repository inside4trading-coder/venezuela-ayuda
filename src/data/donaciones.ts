export const SOLO_FE = {
  nombre: "Organización Solo Fe",
  handle: "@organizacionsolofe",
  instagramUrl: "https://www.instagram.com/organizacionsolofe/",
  descripcion:
    "Aliados verificados que reciben las donaciones y las distribuyen a las víctimas del sismo en Venezuela.",
};

export const CONCEPTO_OBLIGATORIO = "DONACIÓN VENEZUELA";

export type MetodoPagoField = {
  label: string;
  value: string;
  copyValue: string;
};

export type MetodoPago = {
  id: string;
  nombre: string;
  accent: string;
  textOn: string;
  campos: MetodoPagoField[];
};

export const METODOS_PAGO: MetodoPago[] = [
  {
    id: "pago-movil",
    nombre: "Pago Móvil",
    accent: "#C8102E",
    textOn: "#ffffff",
    campos: [
      { label: "Teléfono", value: "0412-1564143", copyValue: "04121564143" },
      { label: "Cédula", value: "29.762.955", copyValue: "29762955" },
      { label: "Banco", value: "Banco de Venezuela (0102)", copyValue: "Banco de Venezuela" },
    ],
  },
  {
    id: "zelle",
    nombre: "Zelle",
    accent: "#7C3AED",
    textOn: "#ffffff",
    campos: [
      { label: "Teléfono", value: "+1 (407) 768-8172", copyValue: "+14077688172" },
      { label: "Titular", value: "Verónica Oviedo", copyValue: "Verónica Oviedo" },
    ],
  },
  {
    id: "binance",
    nombre: "Binance Pay",
    accent: "#F0B90B",
    textOn: "#1A1A1A",
    campos: [
      { label: "Email", value: "promastervenx@gmail.com", copyValue: "promastervenx@gmail.com" },
      { label: "Usuario", value: "EDUARDOPEREZ11", copyValue: "EDUARDOPEREZ11" },
      { label: "Binance ID", value: "348552018", copyValue: "348552018" },
    ],
  },
];
