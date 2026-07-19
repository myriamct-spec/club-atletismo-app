import type { FamiliaPrueba, Intento, Parcial, RitmoKm, TipoPruebaFisica } from "../types/database";

// Convierte una marca (texto libre, ej. "11.84" o "5.63m") a número para
// poder graficarla y compararla. parseFloat ignora sufijos no numéricos.
export function marcaANumero(marca: string): number | null {
  const n = parseFloat(marca.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

// Sprint y fondo se miden en tiempo (menos es mejor); saltos, lanzamientos
// y el resto (puntos) se miden en distancia/altura/puntuación (más es mejor).
export function menorEsMejor(familia: FamiliaPrueba): boolean {
  return familia === "sprint" || familia === "fondo";
}

export function mejorMarca(
  resultados: { marca: string; validez: string }[],
  familia: FamiliaPrueba,
): number | null {
  const validos = resultados
    .filter((r) => r.validez === "valido")
    .map((r) => marcaANumero(r.marca))
    .filter((n): n is number => n !== null);
  if (validos.length === 0) return null;
  return menorEsMejor(familia) ? Math.min(...validos) : Math.max(...validos);
}

// Ventana de la misma duración inmediatamente anterior al rango dado, para
// poder calcular la variación de los KPIs respecto al periodo anterior.
export function periodoAnterior(inicio: string, fin: string): { inicio: string; fin: string } {
  const dIni = new Date(inicio);
  const dFin = new Date(fin);
  const dias = Math.max(1, Math.round((dFin.getTime() - dIni.getTime()) / 86400000) + 1);

  const finAnterior = new Date(dIni);
  finAnterior.setDate(finAnterior.getDate() - 1);
  const inicioAnterior = new Date(finAnterior);
  inicioAnterior.setDate(inicioAnterior.getDate() - dias + 1);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { inicio: fmt(inicioAnterior), fin: fmt(finAnterior) };
}

export type Variacion = { delta: number | null; porcentaje: number | null; mejora: boolean | null };

export function calcularVariacion(actual: number | null, anterior: number | null, menorEsMejorFlag: boolean): Variacion {
  if (actual === null || anterior === null) return { delta: null, porcentaje: null, mejora: null };
  const delta = actual - anterior;
  const porcentaje = anterior !== 0 ? (delta / Math.abs(anterior)) * 100 : null;
  const mejora = menorEsMejorFlag ? delta < 0 : delta > 0;
  return { delta, porcentaje, mejora: delta === 0 ? null : mejora };
}

// Qué tipo de prueba física es más relevante para cada familia de prueba.
export function familiaAPruebaFisica(familia: FamiliaPrueba): TipoPruebaFisica {
  switch (familia) {
    case "sprint":
    case "saltos":
      return "velocidad";
    case "lanzamientos":
      return "fuerza";
    case "fondo":
      return "resistencia";
    default:
      return "otra";
  }
}

export function formatoRitmo(segundosPorKm: number): string {
  const min = Math.floor(segundosPorKm / 60);
  const seg = Math.round(segundosPorKm % 60);
  return `${min}:${String(seg).padStart(2, "0")}/km`;
}

// Velocidad máxima estimada entre dos parciales consecutivos (m/s), a
// partir de los tramos de una carrera de sprint.
export function velocidadMaximaEstimada(parciales: Parcial[]): number | null {
  if (parciales.length < 2) return null;
  const ordenados = [...parciales].sort((a, b) => a.distancia - b.distancia);
  let maxima: number | null = null;
  for (let i = 1; i < ordenados.length; i++) {
    const dDist = ordenados[i].distancia - ordenados[i - 1].distancia;
    const dTiempo = ordenados[i].tiempo - ordenados[i - 1].tiempo;
    if (dDist <= 0 || dTiempo <= 0) continue;
    const v = dDist / dTiempo;
    if (maxima === null || v > maxima) maxima = v;
  }
  return maxima;
}

export function resumenIntentos(intentos: Intento[]): { validos: number; totales: number; consistencia: number | null } {
  const totales = intentos.length;
  const valores = intentos.filter((i) => i.validez === "valido").map((i) => i.valor);
  return {
    validos: valores.length,
    totales,
    consistencia: valores.length >= 2 ? Math.max(...valores) - Math.min(...valores) : null,
  };
}

// Diferencia entre el último y el primer km de una carrera de fondo: cuánto
// se ralentiza el ritmo y sube la FC a medida que avanza (deriva por fatiga).
export function derivaRitmoFc(ritmoPorKm: RitmoKm[]): { driftRitmo: number | null; driftFc: number | null } {
  if (ritmoPorKm.length < 2) return { driftRitmo: null, driftFc: null };
  const ordenados = [...ritmoPorKm].sort((a, b) => a.km - b.km);
  const primero = ordenados[0];
  const ultimo = ordenados[ordenados.length - 1];
  return {
    driftRitmo: ultimo.ritmo_seg - primero.ritmo_seg,
    driftFc: primero.fc !== null && ultimo.fc !== null ? ultimo.fc - primero.fc : null,
  };
}

export function ritmoMedio(ritmoPorKm: RitmoKm[]): number | null {
  if (ritmoPorKm.length === 0) return null;
  return ritmoPorKm.reduce((acc, r) => acc + r.ritmo_seg, 0) / ritmoPorKm.length;
}

export function fcMedia(ritmoPorKm: RitmoKm[]): number | null {
  const conFc = ritmoPorKm.filter((r) => r.fc !== null).map((r) => r.fc as number);
  if (conFc.length === 0) return null;
  return conFc.reduce((acc, v) => acc + v, 0) / conFc.length;
}
