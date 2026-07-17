import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { getCompeticion } from "../lib/competiciones";
import { createResultado, listResultadosPorCompeticion, deleteResultado, type ResultadoConAtleta } from "../lib/resultados";
import { listAtletas } from "../lib/atletas";
import { listDisciplinas } from "../lib/disciplinas";
import type { Atleta, Competicion, Disciplina } from "../types/database";

const ETIQUETAS_TIPO: Record<string, string> = {
  pista_aire_libre: "Pista al aire libre",
  pista_cubierta: "Pista cubierta",
  campo_a_traves: "Campo a través",
  ruta: "Ruta",
};

export default function CompeticionDetalle() {
  const { id } = useParams();
  const [competicion, setCompeticion] = useState<Competicion | null>(null);
  const [resultados, setResultados] = useState<ResultadoConAtleta[]>([]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function cargar() {
    if (!id) return;
    setCargando(true);
    try {
      const [comp, res, ats, discs] = await Promise.all([
        getCompeticion(id),
        listResultadosPorCompeticion(id),
        listAtletas(),
        listDisciplinas(),
      ]);
      setCompeticion(comp);
      setResultados(res);
      setAtletas(ats);
      setDisciplinas(discs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la competición.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleEliminar(resultadoId: string) {
    await deleteResultado(resultadoId);
    cargar();
  }

  if (cargando) return <p className="text-sm text-navy-800/60">Cargando…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!competicion) return <p className="text-sm text-navy-800/60">No se encontró la competición.</p>;

  return (
    <div className="max-w-3xl">
      <Link to="/competiciones" className="text-sm text-navy-800/60 hover:text-navy-900">
        ← Volver a competiciones
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{competicion.nombre}</h1>
          <p className="mt-1 text-sm text-navy-800/70">
            {new Date(competicion.fecha).toLocaleDateString("es-ES")}
            {competicion.lugar && <> · {competicion.lugar}</>} · {ETIQUETAS_TIPO[competicion.tipo]} · Temporada{" "}
            {competicion.temporada}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/competiciones/${competicion.id}/importar-resultados`}
            className="rounded-lg border border-navy-900/20 px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-white"
          >
            Importar Excel
          </Link>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800"
          >
            {mostrarForm ? "Cancelar" : "Añadir resultado"}
          </button>
        </div>
      </div>

      {mostrarForm && (
        <FormularioResultado
          competicionId={competicion.id}
          atletas={atletas}
          disciplinas={disciplinas}
          onGuardado={() => {
            setMostrarForm(false);
            cargar();
          }}
        />
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-navy-900/10 bg-white">
        {resultados.length === 0 ? (
          <p className="p-6 text-sm text-navy-800/60">Todavía no hay resultados registrados en esta competición.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-navy-900/10 text-left text-xs uppercase tracking-wide text-navy-800/60">
              <tr>
                <th className="px-4 py-3">Atleta</th>
                <th className="px-4 py-3">Disciplina</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3">Puesto</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr key={r.id} className="border-b border-navy-900/5 last:border-0">
                  <td className="px-4 py-3 text-navy-900">
                    {r.atleta.nombre} {r.atleta.apellidos}
                  </td>
                  <td className="px-4 py-3 text-navy-800/70">{r.disciplina.nombre}</td>
                  <td className="px-4 py-3 text-navy-800/70">
                    {r.marca}
                    {r.es_marca_personal && (
                      <span className="ml-2 rounded-full bg-gold-300/40 px-2 py-0.5 text-xs font-medium text-navy-900">
                        PB
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy-800/70">{r.puesto ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEliminar(r.id)} className="text-xs font-medium text-red-600 hover:underline">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FormularioResultado({
  competicionId,
  atletas,
  disciplinas,
  onGuardado,
}: {
  competicionId: string;
  atletas: Atleta[];
  disciplinas: Disciplina[];
  onGuardado: () => void;
}) {
  const [atletaId, setAtletaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [marca, setMarca] = useState("");
  const [puesto, setPuesto] = useState("");
  const [viento, setViento] = useState("");
  const [esMarcaPersonal, setEsMarcaPersonal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await createResultado({
        atleta_id: atletaId,
        competicion_id: competicionId,
        disciplina_id: disciplinaId,
        marca,
        puesto: puesto ? Number(puesto) : null,
        viento: viento ? Number(viento) : null,
        es_marca_personal: esMarcaPersonal,
        observaciones: null,
      });
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el resultado.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-navy-900/10 bg-white p-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="font-medium text-navy-800">Atleta *</span>
          <select required value={atletaId} onChange={(e) => setAtletaId(e.target.value)} className="input mt-1">
            <option value="">Seleccionar…</option>
            {atletas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.apellidos}, {a.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy-800">Disciplina *</span>
          <select required value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)} className="input mt-1">
            <option value="">Seleccionar…</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="block text-sm">
          <span className="font-medium text-navy-800">Marca *</span>
          <input
            required
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="p. ej. 11.84 o 5.63m"
            className="input mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy-800">Puesto</span>
          <input type="number" min="1" value={puesto} onChange={(e) => setPuesto(e.target.value)} className="input mt-1" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy-800">Viento (m/s)</span>
          <input value={viento} onChange={(e) => setViento(e.target.value)} className="input mt-1" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-navy-800">
        <input
          type="checkbox"
          checked={esMarcaPersonal}
          onChange={(e) => setEsMarcaPersonal(e.target.checked)}
          className="rounded border-navy-900/30"
        />
        Marca personal
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar resultado"}
      </button>
    </form>
  );
}
