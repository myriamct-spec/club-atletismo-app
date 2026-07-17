import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import {
  createPruebaFisica,
  deletePruebaFisica,
  listPruebasFisicasPorAtleta,
} from "../lib/pruebasFisicas";
import type { PruebaFisica, TipoPruebaFisica } from "../types/database";

const ETIQUETAS_TIPO: Record<TipoPruebaFisica, string> = {
  fuerza: "Fuerza",
  velocidad: "Velocidad",
  resistencia: "Resistencia",
  flexibilidad: "Flexibilidad",
  otra: "Otra",
};

export function PruebasFisicasSeccion({ atletaId }: { atletaId: string }) {
  const { usuario } = useAuth();
  const [pruebas, setPruebas] = useState<PruebaFisica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function cargar() {
    setCargando(true);
    setPruebas(await listPruebasFisicasPorAtleta(atletaId));
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atletaId]);

  async function handleEliminar(id: string) {
    await deletePruebaFisica(id);
    cargar();
  }

  return (
    <div className="rounded-2xl border border-navy-900/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Pruebas físicas</p>
        <button onClick={() => setMostrarForm((v) => !v)} className="text-xs font-semibold text-navy-800 hover:underline">
          {mostrarForm ? "Cancelar" : "+ Añadir"}
        </button>
      </div>

      {mostrarForm && usuario && (
        <FormularioPrueba
          atletaId={atletaId}
          entrenadorId={usuario.id}
          onGuardado={() => {
            setMostrarForm(false);
            cargar();
          }}
        />
      )}

      {cargando ? (
        <p className="mt-2 text-sm text-navy-800/60">Cargando…</p>
      ) : pruebas.length === 0 ? (
        <p className="mt-2 text-sm text-navy-800/60">Sin pruebas físicas registradas.</p>
      ) : (
        <ul className="mt-3 divide-y divide-navy-900/5">
          {pruebas.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className="font-medium text-navy-900">{ETIQUETAS_TIPO[p.tipo]}</span>
                {p.protocolo && <span className="text-navy-800/60"> · {p.protocolo}</span>}
              </div>
              <div className="flex items-center gap-3 text-navy-800/70">
                {new Date(p.fecha).toLocaleDateString("es-ES")}
                <span className="font-semibold text-navy-900">
                  {p.valor} {p.unidad}
                </span>
                <button onClick={() => handleEliminar(p.id)} className="text-xs font-medium text-red-600 hover:underline">
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormularioPrueba({
  atletaId,
  entrenadorId,
  onGuardado,
}: {
  atletaId: string;
  entrenadorId: string;
  onGuardado: () => void;
}) {
  const [tipo, setTipo] = useState<TipoPruebaFisica>("velocidad");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [valor, setValor] = useState("");
  const [unidad, setUnidad] = useState("");
  const [protocolo, setProtocolo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await createPruebaFisica({
        atleta_id: atletaId,
        entrenador_id: entrenadorId,
        tipo,
        fecha,
        valor: Number(valor),
        unidad,
        protocolo: protocolo.trim() || null,
      });
      setValor("");
      setProtocolo("");
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la prueba.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-xl bg-ground p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs">
          <span className="font-medium text-navy-800">Tipo</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoPruebaFisica)} className="input mt-1">
            {Object.entries(ETIQUETAS_TIPO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="font-medium text-navy-800">Fecha</span>
          <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className="input mt-1" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs">
          <span className="font-medium text-navy-800">Valor *</span>
          <input
            type="number"
            step="any"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="input mt-1"
          />
        </label>
        <label className="block text-xs">
          <span className="font-medium text-navy-800">Unidad *</span>
          <input
            required
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            placeholder="kg, s, cm…"
            className="input mt-1"
          />
        </label>
      </div>
      <label className="block text-xs">
        <span className="font-medium text-navy-800">Protocolo</span>
        <input
          value={protocolo}
          onChange={(e) => setProtocolo(e.target.value)}
          placeholder="p. ej. Salto vertical CMJ"
          className="input mt-1"
        />
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
