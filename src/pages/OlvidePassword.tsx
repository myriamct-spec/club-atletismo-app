import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { enviarResetPassword } from "../lib/auth";
import { mensajeError } from "../lib/errors";

export default function OlvidePassword() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await enviarResetPassword(email);
      setEnviado(true);
    } catch (err) {
      setError(mensajeError(err, "No se pudo enviar el correo."));
    } finally {
      setEnviando(false);
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
        <h1 className="mt-6 text-center font-display text-3xl tracking-wide text-navy-900">
          Recuperar contraseña
        </h1>

        {enviado ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm text-navy-800/80">
              Si ese email tiene una cuenta en el club, te hemos enviado un enlace para poner una contraseña nueva.
            </p>
            <Link to="/login" className="inline-block text-sm font-semibold text-navy-800 hover:underline">
              Volver al login
            </Link>
          </div>
        ) : (
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
                className="input mt-1"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-lg bg-navy-900 py-2.5 font-semibold text-gold-300 transition hover:bg-navy-800 disabled:opacity-60"
            >
              {enviando ? "Enviando…" : "Enviar enlace"}
            </button>

            <p className="text-center text-sm">
              <Link to="/login" className="font-medium text-navy-800 hover:underline">
                Volver al login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
