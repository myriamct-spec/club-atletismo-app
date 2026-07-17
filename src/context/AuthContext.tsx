import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Club, Usuario } from "../types/database";

interface AuthContextValue {
  session: Session | null;
  usuario: Usuario | null;
  club: Club | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshClub: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUsuarioYClub(userId: string) {
    const { data: usuarioData } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single();

    if (!usuarioData) {
      setUsuario(null);
      setClub(null);
      return;
    }

    setUsuario(usuarioData as Usuario);

    const { data: clubData } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", usuarioData.club_id)
      .single();

    setClub((clubData as Club) ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadUsuarioYClub(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadUsuarioYClub(newSession.user.id);
      } else {
        setUsuario(null);
        setClub(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshClub() {
    if (usuario) {
      const { data } = await supabase.from("clubs").select("*").eq("id", usuario.club_id).single();
      setClub((data as Club) ?? null);
    }
  }

  return (
    <AuthContext.Provider value={{ session, usuario, club, loading, signIn, signOut, refreshClub }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
