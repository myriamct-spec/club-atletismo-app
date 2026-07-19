import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAtleta } from "../lib/atletas";
import { listResultadosPorAtleta, type ResultadoConCompeticion } from "../lib/resultados";
import { listPruebasFisicasPorAtleta } from "../lib/pruebasFisicas";
import { listComentariosPorAtleta, type ComentarioConEntrenador } from "../lib/comentarios";
import { listDisciplinas } from "../lib/disciplinas";
import { listAsistenciasPorAtleta, marcarAsistencia } from "../lib/asistencias";
import { calcularCategoria, temporadaActual } from "../lib/categorias";
import {
  calcularVariacion,
  derivaRitmoFc,
  familiaAPruebaFisica,
  fcMedia,
  formatoRitmo,
  marcaANumero,
  mejorMarca,
  menorEsMejor,
  periodoAnterior,
  resumenIntentos,
  ritmoMedio,
  velocidadMaximaEstimada,
  type Variacion,
} from "../lib/informe";
import { GraficaFisicoVsMarca, GraficaIntentos, GraficaProgresion, GraficaRitmoFc } from "../components/informe/Graficas";
import { RegistrarResultadoForm } from "../components/RegistrarResultadoForm";
import type { Asistencia, Atleta, Disciplina, FamiliaPrueba, PruebaFisica, TipoPruebaFisica } from "../types/database";
import { mensajeError } from "../lib/errors";

const ETIQUETAS_TIPO_PRUEBA: Record<TipoPruebaFisica, string> = {
  fuerza: "Fuerza",
  velocidad: "Velocidad",
  resistencia: "Resistencia",
  flexibilidad: "Flexibilidad",
  otra: "Otra",
};

