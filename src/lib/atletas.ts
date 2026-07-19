import { supabase } from "./supabase";
import type { Atleta } from "../types/database";

export type AtletaInput = {
  club_id: string;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string;
  genero: string;
  id_socio: string | null;
  foto_url: string | null;
  observaciones_generales: string | null;
  lesionado: boolean;
  activo: boolean;
};

export async function listAtletas(): Promise<Atleta[]> {
  const { data, error } = await supabase.from("atletas").select("*").order("apellidos");
  if (error) throw error;
  return (data ?? []) as Atleta[];
}

export async function getAtleta(id: string): Promise<Atleta | null> {
  const { data, error } = await supabase.from("atletas").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Atleta;
}

export async function createAtleta(input: AtletaInput): Promise<Atleta> {
  const { data, error } = await supabase.from("atletas").insert(input).select().single();
  if (error) throw mapAtletaError(error);
  return data as Atleta;
}

export async function updateAtleta(id: string, patch: Partial<AtletaInput>): Promise<Atleta> {
  const { data, error } = await supabase.from("atletas").update(patch).eq("id", id).select().single();
  if (error) throw mapAtletaError(error);
  return data as Atleta;
}

function mapAtletaError(error: { code?: string; message: string }): Error {
  if (error.code === "23505") {
    return new Error("Ya existe un atleta con ese ID de socio en el club.");
  }
  return new Error(error.message);
}

