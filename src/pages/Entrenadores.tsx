import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { listEntrenadores } from "../lib/usuarios";
import { crearEntrenador } from "../lib/entrenadores";
import { mensajeError } from "../lib/errors";
import type { Usuario } from "../types/database";

export default function Entrenadores() {
  const { club } = useAuth();
  const [entrenadores, setEntrenadores] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!club) return;
    setCargando(true);
    try {
      setEntrenadores(await listEntrenadores(club.id));
    } catch (err) {
      setError(mensajeError(err, "No se pudo cargar el listado."));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club?.id]);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Entrenadores</h1>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800"
        >
          {mostrarForm ? "Cancelar" : "Nuevo entrenador"}
        </button>
      </div>

      <p className="mt-1 text-sm text-navy-800/70">
        La asignación a grupos se gestiona desde la ficha de cada grupo, no aquí.
      </p>

      {mostrarForm && club && (
        <FormularioEntrenador
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
      ) : entrenadores.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-navy-900/20 bg-white p-10 text-center">
          <p className="text-sm font-medium text-navy-900">Todavía no hay entrenadores</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-navy-900/5 rounded-2xl border border-navy-900/10 bg-white">
          {entrenadores.map((e) => (
            <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium text-navy-900">{e.nombre}</span>
              <span className="text-navy-800/60">{e.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormularioEntrenador({ clubId, onCreado }: { clubId: string; onCreado: () => void }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await crearEntrenador({ club_id: clubId, nombre, email, password });
      onCreado();
    } catch (err) {
      setError(mensajeError(err, "No se pudo crear el entrenador."));
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
        <span className="font-medium text-navy-800">Email *</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mt-1"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-navy-800">Contraseña temporal *</span>
        <input
          type="text"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          className="input mt-1"
        />
      </label>
      <p className="text-xs text-navy-800/60">
        Si tu proyecto de Supabase pide confirmar el email, el entrenador no podrá entrar hasta confirmarlo (o hasta
        que lo confirmes tú manualmente desde el dashboard de Supabase).
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-60"
      >
        {guardando ? "Creando…" : "Crear entrenador"}
      </button>
    </form>
  );
}
