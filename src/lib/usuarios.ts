import { supabase } from "./supabase";
import type { Usuario } from "../types/database";

export async function listEntrenadores(clubId: string): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("club_id", clubId)
    .eq("rol", "entrenador")
    .order("nombre");

  if (error) throw error;
  return (data ?? []) as Usuario[];
}
