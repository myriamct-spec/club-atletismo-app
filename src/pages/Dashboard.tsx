import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { usuario } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Hola, {usuario?.nombre?.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-navy-800/70">
        Panel del Club Atletismo Veloz Runners.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-navy-900/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Atletas</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">—</p>
          <p className="mt-1 text-xs text-navy-800/50">Próximamente</p>
        </div>
        <div className="rounded-2xl border border-navy-900/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Competiciones esta temporada</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">—</p>
          <p className="mt-1 text-xs text-navy-800/50">Próximamente</p>
        </div>
        <div className="rounded-2xl border border-navy-900/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-800/60">Lesionados</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">—</p>
          <p className="mt-1 text-xs text-navy-800/50">Próximamente</p>
        </div>
      </div>
    </div>
  );
}
