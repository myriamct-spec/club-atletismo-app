import { supabase } from "./supabase";
import type { Asistencia } from "../types/database";

export async function listAsistenciasPorAtleta(atletaId: string): Promise<Asistencia[]> {
  const { data, error } = await supabase.from("asistencias").select("*").eq("atleta_id", atletaId).order("fecha");
  if (error) throw error;
  return (data ?? []) as Asistencia[];
}

export async function marcarAsistencia(atletaId: string, fecha: string, presente: boolean): Promise<Asistencia> {
  const { data, error } = await supabase
    .from("asistencias")
    .upsert({ atleta_id: atletaId, fecha, presente }, { onConflict: "atleta_id,fecha" })
    .select()
    .single();
  if (error) throw error;
  return data as Asistencia;
}
