import { supabase } from "./supabase";
import type { PruebaFisica, TipoPruebaFisica } from "../types/database";

export type PruebaFisicaInput = {
  atleta_id: string;
  tipo: TipoPruebaFisica;
  fecha: string;
  valor: number;
  unidad: string;
  protocolo: string | null;
  entrenador_id: string;
};

export async function listPruebasFisicasPorAtleta(atletaId: string): Promise<PruebaFisica[]> {
  const { data, error } = await supabase
    .from("pruebas_fisicas")
    .select("*")
    .eq("atleta_id", atletaId)
    .order("fecha", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PruebaFisica[];
}

export async function createPruebaFisica(input: PruebaFisicaInput): Promise<PruebaFisica> {
  const { data, error } = await supabase.from("pruebas_fisicas").insert(input).select().single();
  if (error) throw error;
  return data as PruebaFisica;
}

export async function deletePruebaFisica(id: string): Promise<void> {
  const { error } = await supabase.from("pruebas_fisicas").delete().eq("id", id);
  if (error) throw error;
}
