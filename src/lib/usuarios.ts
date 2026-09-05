import { supabase } from "./supabase";
import type { Rol, Usuario } from "../types/database";

export async function listEntrenadores(clubId: string): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("club_id", clubId)
    .eq("rol", "entrenador")
    .eq("activo", true)
    .order("nombre");

  if (error) throw error;
  return (data ?? []) as Usuario[];
}

export async function listUsuariosClub(clubId: string): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("club_id", clubId)
    .order("nombre");

  if (error) throw error;
  return (data ?? []) as Usuario[];
}

export async function actualizarActivoUsuario(id: string, activo: boolean): Promise<void> {
  const { error } = await supabase.from("usuarios").update({ activo }).eq("id", id);
  if (error) throw error;
}

export async function actualizarRolUsuario(id: string, rol: Rol): Promise<void> {
  const { error } = await supabase.from("usuarios").update({ rol }).eq("id", id);
  if (error) throw error;
}
