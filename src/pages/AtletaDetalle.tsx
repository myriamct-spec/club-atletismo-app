import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listEntrenadores } from "../lib/usuarios";
import {
  asignarEntrenador,
  getAtleta,
  listEntrenadoresAsignados,
  quitarEntrenador,
  type AsignacionConEntrenador,
} from "../lib/atletas";
import { calcularCategoria, calcularEdad } from "../lib/categorias";
import { listResultadosPorAtleta, type ResultadoConCompeticion } from "../lib/resultados";
import type { Atleta, Usuario } from "../types/database";

export default function AtletaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, club } = useAuth();

  const [atleta, setAtleta] = useState<Atleta | null>(null);
  const [resultados, setResultados] = useState<ResultadoConCompeticion[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionConEntrenador[]>([]);
  const [entrenadoresClub, setEntrenadoresClub] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entrenadorSeleccionado, setEntrenadorSeleccionado] = useState("");

  async function cargar() {
    if (!id || !club) return;
    setCargando(true);
    try {
      const [atletaData, asignacionesData, resultadosData] = await Promise.all([
        getAtleta(id),
        listEntrenadoresAsignados(id),
        listResultadosPorAtleta(id),
      ]);
      setAtleta(atletaData);
      setAsignaciones(asignacionesData);
      setResultados(resultadosData);
      if (usuario?.rol === "admin") {
        setEntrenadoresClub(await listEntrenadores(club.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la ficha.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, club?.id]);

  async function handleAsignar() {
    if (!id || !entrenadorSeleccionado) return;
    await asignarEntrenador(id, entrenadorSeleccionado);
    setEntrenadorSeleccionado("");
    cargar();
  }

  async function handleQuitar(asignacionId: string) {
    await quitarEntrenador(asignacionId);
    cargar();
  }

  if (cargando) return <p className="text-sm text-navy-800/60">Cargando…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!atleta) return <p className="text-sm text-navy-800/60">No se encontró el atleta.</p>;

  const entrenadoresDisponibles = entrenadoresClub.filter(
    (e) => !asignaciones.some((a) => a.entrenador_id === e.id),
  );

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate("/atletas")} className="text-sm text-navy-800/60 hover:text-navy-900">
        ← Volver a atletas
      </button>

      <div className="mt-4 flex items-start gap-5">
        {atleta.foto_url ? (
          <img src={atleta.foto_url} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy-900 font-display text-2xl text-gold-300">
            {atleta.nombre.charAt(0)}
            {atleta.apellidos.charAt(0)}
          </div>
        )}

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-900">
              {atleta.nombre} {atleta.apellidos}
            </h1>
            {!atleta.activo && (
              <span className="rounded-full bg-navy-900/10 px-2 py-0.5 text-xs font-medium text-navy-800">Baja</span>
            )}
            {atleta.lesionado && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Lesionado</span>
            )}
          </div>
          <p className="mt-1 text-sm text-navy-800/70">
            {calcularCategoria(atleta.fecha_nacimiento)} · {calcularEdad(atleta.fecha_nacimiento)} años
            {atleta.id_socio && <> · Socio {atleta.id_socio}</>}
          </p>
          <Link
            to={`/atletas/${atleta.id}/editar`}
            className="mt-3 inline-block rounded-lg border border-navy-900/20 px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-white"
          >
            Editar ficha
          </Link>
        </div>
      </div>

      {atleta.observaciones_generales && (
        <div className="mt-6 rounded-2xl border border-navy-900/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Observaciones generales</p>
          <p className="mt-2 text-sm text-navy-900">{atleta.observaciones_generales}</p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-navy-900/10 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Entrenadores asignados</p>

        {asignaciones.length === 0 ? (
          <p className="mt-2 text-sm text-navy-800/60">Sin entrenador asignado todavía.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {asignaciones.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-navy-900">{a.entrenador.nombre}</span>
                {usuario?.rol === "admin" && (
                  <button onClick={() => handleQuitar(a.id)} className="text-xs font-medium text-red-600 hover:underline">
                    Quitar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {usuario?.rol === "admin" && entrenadoresDisponibles.length > 0 && (
          <div className="mt-4 flex gap-2">
            <select
              value={entrenadorSeleccionado}
              onChange={(e) => setEntrenadorSeleccionado(e.target.value)}
              className="input"
            >
              <option value="">Seleccionar entrenador…</option>
              {entrenadoresDisponibles.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
            <button
              onClick={handleAsignar}
              disabled={!entrenadorSeleccionado}
              className="whitespace-nowrap rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-50"
            >
              Asignar
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-navy-900/10 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Resultados de competición</p>
        {resultados.length === 0 ? (
          <p className="mt-2 text-sm text-navy-800/60">Todavía no hay resultados registrados.</p>
        ) : (
          <ul className="mt-3 divide-y divide-navy-900/5">
            {resultados.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <Link to={`/competiciones/${r.competicion.id}`} className="font-medium text-navy-900 hover:underline">
                    {r.competicion.nombre}
                  </Link>
                  <span className="text-navy-800/60"> · {r.disciplina.nombre}</span>
                </div>
                <div className="flex items-center gap-2 text-navy-800/70">
                  {new Date(r.competicion.fecha).toLocaleDateString("es-ES")}
                  <span className="font-semibold text-navy-900">{r.marca}</span>
                  {r.es_marca_personal && (
                    <span className="rounded-full bg-gold-300/40 px-2 py-0.5 text-xs font-medium text-navy-900">PB</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SeccionProximamente titulo="Pruebas físicas" />
        <SeccionProximamente titulo="Comentarios del entrenador" />
      </div>
    </div>
  );
}

function SeccionProximamente({ titulo }: { titulo: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy-900/20 bg-white p-5">
      <p className="text-sm font-medium text-navy-900">{titulo}</p>
      <p className="mt-1 text-xs text-navy-800/50">Próximamente</p>
    </div>
  );
}
