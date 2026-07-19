import { supabase } from "./supabase";
import type { Atleta, Competicion, Disciplina, Intento, Parcial, Resultado, RitmoKm, TipoResultado, ValidezResultado } from "../types/database";

export type ResultadoInput = {
  atleta_id: string;
  competicion_id?: string | null;
  disciplina_id: string;
  marca: string;
  puesto: number | null;
  viento: number | null;
  es_marca_personal: boolean;
  observaciones: string | null;
  fecha?: string;
  tipo?: TipoResultado;
  validez?: ValidezResultado;
  condiciones?: string | null;
  intentos?: Intento[] | null;
  parciales?: Parcial[] | null;
  ritmo_por_km?: RitmoKm[] | null;
  percepcion_esfuerzo?: number | null;
  nota?: string | null;
};

export type ResultadoConCompeticion = Resultado & { competicion: Competicion | null; disciplina: Disciplina };
export type ResultadoConAtleta = Resultado & { atleta: Atleta; disciplina: Disciplina };

export async function listResultadosPorAtleta(atletaId: string): Promise<ResultadoConCompeticion[]> {
  const { data, error } = await supabase
    .from("resultados")
    .select("*, competicion:competiciones(*), disciplina:disciplinas(*)")
    .eq("atleta_id", atletaId)
    .order("fecha", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ResultadoConCompeticion[];
}

export async function listResultadosPorCompeticion(competicionId: string): Promise<ResultadoConAtleta[]> {
  const { data, error } = await supabase
    .from("resultados")
    .select("*, atleta:atletas(*), disciplina:disciplinas(*)")
    .eq("competicion_id", competicionId);

  if (error) throw error;
  return (data ?? []) as unknown as ResultadoConAtleta[];
}

export async function createResultado(input: ResultadoInput): Promise<Resultado> {
  const { data, error } = await supabase.from("resultados").insert(input).select().single();
  if (error) throw error;
  return data as Resultado;
}

export async function deleteResultado(id: string): Promise<void> {
  const { error } = await supabase.from("resultados").delete().eq("id", id);
  if (error) throw error;
}
