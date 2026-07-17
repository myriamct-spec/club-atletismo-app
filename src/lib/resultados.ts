import { supabase } from "./supabase";
import type { Atleta, Competicion, Disciplina, Resultado } from "../types/database";

export type ResultadoInput = {
  atleta_id: string;
  competicion_id: string;
  disciplina_id: string;
  marca: string;
  puesto: number | null;
  viento: number | null;
  es_marca_personal: boolean;
  observaciones: string | null;
};

export type ResultadoConCompeticion = Resultado & { competicion: Competicion; disciplina: Disciplina };
export type ResultadoConAtleta = Resultado & { atleta: Atleta; disciplina: Disciplina };

export async function listResultadosPorAtleta(atletaId: string): Promise<ResultadoConCompeticion[]> {
  const { data, error } = await supabase
    .from("resultados")
    .select("*, competicion:competiciones(*), disciplina:disciplinas(*)")
    .eq("atleta_id", atletaId)
    .order("fecha", { ascending: false, referencedTable: "competiciones" });

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
