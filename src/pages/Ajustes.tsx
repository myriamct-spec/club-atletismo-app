import { useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { ClubLogo } from "../components/ClubLogo";
import { mensajeError } from "../lib/errors";

const TAMANO_MAXIMO_MB = 8;

export default function Ajustes() {
  const { club, refreshClub } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !club) return;

    setError(null);
    setOk(false);

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (PNG, JPG o SVG).");
      return;
    }
    if (file.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      setError(`La imagen no puede superar ${TAMANO_MAXIMO_MB}MB.`);
      return;
    }

    setSubiendo(true);
    try {
      const extension = file.name.split(".").pop();
      const ruta = `${club.id}/logo-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("club-assets")
        .upload(ruta, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("club-assets").getPublicUrl(ruta);

      const { error: updateError } = await supabase
        .from("clubs")
        .update({ logo_url: publicUrlData.publicUrl })
        .eq("id", club.id);

      if (updateError) throw updateError;

      await refreshClub();
      setOk(true);
    } catch (err) {
      setError(mensajeError(err, "No se pudo subir el logo."));
    } finally {
      setSubiendo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-navy-900">Ajustes del club</h1>
      <p className="mt-1 text-sm text-navy-800/70">
        El logo se muestra en el panel y en el resto de la aplicación. Puedes reemplazarlo cuando quieras.
      </p>

      <div className="mt-8 flex items-center gap-6 rounded-2xl border border-navy-900/10 bg-white p-6">
        <ClubLogo size={72} />
        <div>
          <p className="text-sm font-medium text-navy-900">Logo actual</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendo}
            className="mt-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 transition hover:bg-navy-800 disabled:opacity-60"
          >
            {subiendo ? "Subiendo…" : "Cambiar logo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {ok && <p className="mt-2 text-sm text-green-700">Logo actualizado.</p>}
        </div>
      </div>
    </div>
  );
}
