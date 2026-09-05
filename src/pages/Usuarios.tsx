import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { listUsuariosClub, actualizarActivoUsuario } from "../lib/usuarios";
import { crearUsuario } from "../lib/entrenadores";
import { mensajeError } from "../lib/errors";
import type { Rol, Usuario } from "../types/database";

export default function Usuarios() {
  const { club, usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!club) return;
    setCargando(true);
    try {
      setUsuarios(await listUsuariosClub(club.id));
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

  async function alternarActivo(u: Usuario) {
    const confirmacion = u.activo
      ? `¿Dar de baja a ${u.nombre}? Perderá el acceso a la app, pero se conserva todo lo que haya registrado (comentarios, pruebas físicas, resultados).`
      : `¿Reactivar el acceso de ${u.nombre}?`;
    if (!window.confirm(confirmacion)) return;
    try {
      await actualizarActivoUsuario(u.id, !u.activo);
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, activo: !x.activo } : x)));
    } catch (err) {
      setError(mensajeError(err, "No se pudo actualizar el usuario."));
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Usuarios</h1>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800"
        >
          {mostrarForm ? "Cancelar" : "Nuevo usuario"}
        </button>
      </div>

      <p className="mt-1 text-sm text-navy-800/70">
        Administradores y entrenadores del club. La asignación a grupos se gestiona desde la ficha de cada grupo, no
        aquí.
      </p>

      {mostrarForm && club && (
        <FormularioUsuario
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
      ) : usuarios.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-navy-900/20 bg-white p-10 text-center">
          <p className="text-sm font-medium text-navy-900">Todavía no hay usuarios</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-navy-900/5 rounded-2xl border border-navy-900/10 bg-white">
          {usuarios.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-navy-900">{u.nombre}</span>
                  <span className="shrink-0 rounded-full bg-navy-900/10 px-2 py-0.5 text-xs font-medium capitalize text-navy-800">
                    {u.rol}
                  </span>
                  {!u.activo && (
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Baja
                    </span>
                  )}
                </div>
                <p className="truncate text-navy-800/60">{u.email}</p>
              </div>
              {u.id !== usuarioActual?.id && (
                <button
                  onClick={() => alternarActivo(u)}
                  className="shrink-0 text-xs font-semibold text-navy-800 hover:text-navy-600 hover:underline"
                >
                  {u.activo ? "Dar de baja" : "Reactivar"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormularioUsuario({ clubId, onCreado }: { clubId: string; onCreado: () => void }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("entrenador");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await crearUsuario({ club_id: clubId, nombre, email, password, rol });
      onCreado();
    } catch (err) {
      setError(mensajeError(err, "No se pudo crear el usuario."));
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
      <label className="block text-sm">
        <span className="font-medium text-navy-800">Rol *</span>
        <select value={rol} onChange={(e) => setRol(e.target.value as Rol)} className="input mt-1">
          <option value="entrenador">Entrenador</option>
          <option value="admin">Administrador</option>
        </select>
      </label>
      <p className="text-xs text-navy-800/60">
        Si tu proyecto de Supabase pide confirmar el email, el usuario no podrá entrar hasta confirmarlo (o hasta que
        lo confirmes tú manualmente desde el dashboard de Supabase).
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-60"
      >
        {guardando ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
