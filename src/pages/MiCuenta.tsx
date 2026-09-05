import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { cambiarPassword } from "../lib/auth";
import { mensajeError } from "../lib/errors";

export default function MiCuenta() {
  const { usuario } = useAuth();
  const [password, setPassword] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setGuardado(false);
    try {
      await cambiarPassword(password);
      setPassword("");
      setGuardado(true);
    } catch (err) {
      setError(mensajeError(err, "No se pudo cambiar la contraseña."));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-navy-900">Mi cuenta</h1>
      <p className="mt-1 text-sm text-navy-800/70">
        {usuario?.nombre} · {usuario?.email}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-navy-900/10 bg-white p-6">
        <h2 className="text-sm font-semibold text-navy-900">Cambiar contraseña</h2>
        <label className="block text-sm">
          <span className="font-medium text-navy-800">Contraseña nueva</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input mt-1"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {guardado && <p className="text-sm text-green-700">Contraseña actualizada.</p>}

        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </div>
  );
}
