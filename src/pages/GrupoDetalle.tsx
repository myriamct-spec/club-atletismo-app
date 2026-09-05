import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listPersonalAsignable } from "../lib/usuarios";
import { listAtletas } from "../lib/atletas";
import { calcularCategoria, CATEGORIAS_EDAD_ASIGNABLES } from "../lib/categorias";
import {
  getGrupo,
  listEntrenadoresDeGrupo,
  asignarEntrenadorAGrupo,
  quitarEntrenadorDeGrupo,
  listAtletasManualDeGrupo,
  asignarAtletaAGrupo,
  quitarAtletaDeGrupo,
  updateGrupo,
  deleteGrupo,
  type AsignacionEntrenador,
  type AsignacionAtleta,
} from "../lib/grupos";
import { mensajeError } from "../lib/errors";
import type { Atleta, Grupo, TipoGrupo, Usuario } from "../types/database";

export default function GrupoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { club, usuario } = useAuth();

  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [entrenadoresAsignados, setEntrenadoresAsignados] = useState<AsignacionEntrenador[]>([]);
  const [atletasAsignados, setAtletasAsignados] = useState<AsignacionAtleta[]>([]);
  const [entrenadoresClub, setEntrenadoresClub] = useState<Usuario[]>([]);
  const [atletasClub, setAtletasClub] = useState<Atleta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entrenadorSeleccionado, setEntrenadorSeleccionado] = useState("");
  const [atletaSeleccionado, setAtletaSeleccionado] = useState("");
  const [editando, setEditando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  async function cargar() {
    if (!id || !club) return;
    setCargando(true);
    try {
      const [g, entAsig, atlAsig, entClub, atlClub] = await Promise.all([
        getGrupo(id),
        listEntrenadoresDeGrupo(id),
        listAtletasManualDeGrupo(id),
        listPersonalAsignable(club.id),
        listAtletas(),
      ]);
      setGrupo(g);
      setEntrenadoresAsignados(entAsig);
      setAtletasAsignados(atlAsig);
      setEntrenadoresClub(entClub);
      setAtletasClub(atlClub);
    } catch (err) {
      setError(mensajeError(err, "No se pudo cargar el grupo."));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, club?.id]);

  if (cargando) return <p className="text-sm text-navy-800/60">Cargando…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!grupo) return <p className="text-sm text-navy-800/60">No se encontró el grupo.</p>;

  const entrenadoresDisponibles = entrenadoresClub.filter(
    (e) => !entrenadoresAsignados.some((a) => a.entrenador_id === e.id),
  );

  const atletasCategoriaAutomatica =
    grupo.tipo === "categoria_edad"
      ? atletasClub.filter((a) => calcularCategoria(a.fecha_nacimiento) === grupo.categoria)
      : [];

  const atletasDisponiblesManual = atletasClub.filter(
    (a) => !atletasAsignados.some((x) => x.atleta_id === a.id),
  );

  async function handleAsignarEntrenador() {
    if (!id || !entrenadorSeleccionado) return;
    await asignarEntrenadorAGrupo(id, entrenadorSeleccionado);
    setEntrenadorSeleccionado("");
    cargar();
  }

  async function handleQuitarEntrenador(asignacionId: string) {
    await quitarEntrenadorDeGrupo(asignacionId);
    cargar();
  }

  async function handleAsignarAtleta() {
    if (!id || !atletaSeleccionado) return;
    await asignarAtletaAGrupo(atletaSeleccionado, id);
    setAtletaSeleccionado("");
    cargar();
  }

  async function handleQuitarAtleta(asignacionId: string) {
    await quitarAtletaDeGrupo(asignacionId);
    cargar();
  }

  async function handleEliminarGrupo() {
    if (!grupo) return;
    if (!window.confirm(`¿Eliminar el grupo "${grupo.nombre}"? Se perderán sus asignaciones de entrenadores y atletas.`)) {
      return;
    }
    setEliminando(true);
    try {
      await deleteGrupo(grupo.id);
      navigate("/grupos");
    } catch (err) {
      setError(mensajeError(err, "No se pudo eliminar el grupo."));
      setEliminando(false);
    }
  }

  const esAdmin = usuario?.rol === "admin";

  return (
    <div className="max-w-2xl">
      <Link to="/grupos" className="text-sm text-navy-800/60 hover:text-navy-900">
        ← Volver a grupos
      </Link>

      {editando ? (
        <FormularioEdicionGrupo
          grupo={grupo}
          onGuardado={() => {
            setEditando(false);
            cargar();
          }}
          onCancelar={() => setEditando(false)}
        />
      ) : (
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{grupo.nombre}</h1>
            <p className="mt-1 text-sm text-navy-800/70">
              {grupo.tipo === "categoria_edad" ? `Por categoría de edad · ${grupo.categoria}` : "De entrenamiento"}
            </p>
          </div>
          {esAdmin && (
            <div className="flex shrink-0 gap-3 pt-1">
              <button onClick={() => setEditando(true)} className="text-xs font-medium text-navy-800 hover:underline">
                Editar
              </button>
              <button
                onClick={handleEliminarGrupo}
                disabled={eliminando}
                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                {eliminando ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-navy-900/10 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Entrenadores asignados</p>

        {entrenadoresAsignados.length === 0 ? (
          <p className="mt-2 text-sm text-navy-800/60">Sin entrenador asignado todavía.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {entrenadoresAsignados.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-navy-900">{a.entrenador.nombre}</span>
                <button onClick={() => handleQuitarEntrenador(a.id)} className="text-xs font-medium text-red-600 hover:underline">
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        {entrenadoresDisponibles.length > 0 && (
          <div className="mt-4 flex gap-2">
            <select value={entrenadorSeleccionado} onChange={(e) => setEntrenadorSeleccionado(e.target.value)} className="input">
              <option value="">Seleccionar responsable…</option>
              {entrenadoresDisponibles.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre} ({e.rol})
                </option>
              ))}
            </select>
            <button
              onClick={handleAsignarEntrenador}
              disabled={!entrenadorSeleccionado}
              className="whitespace-nowrap rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-50"
            >
              Asignar
            </button>
          </div>
        )}
      </div>

      {grupo.tipo === "categoria_edad" ? (
        <div className="mt-6 rounded-2xl border border-navy-900/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">
            Atletas en esta categoría (automático)
          </p>
          {atletasCategoriaAutomatica.length === 0 ? (
            <p className="mt-2 text-sm text-navy-800/60">Ningún atleta tiene esta categoría todavía.</p>
          ) : (
            <ul className="mt-3 divide-y divide-navy-900/5">
              {atletasCategoriaAutomatica.map((a) => (
                <li key={a.id} className="py-2 text-sm text-navy-900">
                  <Link to={`/atletas/${a.id}`} className="hover:underline">
                    {a.nombre} {a.apellidos}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-navy-900/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Atletas asignados</p>
          {atletasAsignados.length === 0 ? (
            <p className="mt-2 text-sm text-navy-800/60">Sin atletas asignados todavía.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {atletasAsignados.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <Link to={`/atletas/${a.atleta.id}`} className="text-navy-900 hover:underline">
                    {a.atleta.nombre} {a.atleta.apellidos}
                  </Link>
                  <button onClick={() => handleQuitarAtleta(a.id)} className="text-xs font-medium text-red-600 hover:underline">
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          {atletasDisponiblesManual.length > 0 && (
            <div className="mt-4 flex gap-2">
              <select value={atletaSeleccionado} onChange={(e) => setAtletaSeleccionado(e.target.value)} className="input">
                <option value="">Seleccionar atleta…</option>
                {atletasDisponiblesManual.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.apellidos}, {a.nombre}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAsignarAtleta}
                disabled={!atletaSeleccionado}
                className="whitespace-nowrap rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-50"
              >
                Asignar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormularioEdicionGrupo({
  grupo,
  onGuardado,
  onCancelar,
}: {
  grupo: Grupo;
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(grupo.nombre);
  const [tipo, setTipo] = useState<TipoGrupo>(grupo.tipo);
  const [categoria, setCategoria] = useState(grupo.categoria ?? CATEGORIAS_EDAD_ASIGNABLES[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await updateGrupo(grupo.id, {
        nombre,
        tipo,
        categoria: tipo === "categoria_edad" ? categoria : null,
      });
      onGuardado();
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar el grupo."));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-4 rounded-2xl border border-navy-900/10 bg-white p-5">
      <label className="block text-sm">
        <span className="font-medium text-navy-800">Nombre *</span>
        <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="input mt-1" />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy-800">Tipo</span>
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoGrupo)} className="input mt-1">
          <option value="categoria_edad">Por categoría de edad</option>
          <option value="entrenamiento">De entrenamiento (manual)</option>
        </select>
      </label>

      {tipo === "categoria_edad" && (
        <label className="block text-sm">
          <span className="font-medium text-navy-800">Categoría</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input mt-1">
            {CATEGORIAS_EDAD_ASIGNABLES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-ground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
