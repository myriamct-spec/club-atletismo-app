import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { createComentario, deleteComentario, listComentariosPorAtleta, type ComentarioConEntrenador } from "../lib/comentarios";

const CATEGORIAS = ["Técnico", "Actitudinal", "Médico", "Otro"];

export function ComentariosSeccion({ atletaId }: { atletaId: string }) {
  const { usuario } = useAuth();
  const [comentarios, setComentarios] = useState<ComentarioConEntrenador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function cargar() {
    setCargando(true);
    setComentarios(await listComentariosPorAtleta(atletaId));
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atletaId]);

  async function handleEliminar(id: string) {
    await deleteComentario(id);
    cargar();
  }

  return (
    <div className="rounded-2xl border border-navy-900/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Comentarios del entrenador</p>
        <button onClick={() => setMostrarForm((v) => !v)} className="text-xs font-semibold text-navy-800 hover:underline">
          {mostrarForm ? "Cancelar" : "+ Añadir"}
        </button>
      </div>

      {mostrarForm && usuario && (
        <FormularioComentario
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
      ) : comentarios.length === 0 ? (
        <p className="mt-2 text-sm text-navy-800/60">Sin comentarios registrados.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {comentarios.map((c) => (
            <li key={c.id} className="border-t border-navy-900/5 pt-3 first:border-0 first:pt-0">
              <div className="flex items-center justify-between text-xs text-navy-800/60">
                <span>
                  {new Date(c.fecha).toLocaleDateString("es-ES")} · {c.entrenador.nombre}
                  {c.categoria && ` · ${c.categoria}`}
                </span>
                <button onClick={() => handleEliminar(c.id)} className="font-medium text-red-600 hover:underline">
                  Eliminar
                </button>
              </div>
              <p className="mt-1 text-sm text-navy-900">{c.texto}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormularioComentario({
  atletaId,
  entrenadorId,
  onGuardado,
}: {
  atletaId: string;
  entrenadorId: string;
  onGuardado: () => void;
}) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria] = useState("");
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await createComentario({
        atleta_id: atletaId,
        entrenador_id: entrenadorId,
        fecha,
        texto,
        categoria: categoria || null,
      });
      setTexto("");
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el comentario.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-xl bg-ground p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs">
          <span className="font-medium text-navy-800">Fecha</span>
          <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className="input mt-1" />
        </label>
        <label className="block text-xs">
          <span className="font-medium text-navy-800">Categoría</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input mt-1">
            <option value="">Sin categoría</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-xs">
        <span className="font-medium text-navy-800">Comentario *</span>
        <textarea required rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} className="input mt-1" />
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
