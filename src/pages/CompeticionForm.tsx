import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createCompeticion } from "../lib/competiciones";
import { temporadaActual } from "../lib/categorias";
import type { TipoCompeticion } from "../types/database";
import { mensajeError } from "../lib/errors";

export default function CompeticionForm() {
  const { club } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [lugar, setLugar] = useState("");
  const [tipo, setTipo] = useState<TipoCompeticion>("pista_aire_libre");
  const [temporada, setTemporada] = useState(temporadaActual());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!club) return;
    setGuardando(true);
    setError(null);
    try {
      const creada = await createCompeticion({
        club_id: club.id,
        nombre,
        fecha,
        lugar: lugar.trim() || null,
        tipo,
        temporada,
        origen: "manual",
      });
      navigate(`/competiciones/${creada.id}`);
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar la competición."));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-navy-900">Nueva competición</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-navy-900/10 bg-white p-6">
        <label className="block text-sm">
          <span className="font-medium text-navy-800">
            Nombre <span className="text-gold-500">*</span>
          </span>
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="input mt-1" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium text-navy-800">
              Fecha <span className="text-gold-500">*</span>
            </span>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="input mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-navy-800">Temporada</span>
            <input value={temporada} onChange={(e) => setTemporada(e.target.value)} className="input mt-1" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium text-navy-800">Lugar</span>
            <input value={lugar} onChange={(e) => setLugar(e.target.value)} className="input mt-1" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-navy-800">Tipo</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoCompeticion)} className="input mt-1">
              <option value="pista_aire_libre">Pista al aire libre</option>
              <option value="pista_cubierta">Pista cubierta</option>
              <option value="campo_a_traves">Campo a través</option>
              <option value="ruta">Ruta</option>
            </select>
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-ground"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
