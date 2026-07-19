import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cliente aislado, sin persistir sesión: se usa solo para dar de alta el
// usuario de Auth de un nuevo entrenador (auth.signUp) sin pisar la sesión
// del admin que está haciendo el alta en el navegador.
export const supabaseAislado = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
