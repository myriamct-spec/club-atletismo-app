import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cambiarPassword } from "../lib/auth";
import { mensajeError } from "../lib/errors";

export default function RestablecerPassword() {
  const { session, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await cambiarPassword(password);
      setGuardado(true);
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar la contraseña."));
    } finally {
      setGuardando(false);
    }
  }

  if (guardado) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <img
          src="/branding/logo-horizontal.png"
          alt="Club Atletismo UCAM Cartagena"
          className="mx-auto h-20 w-auto"
        />
        <h1 className="mt-6 text-center font-display text-3xl tracking-wide text-navy-900">
          Nueva contraseña
        </h1>

        {loading ? (
          <p className="mt-6 text-center text-sm text-navy-800/60">Comprobando el enlace…</p>
        ) : !session ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm text-navy-800/80">
              Este enlace no es válido o ha caducado. Pide uno nuevo desde "He olvidado mi contraseña".
            </p>
            <Link to="/olvide-password" className="inline-block text-sm font-semibold text-navy-800 hover:underline">
              Pedir un enlace nuevo
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy-800">
                Contraseña nueva
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input mt-1"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={guardando}
              className="w-full rounded-lg bg-navy-900 py-2.5 font-semibold text-gold-300 transition hover:bg-navy-800 disabled:opacity-60"
            >
              {guardando ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
