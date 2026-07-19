import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAtleta } from "../lib/atletas";
import { calcularCategoria, calcularEdad } from "../lib/categorias";
import { listResultadosPorAtleta, type ResultadoConCompeticion } from "../lib/resultados";
import { listGruposDeAtleta } from "../lib/grupos";
import { PruebasFisicasSeccion } from "../components/PruebasFisicasSeccion";
import { ComentariosSeccion } from "../components/ComentariosSeccion";
import type { Atleta, Grupo } from "../types/database";
import { mensajeError } from "../lib/errors";

export default function AtletaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [atleta, setAtleta] = useState<Atleta | null>(null);
  const [resultados, setResultados] = useState<ResultadoConCompeticion[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!id) return;
    setCargando(true);
    try {
      const atletaData = await getAtleta(id);
      setAtleta(atletaData);
      const [resultadosData, gruposData] = await Promise.all([
        listResultadosPorAtleta(id),
        atletaData ? listGruposDeAtleta(atletaData) : Promise.resolve([]),
      ]);
      setResultados(resultadosData);
      setGrupos(gruposData);
    } catch (err) {
      setError(mensajeError(err, "No se pudo cargar la ficha."));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (cargando) return <p className="text-sm text-navy-800/60">Cargando…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!atleta) return <p className="text-sm text-navy-800/60">No se encontró el atleta.</p>;

  const categoria = calcularCategoria(atleta.fecha_nacimiento);

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
            {categoria} · {calcularEdad(atleta.fecha_nacimiento)} años
            {atleta.id_socio && <> · Socio {atleta.id_socio}</>}
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              to={`/atletas/${atleta.id}/editar`}
              className="inline-block rounded-lg border border-navy-900/20 px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-white"
            >
              Editar ficha
            </Link>
            <Link
              to={`/atletas/${atleta.id}/informe`}
              className="inline-block rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-navy-800"
            >
              Ver informe de evolución
            </Link>
          </div>
        </div>
      </div>

      {atleta.observaciones_generales && (
        <div className="mt-6 rounded-2xl border border-navy-900/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Observaciones generales</p>
          <p className="mt-2 text-sm text-navy-900">{atleta.observaciones_generales}</p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-navy-900/10 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Grupo</p>

        {grupos.length === 0 ? (
          <p className="mt-2 text-sm text-navy-800/60">
            {categoria === "Absoluta"
              ? "Sin grupo de entrenamiento asignado todavía."
              : "Todavía no hay un grupo creado para esta categoría."}
            {usuario?.rol === "admin" && (
              <>
                {" "}
                <Link to="/grupos" className="text-navy-900 underline">
                  Gestionar grupos
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {grupos.map((g) => (
              <li key={g.id} className="text-sm">
                <Link to={`/grupos/${g.id}`} className="font-medium text-navy-900 hover:underline">
                  {g.nombre}
                </Link>
              </li>
            ))}
          </ul>
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

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <PruebasFisicasSeccion atletaId={atleta.id} />
        <ComentariosSeccion atletaId={atleta.id} />
      </div>
    </div>
  );
}
