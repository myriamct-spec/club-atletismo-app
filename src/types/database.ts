export type Rol = "admin" | "entrenador";
export type UnidadMedida = "tiempo" | "distancia" | "altura" | "puntos";
export type TipoCompeticion = "pista_aire_libre" | "pista_cubierta" | "campo_a_traves" | "ruta";
export type OrigenCompeticion = "manual" | "importado";
export type TipoPruebaFisica = "fuerza" | "velocidad" | "resistencia" | "flexibilidad" | "otra";

export interface Club {
  id: string;
  nombre: string;
  logo_url: string | null;
  created_at: string;
}

export interface Usuario {
  id: string;
  club_id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface Atleta {
  id: string;
  club_id: string;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string;
  genero: string;
  id_socio: string | null;
  fecha_alta: string;
  foto_url: string | null;
  lesionado: boolean;
  observaciones_generales: string | null;
  activo: boolean;
}

export interface EntrenadorAtleta {
  id: string;
  atleta_id: string;
  entrenador_id: string;
  fecha_asignacion: string;
  activo: boolean;
}

export interface Disciplina {
  id: string;
  nombre: string;
  unidad_medida: UnidadMedida;
}

export interface Competicion {
  id: string;
  club_id: string;
  nombre: string;
  fecha: string;
  lugar: string | null;
  tipo: TipoCompeticion;
  temporada: string;
  origen: OrigenCompeticion;
}

export interface Resultado {
  id: string;
  atleta_id: string;
  competicion_id: string;
  disciplina_id: string;
  marca: string;
  puesto: number | null;
  viento: number | null;
  es_marca_personal: boolean;
  observaciones: string | null;
}

export interface PruebaFisica {
  id: string;
  atleta_id: string;
  tipo: TipoPruebaFisica;
  fecha: string;
  valor: number;
  unidad: string;
  protocolo: string | null;
  entrenador_id: string;
}

export interface Comentario {
  id: string;
  atleta_id: string;
  entrenador_id: string;
  fecha: string;
  texto: string;
  categoria: string | null;
}

export interface ImportacionLog {
  id: string;
  club_id: string;
  tipo: "atletas" | "resultados";
  fecha: string;
  usuario_id: string;
  archivo_nombre: string;
  filas_totales: number;
  filas_ok: number;
  filas_error: number;
  detalle_errores: string | null;
}
