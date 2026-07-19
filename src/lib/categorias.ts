// Categorías de edad del club (nomenclatura sub-X: "menor de X años"),
// equivalentes a las categorías tradicionales de la RFEA:
//   Psicomotricidad (3-5) · Sub-8 = Prebenjamín · Sub-10 = Benjamín ·
//   Sub-12 = Alevín · Sub-14 = Infantil · Sub-16 = Cadete · Sub-18 = Juvenil ·
//   Sub-20 = Junior · Sub-23 = Promesa · Absoluta = Senior · Master = Veterano (35+)
//
// El año deportivo va de septiembre a julio (agosto no es hábil: no hay
// competición). La categoría de un atleta se calcula con la edad que cumple
// en el año natural que cae dentro de esa temporada — el que contiene la
// mayor parte del calendario de competición. Ej.: en la temporada 2025-2026
// cuenta el año 2026; alguien nacido en 2019 cumple 7 en 2026 y está en
// Sub-8; en la temporada 2026-2027 cuenta 2027, cumple 8 y pasa a Sub-10.
const TRAMOS: Array<{ hasta: number; nombre: string }> = [
  { hasta: 5, nombre: "Psicomotricidad" },
  { hasta: 7, nombre: "Sub-8" },
  { hasta: 9, nombre: "Sub-10" },
  { hasta: 11, nombre: "Sub-12" },
  { hasta: 13, nombre: "Sub-14" },
  { hasta: 15, nombre: "Sub-16" },
  { hasta: 17, nombre: "Sub-18" },
  { hasta: 19, nombre: "Sub-20" },
  { hasta: 22, nombre: "Sub-23" },
  { hasta: 34, nombre: "Absoluta" },
];
const CATEGORIA_MASTER = "Master";
const EDAD_MINIMA_CLUB = 3;

export const CATEGORIAS_EDAD_ASIGNABLES = [...TRAMOS.map((t) => t.nombre), CATEGORIA_MASTER];

export function temporadaActual(): string {
  return String(new Date().getFullYear());
}

// Año natural que determina la categoría en una fecha dada: septiembre a
// diciembre cuentan como el año siguiente (donde cae el grueso de la
// temporada que acaba de empezar); enero a agosto (incluido el parón de
// agosto) siguen contando con el año en curso.
export function anoCategoria(fechaReferencia: Date = new Date()): number {
  const mes = fechaReferencia.getMonth() + 1;
  const anio = fechaReferencia.getFullYear();
  return mes >= 9 ? anio + 1 : anio;
}

export function calcularEdad(fechaNacimiento: string, fechaReferencia: Date = new Date()): number {
  return anoCategoria(fechaReferencia) - new Date(fechaNacimiento).getFullYear();
}

export function calcularCategoria(fechaNacimiento: string, fechaReferencia: Date = new Date()): string {
  const anoNacimiento = new Date(fechaNacimiento).getFullYear();
  if (Number.isNaN(anoNacimiento)) return "—";

  const edad = anoCategoria(fechaReferencia) - anoNacimiento;
  if (edad < EDAD_MINIMA_CLUB) return "—";
  const tramo = TRAMOS.find((t) => edad <= t.hasta);
  return tramo?.nombre ?? CATEGORIA_MASTER;
}
