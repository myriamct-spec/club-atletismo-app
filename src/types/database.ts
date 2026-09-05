export type Rol = "admin" | "entrenador";
export type UnidadMedida = "tiempo" | "distancia" | "altura" | "puntos";
export type TipoCompeticion = "pista_aire_libre" | "pista_cubierta" | "campo_a_traves" | "ruta";
export type OrigenCompeticion = "manual" | "importado";
export type TipoPruebaFisica = "fuerza" | "velocidad" | "resistencia" | "flexibilidad" | "otra";
export type FamiliaPrueba = "sprint" | "fondo" | "saltos" | "lanzamientos" | "otra";
export type TipoResultado = "competicion" | "test_control";
export type ValidezResultado = "valido" | "nulo" | "no_presentado";

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
  activo: boolean;
  es_entrenador: boolean;
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

export type TipoGrupo = "categoria_edad" | "entrenamiento";

export interface Grupo {
  id: string;
  club_id: string;
  nombre: string;
  tipo: TipoGrupo;
  categoria: string | null;
}

export interface EntrenadorGrupo {
  id: string;
  grupo_id: string;
  entrenador_id: string;
}

export interface AtletaGrupo {
  id: string;
  atleta_id: string;
  grupo_id: string;
}

export interface Disciplina {
  id: string;
  nombre: string;
  unidad_medida: UnidadMedida;
  familia: FamiliaPrueba;
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

// Intento suelto de una prueba de saltos/lanzamientos.
export interface Intento {
  numero: number;
  valor: number;
  validez: ValidezResultado;
}

// Parcial de una carrera de sprint (distancia acumulada -> tiempo acumulado).
export interface Parcial {
  distancia: number;
  tiempo: number;
}

// Punto de ritmo/frecuencia cardíaca de una carrera de fondo, por km o vuelta.
// ritmo_seg = segundos por km, para poder graficar y comparar sin parsear texto.
export interface RitmoKm {
  km: number;
  ritmo_seg: number;
  fc: number | null;
}

export interface Resultado {
  id: string;
  atleta_id: string;
  competicion_id: string | null;
  disciplina_id: string;
  fecha: string;
  tipo: TipoResultado;
  marca: string;
  validez: ValidezResultado;
  puesto: number | null;
  viento: number | null;
  es_marca_personal: boolean;
  observaciones: string | null;
  condiciones: string | null;
  intentos: Intento[] | null;
  parciales: Parcial[] | null;
  ritmo_por_km: RitmoKm[] | null;
  percepcion_esfuerzo: number | null;
  nota: string | null;
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

export interface Asistencia {
  id: string;
  atleta_id: string;
  fecha: string;
  presente: boolean;
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
