import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCompeticiones } from "../lib/competiciones";
import type { Competicion } from "../types/database";
import { mensajeError } from "../lib/errors";

const ETIQUETAS_TIPO: Record<string, string> = {
  pista_aire_libre: "Pista al aire libre",
  pista_cubierta: "Pista cubierta",
  campo_a_traves: "Campo a través",
  ruta: "Ruta",
};

export default function Competiciones() {
  const [competiciones, setCompeticiones] = useState<Competicion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCompeticiones()
      .then(setCompeticiones)
      .catch((err) => setError(mensajeError(err, "No se pudo cargar el listado.")))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Competiciones</h1>
        <Link
          to="/competiciones/nueva"
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800"
        >
          Nueva competición
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {cargando ? (
        <p className="mt-8 text-sm text-navy-800/60">Cargando…</p>
      ) : competiciones.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-navy-900/20 bg-white p-10 text-center">
          <p className="text-sm font-medium text-navy-900">Todavía no hay competiciones</p>
          <p className="mt-1 text-sm text-navy-800/60">
            Da de alta la primera competición para poder registrar resultados.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-navy-900/10 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-navy-900/10 text-left text-xs uppercase tracking-wide text-navy-800/60">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Temporada</th>
              </tr>
            </thead>
            <tbody>
              {competiciones.map((c) => (
                <tr key={c.id} className="border-b border-navy-900/5 last:border-0 hover:bg-ground/60">
                  <td className="px-4 py-3">
                    <Link to={`/competiciones/${c.id}`} className="font-medium text-navy-900 hover:underline">
                      {c.nombre}
                    </Link>
                    {c.lugar && <p className="text-xs text-navy-800/50">{c.lugar}</p>}
                  </td>
                  <td className="px-4 py-3 text-navy-800/70">
                    {new Date(c.fecha).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3 text-navy-800/70">{ETIQUETAS_TIPO[c.tipo] ?? c.tipo}</td>
                  <td className="px-4 py-3 text-navy-800/70">{c.temporada}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
