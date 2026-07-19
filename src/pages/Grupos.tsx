import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listGrupos, createGrupo } from "../lib/grupos";
import { CATEGORIAS_EDAD_ASIGNABLES } from "../lib/categorias";
import { mensajeError } from "../lib/errors";
import type { Grupo, TipoGrupo } from "../types/database";

export default function Grupos() {
  const { club } = useAuth();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    try {
      setGrupos(await listGrupos());
    } catch (err) {
      setError(mensajeError(err, "No se pudo cargar el listado."));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const gruposEdad = grupos.filter((g) => g.tipo === "categoria_edad");
  const gruposEntrenamiento = grupos.filter((g) => g.tipo === "entrenamiento");

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Grupos</h1>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800"
        >
          {mostrarForm ? "Cancelar" : "Nuevo grupo"}
        </button>
      </div>
      <p className="mt-1 text-sm text-navy-800/70">
        Los grupos "por edad" agrupan automáticamente a los atletas según su categoría de competición. Los "de
        entrenamiento" son de asignación manual, para cualquier edad — por ejemplo, la Escuela Base o los grupos de
        Absoluto.
      </p>

      {mostrarForm && club && (
        <FormularioGrupo
          clubId={club.id}
          onCreado={() => {
            setMostrarForm(false);
            cargar();
          }}
        />
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {cargando ? (
        <p className="mt-6 text-sm text-navy-800/60">Cargando…</p>
      ) : (
        <>
          <SeccionGrupos titulo="Por categoría de edad" grupos={gruposEdad} />
          <SeccionGrupos titulo="De entrenamiento" grupos={gruposEntrenamiento} />
        </>
      )}
    </div>
  );
}

function SeccionGrupos({ titulo, grupos }: { titulo: string; grupos: Grupo[] }) {
  return (
    <div className="mt-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">{titulo}</h2>
      {grupos.length === 0 ? (
        <p className="mt-2 text-sm text-navy-800/60">Sin grupos todavía.</p>
      ) : (
        <ul className="mt-2 divide-y divide-navy-900/5 rounded-2xl border border-navy-900/10 bg-white">
          {grupos.map((g) => (
            <li key={g.id} className="px-4 py-3 text-sm">
              <Link to={`/grupos/${g.id}`} className="font-medium text-navy-900 hover:underline">
                {g.nombre}
              </Link>
              {g.categoria && <span className="ml-2 text-navy-800/60">{g.categoria}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormularioGrupo({ clubId, onCreado }: { clubId: string; onCreado: () => void }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoGrupo>("categoria_edad");
  const [categoria, setCategoria] = useState(CATEGORIAS_EDAD_ASIGNABLES[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await createGrupo({
        club_id: clubId,
        nombre,
        tipo,
        categoria: tipo === "categoria_edad" ? categoria : null,
      });
      onCreado();
    } catch (err) {
      setError(mensajeError(err, "No se pudo crear el grupo."));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-navy-900/10 bg-white p-6">
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

      <button
        type="submit"
        disabled={guardando}
        className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
