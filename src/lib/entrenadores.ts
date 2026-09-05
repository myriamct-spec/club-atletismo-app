import { supabase } from "./supabase";
import { supabaseAislado } from "./supabaseAdmin";
import type { Rol, Usuario } from "../types/database";

export async function crearUsuario(params: {
  club_id: string;
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
}): Promise<Usuario> {
  const { data, error } = await supabaseAislado.auth.signUp({
    email: params.email,
    password: params.password,
  });
  if (error) throw error;
  if (!data.user) throw new Error("No se pudo crear el usuario de acceso.");

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .insert({
      id: data.user.id,
      club_id: params.club_id,
      nombre: params.nombre,
      email: params.email,
      rol: params.rol,
    })
    .select()
    .single();

  if (usuarioError) throw usuarioError;
  return usuario as Usuario;
}
