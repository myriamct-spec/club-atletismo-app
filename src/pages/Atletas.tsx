export default function Atletas() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Atletas</h1>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-navy-900/20 bg-white p-10 text-center">
        <p className="text-sm font-medium text-navy-900">Listado de atletas en construcción</p>
        <p className="mt-1 text-sm text-navy-800/60">
          Alta manual, importación desde Excel y asignación de entrenadores llegan en la siguiente iteración.
        </p>
      </div>
    </div>
  );
}
