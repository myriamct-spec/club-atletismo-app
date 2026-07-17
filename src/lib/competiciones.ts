import { supabase } from "./supabase";
import type { Competicion, OrigenCompeticion, TipoCompeticion } from "../types/database";

export type CompeticionInput = {
  club_id: string;
  nombre: string;
  fecha: string;
  lugar: string | null;
  tipo: TipoCompeticion;
  temporada: string;
  origen: OrigenCompeticion;
};

export async function listCompeticiones(): Promise<Competicion[]> {
  const { data, error } = await supabase.from("competiciones").select("*").order("fecha", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Competicion[];
}

export async function getCompeticion(id: string): Promise<Competicion | null> {
  const { data, error } = await supabase.from("competiciones").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Competicion;
}

export async function createCompeticion(input: CompeticionInput): Promise<Competicion> {
  const { data, error } = await supabase.from("competiciones").insert(input).select().single();
  if (error) throw error;
  return data as Competicion;
}
