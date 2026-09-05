import { supabase } from "./supabase";
import type { Rol, Usuario } from "../types/database";

// Cualquier usuario activo del club puede ser responsable de un grupo, no
// solo los que tienen rol "entrenador": un admin ya puede ver y gestionar
// cualquier atleta igual que un entrenador, así que también puede aparecer
// como responsable asignado de un grupo. El rol solo controla el acceso al
// panel de administración (usuarios, ajustes...), no la capacidad de
// entrenar.
export async function listPersonalAsignable(clubId: string): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("club_id", clubId)
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
