import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { createAtleta, getAtleta, updateAtleta, type AtletaInput } from "../lib/atletas";

const CAMPOS_INICIALES: Omit<AtletaInput, "club_id"> = {
  nombre: "",
  apellidos: "",
  fecha_nacimiento: "",
  genero: "Femenino",
  id_socio: "",
  foto_url: null,
  observaciones_generales: "",
  lesionado: false,
  activo: true,
};

export default function AtletaForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { club } = useAuth();

  const [campos, setCampos] = useState(CAMPOS_INICIALES);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [cargando, setCargando] = useState(editando);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getAtleta(id)
      .then((atleta) => {
        if (!atleta) {
          setError("No se encontró el atleta.");
          return;
        }
        setCampos({
          nombre: atleta.nombre,
          apellidos: atleta.apellidos,
          fecha_nacimiento: atleta.fecha_nacimiento,
          genero: atleta.genero,
          id_socio: atleta.id_socio ?? "",
          foto_url: atleta.foto_url,
          observaciones_generales: atleta.observaciones_generales ?? "",
          lesionado: atleta.lesionado,
          activo: atleta.activo,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el atleta."))
      .finally(() => setCargando(false));
  }, [id]);

  async function subirFotoSiHace(): Promise<string | null> {
    if (!fotoFile || !club) return campos.foto_url;
    const extension = fotoFile.name.split(".").pop();
    const ruta = `${club.id}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("atleta-fotos").upload(ruta, fotoFile);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("atleta-fotos").getPublicUrl(ruta);
    return data.publicUrl;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!club) return;
    setError(null);
    setGuardando(true);
    try {
      const foto_url = await subirFotoSiHace();
      const payload: AtletaInput = {
        club_id: club.id,
        ...campos,
        id_socio: campos.id_socio?.trim() || null,
        observaciones_generales: campos.observaciones_generales?.trim() || null,
        foto_url,
      };

      if (editando && id) {
        await updateAtleta(id, payload);
        navigate(`/atletas/${id}`);
      } else {
        const creado = await createAtleta(payload);
        navigate(`/atletas/${creado.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el atleta.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="text-sm text-navy-800/60">Cargando…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy-900">{editando ? "Editar atleta" : "Nuevo atleta"}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-navy-900/10 bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Nombre" required>
            <input
              required
              value={campos.nombre}
              onChange={(e) => setCampos({ ...campos, nombre: e.target.value })}
              className="input"
            />
          </Campo>
          <Campo label="Apellidos" required>
            <input
              required
              value={campos.apellidos}
              onChange={(e) => setCampos({ ...campos, apellidos: e.target.value })}
              className="input"
            />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Fecha de nacimiento" required>
            <input
              type="date"
              required
              value={campos.fecha_nacimiento}
              onChange={(e) => setCampos({ ...campos, fecha_nacimiento: e.target.value })}
              className="input"
            />
          </Campo>
          <Campo label="Género" required>
            <select
              value={campos.genero}
              onChange={(e) => setCampos({ ...campos, genero: e.target.value })}
              className="input"
            >
              <option>Femenino</option>
              <option>Masculino</option>
              <option>Otro</option>
            </select>
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="ID de socio">
            <input
              value={campos.id_socio ?? ""}
              onChange={(e) => setCampos({ ...campos, id_socio: e.target.value })}
              className="input"
              placeholder="Opcional, pero recomendado"
            />
          </Campo>
          <Campo label="Foto">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFotoFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </Campo>
        </div>

        <Campo label="Observaciones generales">
          <textarea
            value={campos.observaciones_generales ?? ""}
            onChange={(e) => setCampos({ ...campos, observaciones_generales: e.target.value })}
            rows={3}
            className="input"
            placeholder="Notas generales sobre el atleta (no es el histórico de seguimiento del entrenador)"
          />
        </Campo>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-navy-800">
            <input
              type="checkbox"
              checked={campos.lesionado}
              onChange={(e) => setCampos({ ...campos, lesionado: e.target.checked })}
              className="rounded border-navy-900/30"
            />
            Actualmente lesionado / no puede competir
          </label>
          {editando && (
            <label className="flex items-center gap-2 text-sm text-navy-800">
              <input
                type="checkbox"
                checked={campos.activo}
                onChange={(e) => setCampos({ ...campos, activo: e.target.checked })}
                className="rounded border-navy-900/30"
              />
              Activo en el club
            </label>
          )}
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

function Campo({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-navy-800">
        {label} {required && <span className="text-gold-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
