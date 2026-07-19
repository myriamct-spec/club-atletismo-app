import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listAtletas } from "../lib/atletas";
import { listCompeticiones } from "../lib/competiciones";
import { temporadaActual } from "../lib/categorias";
import { mensajeError } from "../lib/errors";
import type { Atleta, Competicion } from "../types/database";

export default function Dashboard() {
  const { usuario } = useAuth();
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [competiciones, setCompeticiones] = useState<Competicion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listAtletas(), listCompeticiones()])
      .then(([a, c]) => {
        setAtletas(a);
        setCompeticiones(c);
      })
      .catch((err) => setError(mensajeError(err, "No se pudieron cargar los datos del panel.")))
      .finally(() => setCargando(false));
  }, []);

  const atletasActivos = atletas.filter((a) => a.activo).length;
  const lesionados = atletas.filter((a) => a.activo && a.lesionado).length;
  const competicionesTemporada = competiciones.filter((c) => c.temporada === temporadaActual()).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Hola, {usuario?.nombre?.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-navy-800/70">
        Panel del Club Atletismo Veloz Runners.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-navy-900/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Atletas</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">{cargando ? "—" : atletasActivos}</p>
          <p className="mt-1 text-xs text-navy-800/50">Activos en el club</p>
        </div>
        <div className="rounded-2xl border border-navy-900/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Competiciones esta temporada</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">{cargando ? "—" : competicionesTemporada}</p>
          <p className="mt-1 text-xs text-navy-800/50">Temporada {temporadaActual()}</p>
        </div>
        <div className="rounded-2xl border border-navy-900/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Lesionados</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">{cargando ? "—" : lesionados}</p>
          <p className="mt-1 text-xs text-navy-800/50">Atletas activos con lesión</p>
        </div>
      </div>
    </div>
  );
}
