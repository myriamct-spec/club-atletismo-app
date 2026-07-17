import { supabase } from "./supabase";
import type { Atleta, EntrenadorAtleta, Usuario } from "../types/database";

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

export type AsignacionConEntrenador = EntrenadorAtleta & { entrenador: Usuario };

export async function listEntrenadoresAsignados(atletaId: string): Promise<AsignacionConEntrenador[]> {
  const { data, error } = await supabase
    .from("entrenador_atleta")
    .select("*, entrenador:usuarios(*)")
    .eq("atleta_id", atletaId)
    .eq("activo", true);

  if (error) throw error;
  return (data ?? []) as unknown as AsignacionConEntrenador[];
}

export async function asignarEntrenador(atletaId: string, entrenadorId: string): Promise<void> {
  const { error } = await supabase
    .from("entrenador_atleta")
    .upsert(
      { atleta_id: atletaId, entrenador_id: entrenadorId, activo: true },
      { onConflict: "atleta_id,entrenador_id" },
    );
  if (error) throw error;
}

export async function quitarEntrenador(asignacionId: string): Promise<void> {
  const { error } = await supabase.from("entrenador_atleta").update({ activo: false }).eq("id", asignacionId);
  if (error) throw error;
}