const ETIQUETAS_FAMILIA: Record<FamiliaPrueba, string> = {
  sprint: "Sprint",
  fondo: "Fondo",
  saltos: "Saltos",
  lanzamientos: "Lanzamientos",
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
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [disciplinaId, setDisciplinaId] = useState<string>("");

  const defecto = rangoTemporadaPorDefecto();
  const [fechaInicio, setFechaInicio] = useState(defecto.inicio);
  const [fechaFin, setFechaFin] = useState(defecto.fin);

  async function cargar() {
    if (!id) return;
    setCargando(true);
    try {
      const [a, r, p, c, d, asis] = await Promise.all([
        getAtleta(id),
        listResultadosPorAtleta(id),
        listPruebasFisicasPorAtleta(id),
        listComentariosPorAtleta(id),
        listDisciplinas(),
        listAsistenciasPorAtleta(id),
      ]);
      setAtleta(a);
      setResultados(r);
      setPruebas(p);
      setComentarios(c);
      setDisciplinas(d);
      setAsistencias(asis);
    } catch (err) {
      setError(mensajeError(err, "No se pudo cargar el informe."));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const disciplinasConResultados = useMemo(() => {
    const vistas = new Map<string, Disciplina>();
    for (const r of resultados) vistas.set(r.disciplina_id, r.disciplina);
    return [...vistas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [resultados]);

  useEffect(() => {
    if (disciplinaId || disciplinasConResultados.length === 0) return;
    const masReciente = [...resultados].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    setDisciplinaId(masReciente?.disciplina_id ?? disciplinasConResultados[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disciplinasConResultados]);

  const anterior = useMemo(() => periodoAnterior(fechaInicio, fechaFin), [fechaInicio, fechaFin]);

  const resultadosDisciplina = useMemo(
    () => resultados.filter((r) => r.disciplina_id === disciplinaId).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [resultados, disciplinaId],
  );
  const resultadosEnRango = useMemo(
    () => resultadosDisciplina.filter((r) => r.fecha >= fechaInicio && r.fecha <= fechaFin),
    [resultadosDisciplina, fechaInicio, fechaFin],
  );
  const resultadosPeriodoAnterior = useMemo(
    () => resultadosDisciplina.filter((r) => r.fecha >= anterior.inicio && r.fecha <= anterior.fin),
    [resultadosDisciplina, anterior],
  );

  const comentariosEnRango = useMemo(
    () => comentarios.filter((c) => c.fecha >= fechaInicio && c.fecha <= fechaFin).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [comentarios, fechaInicio, fechaFin],
  );
  const notasResultadosEnRango = useMemo(
    () =>
      resultados
        .filter((r) => r.nota && r.fecha >= fechaInicio && r.fecha <= fechaFin)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [resultados, fechaInicio, fechaFin],
  );

  const asistenciasEnRango = useMemo(
    () => asistencias.filter((a) => a.fecha >= fechaInicio && a.fecha <= fechaFin),
    [asistencias, fechaInicio, fechaFin],
  );
  const porcentajeAsistencia =
    asistenciasEnRango.length === 0 ? null : (asistenciasEnRango.filter((a) => a.presente).length / asistenciasEnRango.length) * 100;

  if (cargando) return <p className="text-sm text-navy-800/60">Cargando…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!atleta) return <p className="text-sm text-navy-800/60">No se encontró el atleta.</p>;

  const disciplina = disciplinasConResultados.find((d) => d.id === disciplinaId) ?? disciplinas.find((d) => d.id === disciplinaId);
  const familia = disciplina?.familia ?? "otra";
  const invertirEje = menorEsMejor(familia);

  const mejorPeriodo = mejorMarca(resultadosEnRango, familia);
  const mejorAnterior = mejorMarca(resultadosPeriodoAnterior, familia);
  const variacionMarca = calcularVariacion(mejorPeriodo, mejorAnterior, invertirEje);

  const marcaPersonal = mejorMarca(resultadosDisciplina, familia);
  const resultadoMarcaPersonal = resultadosDisciplina.find((r) => marcaANumero(r.marca) === marcaPersonal);

  const ultimoResultado = [...resultadosEnRango].reverse()[0] ?? null;

  const tipoFisicoRelevante = familiaAPruebaFisica(familia);
  const pruebasRelevantes = pruebas.filter((p) => p.tipo === tipoFisicoRelevante);
  const pruebasEnRango = pruebasRelevantes.filter((p) => p.fecha >= fechaInicio && p.fecha <= fechaFin).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const pruebasPeriodoAnterior = pruebasRelevantes.filter((p) => p.fecha >= anterior.inicio && p.fecha <= anterior.fin);
  const valorFisicoActual = pruebasEnRango[pruebasEnRango.length - 1]?.valor ?? null;
  const valorFisicoAnterior = [...pruebasPeriodoAnterior].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-1)[0]?.valor ?? null;
  const variacionFisico = calcularVariacion(valorFisicoActual, valorFisicoAnterior, false);

  const datosProgresion = resultadosEnRango.map((r) => ({
    fecha: r.fecha,
    valor: marcaANumero(r.marca),
    tipo: r.tipo,
    condiciones: r.condiciones,
    validez: r.validez,
  }));

  const fechasFisicoVsMarca = [...new Set([...resultadosEnRango.map((r) => r.fecha), ...pruebasEnRango.map((p) => p.fecha)])].sort();
  const datosFisicoVsMarca = fechasFisicoVsMarca.map((fecha) => ({
    fecha,
    fisico: pruebasEnRango.find((p) => p.fecha === fecha)?.valor ?? null,
    marca: marcaANumero(resultadosEnRango.find((r) => r.fecha === fecha)?.marca ?? "") ?? null,
  }));

  const ultimoConIntentos = [...resultadosEnRango].reverse().find((r) => r.intentos && r.intentos.length > 0);
  const ultimoConParciales = [...resultadosEnRango].reverse().find((r) => r.parciales && r.parciales.length >= 2);
  const velocidadMaxima = ultimoConParciales ? velocidadMaximaEstimada(ultimoConParciales.parciales!) : null;
  const ultimoConRitmo = [...resultadosEnRango].reverse().find((r) => r.ritmo_por_km && r.ritmo_por_km.length > 0);
  const deriva = ultimoConRitmo ? derivaRitmoFc(ultimoConRitmo.ritmo_por_km!) : { driftRitmo: null, driftFc: null };

  async function handleMarcarAsistencia(presente: boolean) {
    if (!atleta) return;
    const hoy = new Date().toISOString().slice(0, 10);
    await marcarAsistencia(atleta.id, hoy, presente);
    cargar();
  }

  return (
    <div className="max-w-4xl">
      <Link to={`/atletas/${atleta.id}`} className="text-sm text-navy-800/60 hover:text-navy-900">
        ← Volver a la ficha
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {atleta.foto_url ? (
            <img src={atleta.foto_url} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 font-display text-lg text-gold-300">
              {atleta.nombre.charAt(0)}
              {atleta.apellidos.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Informe de evolución</p>
            <h1 className="font-display text-2xl tracking-wide text-navy-900 sm:text-3xl">
              {atleta.nombre} {atleta.apellidos}
            </h1>
            <p className="mt-1 text-sm text-navy-800/70">{calcularCategoria(atleta.fecha_nacimiento)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {disciplinasConResultados.length > 1 && (
            <label className="block text-xs">
              <span className="font-medium text-navy-800">Prueba</span>
              <select value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)} className="input mt-1">
                {disciplinasConResultados.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
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

      <div className="mt-4">
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800"
        >
          {mostrarForm ? "Cancelar" : "Registrar resultado"}
        </button>
      </div>

      {mostrarForm && (
        <RegistrarResultadoForm
          atletaId={atleta.id}
          disciplinas={disciplinas}
          onGuardado={() => {
            setMostrarForm(false);
            cargar();
          }}
        />
      )}

      {!disciplina ? (
        <p className="mt-8 text-sm text-navy-800/60">
          Todavía no hay resultados registrados para ninguna prueba. Usa "Registrar resultado" para empezar.
        </p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TarjetaKpi
              etiqueta={`Mejor marca (periodo) · ${ETIQUETAS_FAMILIA[familia]}`}
              valor={mejorPeriodo !== null ? String(mejorPeriodo) : "—"}
              variacion={variacionMarca}
              nota={ultimoResultado ? `Última: ${ultimoResultado.marca} · ${new Date(ultimoResultado.fecha).toLocaleDateString("es-ES")}` : undefined}
            />
            <TarjetaKpi
              etiqueta="Marca personal histórica"
              valor={marcaPersonal !== null ? String(marcaPersonal) : "—"}
              nota={resultadoMarcaPersonal ? new Date(resultadoMarcaPersonal.fecha).toLocaleDateString("es-ES") : undefined}
            />
            <TarjetaKpi
              etiqueta={`${ETIQUETAS_TIPO_PRUEBA[tipoFisicoRelevante]} (físico)`}
              valor={valorFisicoActual !== null ? `${valorFisicoActual} ${pruebasEnRango[pruebasEnRango.length - 1]?.unidad ?? ""}` : "—"}
              variacion={variacionFisico}
            />
            <div className="rounded-2xl border border-navy-900/10 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Asistencia (periodo)</p>
              <p className="mt-1 font-display text-2xl text-navy-900">
                {porcentajeAsistencia !== null ? `${Math.round(porcentajeAsistencia)}%` : "—"}
              </p>
              <div className="mt-2 flex gap-2 text-xs">
                <button onClick={() => handleMarcarAsistencia(true)} className="font-medium text-navy-900 hover:underline">
                  Presente hoy
                </button>
                <button onClick={() => handleMarcarAsistencia(false)} className="font-medium text-red-600 hover:underline">
                  Ausente hoy
                </button>
              </div>
            </div>
          </div>

          {familia === "sprint" && velocidadMaxima !== null && (
            <p className="mt-3 text-xs text-navy-800/60">
              Velocidad máxima estimada (últimos parciales registrados): <span className="font-semibold text-navy-900">{velocidadMaxima.toFixed(2)} m/s</span>
            </p>
          )}
          {familia === "fondo" && (deriva.driftRitmo !== null || deriva.driftFc !== null) && (
            <p className="mt-3 text-xs text-navy-800/60">
              Deriva último km vs. primero:{" "}
              {deriva.driftRitmo !== null && (
                <span className="font-semibold text-navy-900">
                  {deriva.driftRitmo > 0 ? "+" : ""}
                  {formatoRitmo(Math.abs(deriva.driftRitmo))} de ritmo
                </span>
              )}
              {deriva.driftFc !== null && <span className="font-semibold text-navy-900"> · {deriva.driftFc > 0 ? "+" : ""}{deriva.driftFc} ppm</span>}
            </p>
          )}

          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Progresión de marca · {disciplina.nombre}</h2>
            <div className="mt-3 rounded-2xl border border-navy-900/10 bg-white p-4">
              {datosProgresion.length === 0 ? (
                <p className="text-sm text-navy-800/60">Sin resultados en este rango de fechas.</p>
              ) : (
                <GraficaProgresion datos={datosProgresion} mejorMarca={marcaPersonal} invertirEje={invertirEje} />
              )}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">
              {ETIQUETAS_TIPO_PRUEBA[tipoFisicoRelevante]} vs. marca deportiva
            </h2>
            <div className="mt-3 rounded-2xl border border-navy-900/10 bg-white p-4">
              {datosFisicoVsMarca.length === 0 ? (
                <p className="text-sm text-navy-800/60">Sin datos suficientes en este rango de fechas.</p>
              ) : (
                <GraficaFisicoVsMarca
                  datos={datosFisicoVsMarca}
                  etiquetaFisico={ETIQUETAS_TIPO_PRUEBA[tipoFisicoRelevante]}
                  invertirEjeMarca={invertirEje}
                />
              )}
            </div>
          </section>

          {(familia === "saltos" || familia === "lanzamientos") && ultimoConIntentos?.intentos && (
            <section className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">
                Intentos · {new Date(ultimoConIntentos.fecha).toLocaleDateString("es-ES")}
              </h2>
              <div className="mt-3 rounded-2xl border border-navy-900/10 bg-white p-4">
                <GraficaIntentos intentos={ultimoConIntentos.intentos} />
                {(() => {
                  const resumen = resumenIntentos(ultimoConIntentos.intentos);
                  return (
                    <p className="mt-2 text-xs text-navy-800/60">
                      {resumen.validos}/{resumen.totales} intentos válidos
                      {resumen.consistencia !== null && <> · Consistencia: {resumen.consistencia.toFixed(2)}</>}
                    </p>
                  );
                })()}
              </div>
            </section>
          )}

          {familia === "fondo" && ultimoConRitmo?.ritmo_por_km && (
            <section className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">
                Ritmo / FC por km · {new Date(ultimoConRitmo.fecha).toLocaleDateString("es-ES")}
              </h2>
              <div className="mt-3 rounded-2xl border border-navy-900/10 bg-white p-4">
                <GraficaRitmoFc datos={ultimoConRitmo.ritmo_por_km} />
                <p className="mt-2 text-xs text-navy-800/60">
                  Ritmo medio: {formatoRitmo(ritmoMedio(ultimoConRitmo.ritmo_por_km) ?? 0)}
                  {fcMedia(ultimoConRitmo.ritmo_por_km) !== null && <> · FC media: {Math.round(fcMedia(ultimoConRitmo.ritmo_por_km)!)} ppm</>}
                </p>
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Historial de resultados · {disciplina.nombre}</h2>
            {resultadosEnRango.length === 0 ? (
              <p className="mt-3 text-sm text-navy-800/60">Sin resultados en este rango de fechas.</p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-2xl border border-navy-900/10 bg-white">
                <table className="w-full min-w-[480px] text-sm">
                  <tbody>
                    {[...resultadosEnRango].reverse().map((r) => (
                      <tr key={r.id} className="border-t border-navy-900/5 first:border-0">
                        <td className="px-4 py-2 text-navy-800/60">{new Date(r.fecha).toLocaleDateString("es-ES")}</td>
                        <td className="px-4 py-2 text-navy-800/70">{r.tipo === "competicion" ? r.competicion?.nombre ?? "Competición" : "Test de control"}</td>
                        <td className="px-4 py-2 text-right font-semibold text-navy-900">
                          {r.marca}
                          {r.validez !== "valido" && <span className="ml-2 text-xs font-medium text-red-600">{r.validez === "nulo" ? "Nulo" : "No presentado"}</span>}
                          {marcaANumero(r.marca) === marcaPersonal && (
                            <span className="ml-2 rounded-full bg-gold-300/40 px-2 py-0.5 text-xs font-medium text-navy-900">PB</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Pruebas físicas</h2>
        {pruebas.filter((p) => p.fecha >= fechaInicio && p.fecha <= fechaFin).length === 0 ? (
          <p className="mt-3 text-sm text-navy-800/60">Sin pruebas físicas en este rango de fechas.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {Object.entries(
              pruebas
                .filter((p) => p.fecha >= fechaInicio && p.fecha <= fechaFin)
                .reduce<Record<string, PruebaFisica[]>>((acc, p) => {
                  (acc[p.tipo] ??= []).push(p);
                  return acc;
                }, {}),
            ).map(([tipo, filas]) => (
              <div key={tipo} className="rounded-2xl border border-navy-900/10 bg-white p-5">
                <p className="text-sm font-semibold text-navy-900">{ETIQUETAS_TIPO_PRUEBA[tipo as TipoPruebaFisica]}</p>
                <table className="mt-2 w-full text-sm">
                  <tbody>
                    {filas
                      .sort((a, b) => a.fecha.localeCompare(b.fecha))
                      .map((p) => (
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
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Comentarios y notas</h2>
        {comentariosEnRango.length === 0 && notasResultadosEnRango.length === 0 ? (
          <p className="mt-3 text-sm text-navy-800/60">Sin comentarios ni notas en este rango de fechas.</p>
        ) : (
          <div className="mt-3 rounded-2xl border border-navy-900/10 bg-white p-5">
            <ul className="space-y-3">
              {[
                ...comentariosEnRango.map((c) => ({
                  fecha: c.fecha,
                  texto: c.texto,
                  origen: `${c.entrenador.nombre}${c.categoria ? ` · ${c.categoria}` : ""}`,
                })),
                ...notasResultadosEnRango.map((r) => ({
                  fecha: r.fecha,
                  texto: r.nota as string,
                  origen: `Nota sobre resultado de ${r.disciplina.nombre} (${r.marca})`,
                })),
              ]
                .sort((a, b) => b.fecha.localeCompare(a.fecha))
                .map((item, i) => (
                  <li key={i} className="border-t border-navy-900/5 pt-3 first:border-0 first:pt-0">
                    <p className="text-xs text-navy-800/60">
                      {new Date(item.fecha).toLocaleDateString("es-ES")} · {item.origen}
                    </p>
                    <p className="mt-1 text-sm text-navy-900">{item.texto}</p>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function TarjetaKpi({
  etiqueta,
  valor,
  variacion,
  nota,
}: {
  etiqueta: string;
  valor: string;
  variacion?: Variacion;
  nota?: string;
}) {
  const color = !variacion || variacion.mejora === null ? "text-navy-800/50" : variacion.mejora ? "text-emerald-600" : "text-red-600";
  const flecha = !variacion || variacion.mejora === null ? null : variacion.mejora ? "▲" : "▼";

  return (
    <div className="rounded-2xl border border-navy-900/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">{etiqueta}</p>
      <p className="mt-1 font-display text-2xl text-navy-900">{valor}</p>
      {variacion && variacion.delta !== null && (
        <p className={`mt-1 text-xs font-medium ${color}`}>
          {flecha} {variacion.delta > 0 ? "+" : ""}
          {variacion.delta.toFixed(2)}
          {variacion.porcentaje !== null && ` (${variacion.porcentaje > 0 ? "+" : ""}${variacion.porcentaje.toFixed(1)}%)`}
        </p>
      )}
      {nota && <p className="mt-1 text-xs text-navy-800/50">{nota}</p>}
    </div>
  );
}
