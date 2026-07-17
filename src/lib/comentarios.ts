import { supabase } from "./supabase";
import type { Comentario, Usuario } from "../types/database";

export type ComentarioInput = {
  atleta_id: string;
  entrenador_id: string;
  fecha: string;
  texto: string;
  categoria: string | null;
};

export type ComentarioConEntrenador = Comentario & { entrenador: Usuario };

export async function listComentariosPorAtleta(atletaId: string): Promise<ComentarioConEntrenador[]> {
  const { data, error } = await supabase
    .from("comentarios")
    .select("*, entrenador:usuarios(*)")
    .eq("atleta_id", atletaId)
    .order("fecha", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ComentarioConEntrenador[];
}

export async function createComentario(input: ComentarioInput): Promise<Comentario> {
  const { data, error } = await supabase.from("comentarios").insert(input).select().single();
  if (error) throw error;
  return data as Comentario;
}

export async function deleteComentario(id: string): Promise<void> {
  const { error } = await supabase.from("comentarios").delete().eq("id", id);
  if (error) throw error;
}
