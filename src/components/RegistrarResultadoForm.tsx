import { useEffect, useState, type FormEvent } from "react";
import { createResultado } from "../lib/resultados";
import { listCompeticiones } from "../lib/competiciones";
import { mensajeError } from "../lib/errors";
import type { Competicion, Disciplina, Intento, Parcial, RitmoKm, TipoResultado, ValidezResultado } from "../types/database";

const ETIQUETAS_VALIDEZ: Record<ValidezResultado, string> = {
  valido: "Válido",
  nulo: "Nulo",
  no_presentado: "No presentado",
};

function unidadCorta(unidad: Disciplina["unidad_medida"]): string {
  switch (unidad) {
    case "tiempo":
      return "seg.";
    case "distancia":
      return "m";
    case "altura":
      return "m";
    case "puntos":
      return "pts";
  }
}

export function RegistrarResultadoForm({
  atletaId,
  disciplinas,
  onGuardado,
}: {
  atletaId: string;
  disciplinas: Disciplina[];
  onGuardado: () => void;
}) {
  const [disciplinaId, setDisciplinaId] = useState(disciplinas[0]?.id ?? "");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState<TipoResultado>("competicion");
  const [resultado, setResultado] = useState("");
  const [validez, setValidez] = useState<ValidezResultado>("valido");
  const [competiciones, setCompeticiones] = useState<Competicion[]>([]);
  const [competicionId, setCompeticionId] = useState("");

  useEffect(() => {
    listCompeticiones()
      .then(setCompeticiones)
      .catch(() => setCompeticiones([]));
  }, []);

  const [ampliado, setAmpliado] = useState(false);
  const [intentos, setIntentos] = useState<Intento[]>([]);
  const [parciales, setParciales] = useState<Parcial[]>([]);
  const [ritmoPorKm, setRitmoPorKm] = useState<Array<{ km: string; min: string; seg: string; fc: string }>>([]);
  const [condiciones, setCondiciones] = useState("");
  const [percepcionEsfuerzo, setPercepcionEsfuerzo] = useState(5);
  const [nota, setNota] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disciplina = disciplinas.find((d) => d.id === disciplinaId);
  const familia = disciplina?.familia ?? "otra";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const ritmoLimpio: RitmoKm[] = ritmoPorKm
        .filter((r) => r.km !== "" && (r.min !== "" || r.seg !== ""))
        .map((r) => ({
          km: Number(r.km),
          ritmo_seg: Number(r.min || 0) * 60 + Number(r.seg || 0),
          fc: r.fc ? Number(r.fc) : null,
        }));

      await createResultado({
        atleta_id: atletaId,
        disciplina_id: disciplinaId,
        competicion_id: tipo === "competicion" && competicionId ? competicionId : null,
        marca: resultado,
        puesto: null,
        viento: null,
        es_marca_personal: false,
        observaciones: null,
        fecha,
        tipo,
        validez,
        condiciones: condiciones.trim() || null,
        intentos: familia === "saltos" || familia === "lanzamientos" ? (intentos.length ? intentos : null) : null,
        parciales: familia === "sprint" ? (parciales.length ? parciales : null) : null,
        ritmo_por_km: familia === "fondo" ? (ritmoLimpio.length ? ritmoLimpio : null) : null,
        percepcion_esfuerzo: percepcionEsfuerzo,
        nota: nota.trim() || null,
      });

      onGuardado();
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar el resultado."));
    } finally {
      setGuardando(false);
    }
  }

  function addIntento() {
    setIntentos((v) => [...v, { numero: v.length + 1, valor: 0, validez: "valido" }]);
  }
  function updateIntento(i: number, patch: Partial<Intento>) {
    setIntentos((v) => v.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function removeIntento(i: number) {
    setIntentos((v) => v.filter((_, idx) => idx !== i).map((it, idx) => ({ ...it, numero: idx + 1 })));
  }

  function addParcial() {
    setParciales((v) => [...v, { distancia: 0, tiempo: 0 }]);
  }
  function updateParcial(i: number, patch: Partial<Parcial>) {
    setParciales((v) => v.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function removeParcial(i: number) {
    setParciales((v) => v.filter((_, idx) => idx !== i));
  }

  function addRitmo() {
    setRitmoPorKm((v) => [...v, { km: String(v.length + 1), min: "", seg: "", fc: "" }]);
  }
  function updateRitmo(i: number, patch: Partial<{ km: string; min: string; seg: string; fc: string }>) {
    setRitmoPorKm((v) => v.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeRitmo(i: number) {
    setRitmoPorKm((v) => v.filter((_, idx) => idx !== i));
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-navy-900/10 bg-white p-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="block text-sm">
          <span className="font-medium text-navy-800">Prueba *</span>
          <select required value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)} className="input mt-1">
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy-800">Fecha *</span>
          <input required type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input mt-1" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy-800">Tipo *</span>
          <select
            required
            value={tipo}
            onChange={(e) => {
              const nuevoTipo = e.target.value as TipoResultado;
              setTipo(nuevoTipo);
              if (nuevoTipo === "test_control") setCompeticionId("");
            }}
            className="input mt-1"
          >
            <option value="competicion">Competición</option>
            <option value="test_control">Test de control</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy-800">Validez *</span>
          <select required value={validez} onChange={(e) => setValidez(e.target.value as ValidezResultado)} className="input mt-1">
            {Object.entries(ETIQUETAS_VALIDEZ).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {tipo === "competicion" && competiciones.length > 0 && (
        <label className="block text-sm">
          <span className="font-medium text-navy-800">Competición</span>
          <select
            value={competicionId}
            onChange={(e) => {
              const nuevaCompeticionId = e.target.value;
              setCompeticionId(nuevaCompeticionId);
              const competicion = competiciones.find((c) => c.id === nuevaCompeticionId);
              if (competicion) setFecha(competicion.fecha);
            }}
            className="input mt-1 max-w-sm"
          >
            <option value="">Sin vincular</option>
            {competiciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} · {new Date(c.fecha).toLocaleDateString("es-ES")}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-sm">
        <span className="font-medium text-navy-800">
          Resultado * {disciplina && <span className="text-navy-800/50">({unidadCorta(disciplina.unidad_medida)})</span>}
        </span>
        <input
          required
          value={resultado}
          onChange={(e) => setResultado(e.target.value)}
          placeholder="p. ej. 11.84"
          className="input mt-1 max-w-xs"
        />
      </label>

      <button
        type="button"
        onClick={() => setAmpliado((v) => !v)}
        className="text-xs font-semibold text-navy-900 underline"
      >
        {ampliado ? "Ocultar registro ampliado" : "Registro ampliado (opcional)"}
      </button>

      {ampliado && (
        <div className="space-y-4 rounded-xl bg-ground p-4">
          {(familia === "saltos" || familia === "lanzamientos") && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Intentos</p>
              <div className="mt-2 space-y-2">
                {intentos.map((it, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-xs text-navy-800/60">#{it.numero}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={it.valor}
                      onChange={(e) => updateIntento(i, { valor: Number(e.target.value) })}
                      className="input"
                      placeholder="Valor"
                    />
                    <select
                      value={it.validez}
                      onChange={(e) => updateIntento(i, { validez: e.target.value as ValidezResultado })}
                      className="input"
                    >
                      {Object.entries(ETIQUETAS_VALIDEZ).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeIntento(i)} className="text-xs text-red-600 hover:underline">
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addIntento} className="mt-2 text-xs font-semibold text-navy-900 underline">
                + Añadir intento
              </button>
            </div>
          )}

          {familia === "sprint" && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Parciales</p>
              <div className="mt-2 space-y-2">
                {parciales.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="number"
                      step="1"
                      value={p.distancia}
                      onChange={(e) => updateParcial(i, { distancia: Number(e.target.value) })}
                      className="input"
                      placeholder="Distancia (m)"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={p.tiempo}
                      onChange={(e) => updateParcial(i, { tiempo: Number(e.target.value) })}
                      className="input"
                      placeholder="Tiempo (seg.)"
                    />
                    <button type="button" onClick={() => removeParcial(i)} className="text-xs text-red-600 hover:underline">
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addParcial} className="mt-2 text-xs font-semibold text-navy-900 underline">
                + Añadir parcial
              </button>
            </div>
          )}

          {familia === "fondo" && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Ritmo / FC por km</p>
              <div className="mt-2 space-y-2">
                {ritmoPorKm.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="number"
                      step="1"
                      value={r.km}
                      onChange={(e) => updateRitmo(i, { km: e.target.value })}
                      className="input w-16"
                      placeholder="Km"
                    />
                    <input
                      type="number"
                      value={r.min}
                      onChange={(e) => updateRitmo(i, { min: e.target.value })}
                      className="input w-16"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      value={r.seg}
                      onChange={(e) => updateRitmo(i, { seg: e.target.value })}
                      className="input w-16"
                      placeholder="Seg"
                    />
                    <input
                      type="number"
                      value={r.fc}
                      onChange={(e) => updateRitmo(i, { fc: e.target.value })}
                      className="input w-24"
                      placeholder="FC (ppm)"
                    />
                    <button type="button" onClick={() => removeRitmo(i)} className="text-xs text-red-600 hover:underline">
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addRitmo} className="mt-2 text-xs font-semibold text-navy-900 underline">
                + Añadir km
              </button>
            </div>
          )}

          <label className="block text-sm">
            <span className="font-medium text-navy-800">Condiciones</span>
            <input
              value={condiciones}
              onChange={(e) => setCondiciones(e.target.value)}
              placeholder="Viento, pista, clima…"
              className="input mt-1"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-navy-800">Percepción de esfuerzo ({percepcionEsfuerzo}/10)</span>
            <input
              type="range"
              min={1}
              max={10}
              value={percepcionEsfuerzo}
              onChange={(e) => setPercepcionEsfuerzo(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-navy-800">Nota</span>
            <textarea rows={2} value={nota} onChange={(e) => setNota(e.target.value)} className="input mt-1" />
          </label>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={guardando || !disciplinaId}
        className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar resultado"}
      </button>
    </form>
  );
}
