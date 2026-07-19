import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listEntrenadores } from "../lib/usuarios";
import { listAtletas } from "../lib/atletas";
import { calcularCategoria } from "../lib/categorias";
import {
  getGrupo,
  listEntrenadoresDeGrupo,
  asignarEntrenadorAGrupo,
  quitarEntrenadorDeGrupo,
  listAtletasManualDeGrupo,
  asignarAtletaAGrupo,
  quitarAtletaDeGrupo,
  type AsignacionEntrenador,
  type AsignacionAtleta,
} from "../lib/grupos";
import { mensajeError } from "../lib/errors";
import type { Atleta, Grupo, Usuario } from "../types/database";

export default function GrupoDetalle() {
  const { id } = useParams();
  const { club } = useAuth();

  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [entrenadoresAsignados, setEntrenadoresAsignados] = useState<AsignacionEntrenador[]>([]);
  const [atletasAsignados, setAtletasAsignados] = useState<AsignacionAtleta[]>([]);
  const [entrenadoresClub, setEntrenadoresClub] = useState<Usuario[]>([]);
  const [atletasClub, setAtletasClub] = useState<Atleta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entrenadorSeleccionado, setEntrenadorSeleccionado] = useState("");
  const [atletaSeleccionado, setAtletaSeleccionado] = useState("");

  async function cargar() {
    if (!id || !club) return;
    setCargando(true);
    try {
      const [g, entAsig, atlAsig, entClub, atlClub] = await Promise.all([
        getGrupo(id),
        listEntrenadoresDeGrupo(id),
        listAtletasManualDeGrupo(id),
        listEntrenadores(club.id),
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
    (a) => calcularCategoria(a.fecha_nacimiento) === "Absoluto" && !atletasAsignados.some((x) => x.atleta_id === a.id),
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

  return (
    <div className="max-w-2xl">
      <Link to="/grupos" className="text-sm text-navy-800/60 hover:text-navy-900">
        ← Volver a grupos
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-navy-900">{grupo.nombre}</h1>
      <p className="mt-1 text-sm text-navy-800/70">
        {grupo.tipo === "categoria_edad" ? `Por categoría de edad · ${grupo.categoria}` : "De entrenamiento (Absoluto)"}
      </p>

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
              <option value="">Seleccionar entrenador…</option>
              {entrenadoresDisponibles.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
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
                <option value="">Seleccionar atleta (categoría Absoluto)…</option>
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
