import { supabase } from "./supabase";
import type { Rol, Usuario } from "../types/database";

// "es_entrenador" (no "rol") decide quién puede ser responsable asignado de
// un grupo. Todo entrenador lo es por definición; un admin puede además
// entrenar, o no — se marca aparte en /usuarios. El rol solo controla el
// acceso al panel de administración.
export async function listPersonalAsignable(clubId: string): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("club_id", clubId)
    .eq("activo", true)
    .eq("es_entrenador", true)
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
  // Todo entrenador es asignable a grupos por definición; al pasar a admin
  // se deja es_entrenador como estaba (si ya entrenaba, sigue entrenando).
  const patch: { rol: Rol; es_entrenador?: boolean } = { rol };
  if (rol === "entrenador") patch.es_entrenador = true;
  const { error } = await supabase.from("usuarios").update(patch).eq("id", id);
  if (error) throw error;
}

export async function actualizarEsEntrenadorUsuario(id: string, es_entrenador: boolean): Promise<void> {
  const { error } = await supabase.from("usuarios").update({ es_entrenador }).eq("id", id);
  if (error) throw error;
}
