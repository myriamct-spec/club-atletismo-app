import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) {
      setError("Email o contraseña incorrectos.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <img
          src="/branding/logo-horizontal.png"
          alt="Club Atletismo UCAM Cartagena"
          className="mx-auto h-20 w-auto"
        />
        <h1 className="mt-6 text-center font-display text-3xl tracking-wide text-navy-900">Acceso de entrenadores</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-navy-800">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy-900/15 px-3 py-2 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/30"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-navy-800">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy-900/15 px-3 py-2 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/30"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-navy-900 py-2.5 font-semibold text-gold-300 transition hover:bg-navy-800 disabled:opacity-60"
          >
            {submitting ? "Entrando…" : "Entrar"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link to="/olvide-password" className="text-navy-800 hover:underline">
              He olvidado mi contraseña
            </Link>
            <Link to="/registro" className="font-medium text-navy-800 hover:underline">
              Regístrate como entrenador
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
