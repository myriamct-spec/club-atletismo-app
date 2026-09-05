import { supabase } from "./supabase";

export async function cambiarPassword(nuevaPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
  if (error) throw error;
}

export async function enviarResetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/restablecer-password`,
  });
  if (error) throw error;
}

export async function registrarComoEntrenador(params: {
  nombre: string;
  email: string;
  password: string;
}): Promise<void> {
  const { error: signUpError } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
  });
  if (signUpError) throw signUpError;

  const { error: rpcError } = await supabase.rpc("registrar_entrenador", { p_nombre: params.nombre });
  if (rpcError) throw rpcError;

  await supabase.auth.signOut();
}
