// Categorías de edad orientativas (edad que se cumple durante el año de temporada).
// Cada federación autonómica puede tener cortes de fecha ligeramente distintos:
// válido para hacerse una idea rápida en el listado, no como dato oficial de inscripción.
const TRAMOS: Array<{ hasta: number; nombre: string }> = [
  { hasta: 10, nombre: "Benjamín" },
  { hasta: 12, nombre: "Alevín" },
  { hasta: 14, nombre: "Infantil" },
  { hasta: 16, nombre: "Cadete" },
  { hasta: 18, nombre: "Juvenil" },
  { hasta: 20, nombre: "Junior" },
  { hasta: 22, nombre: "Promesa" },
];

// Categorías asignables a un grupo "por edad": Absoluto queda fuera porque
// esa categoría se organiza por grupo de entrenamiento, no por edad.
export const CATEGORIAS_EDAD_ASIGNABLES = TRAMOS.map((t) => t.nombre);

export function temporadaActual(): string {
  return String(new Date().getFullYear());
}

export function calcularCategoria(fechaNacimiento: string, temporada: string = temporadaActual()): string {
  const anoNacimiento = new Date(fechaNacimiento).getFullYear();
  const anoTemporada = parseInt(temporada, 10);
  if (Number.isNaN(anoNacimiento) || Number.isNaN(anoTemporada)) return "—";

  const edad = anoTemporada - anoNacimiento;
  const tramo = TRAMOS.find((t) => edad <= t.hasta);
  return tramo?.nombre ?? "Absoluto";
}

export function calcularEdad(fechaNacimiento: string, temporada: string = temporadaActual()): number {
  return parseInt(temporada, 10) - new Date(fechaNacimiento).getFullYear();
}
