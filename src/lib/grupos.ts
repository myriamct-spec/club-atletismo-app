import { supabase } from "./supabase";
import { calcularCategoria } from "./categorias";
import type { Atleta, AtletaGrupo, EntrenadorGrupo, Grupo, TipoGrupo, Usuario } from "../types/database";

export type GrupoInput = {
  club_id: string;
  nombre: string;
  tipo: TipoGrupo;
  categoria: string | null;
};

export async function listGrupos(): Promise<Grupo[]> {
  const { data, error } = await supabase.from("grupos").select("*").order("nombre");
  if (error) throw error;
  return (data ?? []) as Grupo[];
}

export async function getGrupo(id: string): Promise<Grupo | null> {
  const { data, error } = await supabase.from("grupos").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Grupo;
}

export async function createGrupo(input: GrupoInput): Promise<Grupo> {
  const { data, error } = await supabase.from("grupos").insert(input).select().single();
  if (error) throw error;
  return data as Grupo;
}

export async function updateGrupo(id: string, input: Omit<GrupoInput, "club_id">): Promise<Grupo> {
  const { data, error } = await supabase.from("grupos").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Grupo;
}

export async function deleteGrupo(id: string): Promise<void> {
  const { error } = await supabase.from("grupos").delete().eq("id", id);
  if (error) throw error;
}

export type AsignacionEntrenador = EntrenadorGrupo & { entrenador: Usuario };

export async function listEntrenadoresDeGrupo(grupoId: string): Promise<AsignacionEntrenador[]> {
  const { data, error } = await supabase
    .from("entrenador_grupo")
    .select("*, entrenador:usuarios(*)")
    .eq("grupo_id", grupoId);
  if (error) throw error;
  return (data ?? []) as unknown as AsignacionEntrenador[];
}

export async function asignarEntrenadorAGrupo(grupoId: string, entrenadorId: string): Promise<void> {
  const { error } = await supabase
    .from("entrenador_grupo")
    .upsert({ grupo_id: grupoId, entrenador_id: entrenadorId }, { onConflict: "grupo_id,entrenador_id" });
  if (error) throw error;
}

export async function quitarEntrenadorDeGrupo(id: string): Promise<void> {
  const { error } = await supabase.from("entrenador_grupo").delete().eq("id", id);
  if (error) throw error;
}

export type AsignacionAtleta = AtletaGrupo & { atleta: Atleta };

export async function listAtletasManualDeGrupo(grupoId: string): Promise<AsignacionAtleta[]> {
  const { data, error } = await supabase
    .from("atleta_grupo")
    .select("*, atleta:atletas(*)")
    .eq("grupo_id", grupoId);
  if (error) throw error;
  return (data ?? []) as unknown as AsignacionAtleta[];
}

export async function asignarAtletaAGrupo(atletaId: string, grupoId: string): Promise<void> {
  const { error } = await supabase
    .from("atleta_grupo")
    .upsert({ atleta_id: atletaId, grupo_id: grupoId }, { onConflict: "atleta_id,grupo_id" });
  if (error) throw error;
}

export async function quitarAtletaDeGrupo(id: string): Promise<void> {
  const { error } = await supabase.from("atleta_grupo").delete().eq("id", id);
  if (error) throw error;
}

// Grupos por edad se calculan según la categoría del atleta; los de
// entrenamiento requieren una fila en atleta_grupo. Se combinan aquí porque
// la ficha del atleta necesita ver ambos tipos juntos.
export async function listGruposDeAtleta(atleta: Atleta): Promise<Grupo[]> {
  const [grupos, asignaciones] = await Promise.all([
    listGrupos(),
    supabase.from("atleta_grupo").select("grupo_id").eq("atleta_id", atleta.id),
  ]);
  if (asignaciones.error) throw asignaciones.error;

  const idsManual = new Set((asignaciones.data ?? []).map((a) => a.grupo_id as string));
  const categoria = calcularCategoria(atleta.fecha_nacimiento);

  return grupos.filter(
    (g) => (g.tipo === "categoria_edad" && g.categoria === categoria) || (g.tipo === "entrenamiento" && idsManual.has(g.id)),
  );
}
