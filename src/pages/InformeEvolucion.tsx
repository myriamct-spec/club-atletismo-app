import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAtleta } from "../lib/atletas";
import { listResultadosPorAtleta, type ResultadoConCompeticion } from "../lib/resultados";
import { listPruebasFisicasPorAtleta } from "../lib/pruebasFisicas";
import { listComentariosPorAtleta, type ComentarioConEntrenador } from "../lib/comentarios";
import { calcularCategoria, temporadaActual } from "../lib/categorias";
import { Sparkline } from "../components/Sparkline";
import type { Atleta, PruebaFisica, TipoPruebaFisica } from "../types/database";

const ETIQUETAS_TIPO_PRUEBA: Record<TipoPruebaFisica, string> = {
  fuerza: "Fuerza",
  velocidad: "Velocidad",
  resistencia: "Resistencia",
  flexibilidad: "Flexibilidad",
  otra: "Otra",
};

function rangoTemporadaPorDefecto() {
  const anio = temporadaActual();
  return { inicio: `${anio}-01-01`, fin: `${anio}-12-31` };
}

export default function InformeEvolucion() {
  const { id } = useParams();
  const [atleta, setAtleta] = useState<Atleta | null>(null);
  const [resultados, setResultados] = useState<ResultadoConCompeticion[]>([]);
  const [pruebas, setPruebas] = useState<PruebaFisica[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioConEntrenador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defecto = rangoTemporadaPorDefecto();
  const [fechaInicio, setFechaInicio] = useState(defecto.inicio);
  const [fechaFin, setFechaFin] = useState(defecto.fin);

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    Promise.all([getAtleta(id), listResultadosPorAtleta(id), listPruebasFisicasPorAtleta(id), listComentariosPorAtleta(id)])
      .then(([a, r, p, c]) => {
        setAtleta(a);
        setResultados(r);
        setPruebas(p);
        setComentarios(c);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el informe."))
      .finally(() => setCargando(false));
  }, [id]);

  const resultadosEnRango = useMemo(
    () =>
      resultados
        .filter((r) => r.competicion.fecha >= fechaInicio && r.competicion.fecha <= fechaFin)
        .sort((a, b) => a.competicion.fecha.localeCompare(b.competicion.fecha)),
    [resultados, fechaInicio, fechaFin],
  );

  const pruebasEnRango = useMemo(
    () =>
      pruebas
        .filter((p) => p.fecha >= fechaInicio && p.fecha <= fechaFin)
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [pruebas, fechaInicio, fechaFin],
  );

  const comentariosEnRango = useMemo(
    () =>
      comentarios
        .filter((c) => c.fecha >= fechaInicio && c.fecha <= fechaFin)
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [comentarios, fechaInicio, fechaFin],
  );

  const resultadosPorDisciplina = useMemo(() => {
    const grupos = new Map<string, ResultadoConCompeticion[]>();
    for (const r of resultadosEnRango) {
      const clave = r.disciplina.nombre;
      grupos.set(clave, [...(grupos.get(clave) ?? []), r]);
    }
    return [...grupos.entries()];
  }, [resultadosEnRango]);

  const pruebasPorTipo = useMemo(() => {
    const grupos = new Map<TipoPruebaFisica, PruebaFisica[]>();
    for (const p of pruebasEnRango) {
      grupos.set(p.tipo, [...(grupos.get(p.tipo) ?? []), p]);
    }
    return [...grupos.entries()];
  }, [pruebasEnRango]);

  if (cargando) return <p className="text-sm text-navy-800/60">Cargando…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!atleta) return <p className="text-sm text-navy-800/60">No se encontró el atleta.</p>;

  const numCompeticiones = new Set(resultadosEnRango.map((r) => r.competicion.id)).size;
  const numMarcasPersonales = resultadosEnRango.filter((r) => r.es_marca_personal).length;

  return (
    <div className="max-w-3xl">
      <Link to={`/atletas/${atleta.id}`} className="text-sm text-navy-800/60 hover:text-navy-900">
        ← Volver a la ficha
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Informe de evolución</p>
          <h1 className="mt-1 font-display text-3xl tracking-wide text-navy-900">
            {atleta.nombre} {atleta.apellidos}
          </h1>
          <p className="mt-1 text-sm text-navy-800/70">{calcularCategoria(atleta.fecha_nacimiento)}</p>
        </div>

        <div className="flex items-end gap-2">
          <label className="block text-xs">
            <span className="font-medium text-navy-800">Desde</span>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="input mt-1" />
          </label>
          <label className="block text-xs">
            <span className="font-medium text-navy-800">Hasta</span>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="input mt-1" />
          </label>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metrica etiqueta="Competiciones" valor={numCompeticiones} />
        <Metrica etiqueta="Marcas personales" valor={numMarcasPersonales} />
        <Metrica etiqueta="Pruebas físicas" valor={pruebasEnRango.length} />
        <Metrica etiqueta="Comentarios" valor={comentariosEnRango.length} />
      </div>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Resultados de competición</h2>
        {resultadosPorDisciplina.length === 0 ? (
          <p className="mt-3 text-sm text-navy-800/60">Sin resultados en este rango de fechas.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {resultadosPorDisciplina.map(([disciplina, filas]) => (
              <div key={disciplina} className="rounded-2xl border border-navy-900/10 bg-white p-5">
                <p className="text-sm font-semibold text-navy-900">{disciplina}</p>
                <table className="mt-2 w-full text-sm">
                  <tbody>
                    {filas.map((r) => (
                      <tr key={r.id} className="border-t border-navy-900/5 first:border-0">
                        <td className="py-1.5 text-navy-800/60">{new Date(r.competicion.fecha).toLocaleDateString("es-ES")}</td>
                        <td className="py-1.5 text-navy-800/70">{r.competicion.nombre}</td>
                        <td className="py-1.5 text-right font-semibold text-navy-900">
                          {r.marca}
                          {r.es_marca_personal && (
                            <span className="ml-2 rounded-full bg-gold-300/40 px-2 py-0.5 text-xs font-medium text-navy-900">PB</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Pruebas físicas</h2>
        {pruebasPorTipo.length === 0 ? (
          <p className="mt-3 text-sm text-navy-800/60">Sin pruebas físicas en este rango de fechas.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {pruebasPorTipo.map(([tipo, filas]) => {
              const unidadComun = filas[0].unidad;
              const mismaUnidad = filas.every((f) => f.unidad === unidadComun);
              return (
                <div key={tipo} className="rounded-2xl border border-navy-900/10 bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-navy-900">{ETIQUETAS_TIPO_PRUEBA[tipo]}</p>
                    {mismaUnidad && filas.length >= 2 && (
                      <div className="text-navy-800">
                        <Sparkline valores={filas.map((f) => f.valor)} />
                      </div>
                    )}
                  </div>
                  <table className="mt-2 w-full text-sm">
                    <tbody>
                      {filas.map((p) => (
                        <tr key={p.id} className="border-t border-navy-900/5 first:border-0">
                          <td className="py-1.5 text-navy-800/60">{new Date(p.fecha).toLocaleDateString("es-ES")}</td>
                          <td className="py-1.5 text-navy-800/70">{p.protocolo ?? "—"}</td>
                          <td className="py-1.5 text-right font-semibold text-navy-900">
                            {p.valor} {p.unidad}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Comentarios del entrenador</h2>
        {comentariosEnRango.length === 0 ? (
          <p className="mt-3 text-sm text-navy-800/60">Sin comentarios en este rango de fechas.</p>
        ) : (
          <div className="mt-3 rounded-2xl border border-navy-900/10 bg-white p-5">
            <ul className="space-y-3">
              {comentariosEnRango.map((c) => (
                <li key={c.id} className="border-t border-navy-900/5 pt-3 first:border-0 first:pt-0">
                  <p className="text-xs text-navy-800/60">
                    {new Date(c.fecha).toLocaleDateString("es-ES")} · {c.entrenador.nombre}
                    {c.categoria && ` · ${c.categoria}`}
                  </p>
                  <p className="mt-1 text-sm text-navy-900">{c.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-navy-900/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">{etiqueta}</p>
      <p className="mt-1 font-display text-2xl text-navy-900">{valor}</p>
    </div>
  );
}
