import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listAtletas } from "../lib/atletas";
import { calcularCategoria } from "../lib/categorias";
import { useAuth } from "../context/AuthContext";
import type { Atleta } from "../types/database";

export default function Atletas() {
  const { usuario } = useAuth();
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [soloActivos, setSoloActivos] = useState(true);

  useEffect(() => {
    listAtletas()
      .then(setAtletas)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el listado."))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return atletas.filter((a) => {
      if (soloActivos && !a.activo) return false;
      if (!texto) return true;
      const nombreCompleto = `${a.nombre} ${a.apellidos} ${a.id_socio ?? ""}`.toLowerCase();
      return nombreCompleto.includes(texto);
    });
  }, [atletas, busqueda, soloActivos]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy-900">Atletas</h1>
        {usuario?.rol === "admin" && (
          <div className="flex gap-2">
            <Link
              to="/atletas/importar"
              className="rounded-lg border border-navy-900/20 px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-white"
            >
              Importar Excel
            </Link>
            <Link
              to="/atletas/nuevo"
              className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800"
            >
              Nuevo atleta
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre o ID de socio…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-navy-900/15 px-3 py-2 text-sm focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/30"
        />
        <label className="flex items-center gap-2 text-sm text-navy-800/80">
          <input
            type="checkbox"
            checked={soloActivos}
            onChange={(e) => setSoloActivos(e.target.checked)}
            className="rounded border-navy-900/30"
          />
          Solo activos
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {cargando ? (
        <p className="mt-8 text-sm text-navy-800/60">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-navy-900/20 bg-white p-10 text-center">
          <p className="text-sm font-medium text-navy-900">Sin resultados</p>
          <p className="mt-1 text-sm text-navy-800/60">
            {atletas.length === 0
              ? "Todavía no hay atletas dados de alta en el club."
              : "Ningún atleta coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-navy-900/10 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-navy-900/10 text-left text-xs uppercase tracking-wide text-navy-800/60">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">ID socio</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => (
                <tr key={a.id} className="border-b border-navy-900/5 last:border-0 hover:bg-ground/60">
                  <td className="px-4 py-3">
                    <Link to={`/atletas/${a.id}`} className="font-medium text-navy-900 hover:underline">
                      {a.apellidos}, {a.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-navy-800/70">{a.id_socio ?? "—"}</td>
                  <td className="px-4 py-3 text-navy-800/70">{calcularCategoria(a.fecha_nacimiento)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {!a.activo && (
                        <span className="rounded-full bg-navy-900/10 px-2 py-0.5 text-xs font-medium text-navy-800">
                          Baja
                        </span>
                      )}
                      {a.lesionado && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Lesionado
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
