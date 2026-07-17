import { supabase } from "./supabase";
import type { Disciplina } from "../types/database";

export async function listDisciplinas(): Promise<Disciplina[]> {
  const { data, error } = await supabase.from("disciplinas").select("*").order("nombre");
  if (error) throw error;
  return (data ?? []) as Disciplina[];
}
