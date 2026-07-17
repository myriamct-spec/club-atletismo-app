import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { asignarEntrenador, createAtleta, listAtletas } from "../lib/atletas";
import { listEntrenadores } from "../lib/usuarios";
import { normalizarClave, parseFechaExcel } from "../lib/excel";
import type { Usuario } from "../types/database";
import { mensajeError } from "../lib/errors";

const CABECERAS = ["Nombre", "Apellidos", "Fecha_nacimiento", "Genero", "ID_Socio", "Entrenadores"];
const CLAVE_A_CAMPO: Record<string, string> = {
  nombre: "nombre",
  apellidos: "apellidos",
  fechanacimiento: "fecha_nacimiento",
  genero: "genero",
  idsocio: "id_socio",
  entrenadores: "entrenadores",
  entrenador: "entrenadores",
};

type FilaImportacion = {
  fila: number;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string | null;
  genero: string;
  id_socio: string;
  entrenadoresTexto: string;
  entrenadoresIds: string[];
  errores: string[];
};

function descargarPlantilla() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    CABECERAS,
    ["Laura", "Gómez Ruiz", "15/03/2011", "Femenino", "SOC-0142", "entrenador@club-aurora.es"],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Atletas");
  XLSX.writeFile(wb, "plantilla_atletas.xlsx");
}

export default function ImportarAtletas() {
  const { club, usuario } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filas, setFilas] = useState<FilaImportacion[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: number; error: number } | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!club) return;
    setErrorGeneral(null);
    setResultado(null);
    setProcesando(true);
    setNombreArchivo(file.name);

    try {
      const [existentes, entrenadoresClub] = await Promise.all([
        listAtletas(),
        listEntrenadores(club.id),
      ]);
      const idSociosExistentes = new Set(
        existentes.map((a) => a.id_socio).filter((v): v is string => Boolean(v)),
      );
      const entrenadoresPorEmail = new Map<string, Usuario>(
        entrenadoresClub.map((e) => [e.email.toLowerCase().trim(), e]),
      );

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const filasCrudas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: "" });

      const idSociosVistos = new Set<string>();

      const procesadas: FilaImportacion[] = filasCrudas.map((cruda, index) => {
        const normalizada: Record<string, unknown> = {};
        for (const [clave, valor] of Object.entries(cruda)) {
          const campo = CLAVE_A_CAMPO[normalizarClave(clave)];
          if (campo) normalizada[campo] = valor;
        }

        const nombre = String(normalizada.nombre ?? "").trim();
        const apellidos = String(normalizada.apellidos ?? "").trim();
        const genero = String(normalizada.genero ?? "").trim();
        const id_socio = String(normalizada.id_socio ?? "").trim();
        const entrenadoresTexto = String(normalizada.entrenadores ?? "").trim();
        const fecha_nacimiento = parseFechaExcel(normalizada.fecha_nacimiento);

        const errores: string[] = [];
        if (!nombre) errores.push("Falta el nombre");
        if (!apellidos) errores.push("Faltan los apellidos");
        if (!genero) errores.push("Falta el género");
        if (!fecha_nacimiento) errores.push("Fecha de nacimiento inválida o vacía (usa DD/MM/AAAA)");

        if (id_socio) {
          if (idSociosExistentes.has(id_socio) || idSociosVistos.has(id_socio)) {
            errores.push(`ID de socio duplicado (${id_socio})`);
          }
          idSociosVistos.add(id_socio);
        }

        const entrenadoresIds: string[] = [];
        if (entrenadoresTexto) {
          for (const email of entrenadoresTexto.split(";").map((e) => e.trim()).filter(Boolean)) {
            const entrenador = entrenadoresPorEmail.get(email.toLowerCase());
            if (entrenador) {
              entrenadoresIds.push(entrenador.id);
            } else {
              errores.push(`Entrenador no encontrado: ${email}`);
            }
          }
        }

        return {
          fila: index + 2,
          nombre,
          apellidos,
          fecha_nacimiento,
          genero,
          id_socio,
          entrenadoresTexto,
          entrenadoresIds,
          errores,
        };
      });

      setFilas(procesadas);
    } catch (err) {
      setErrorGeneral(mensajeError(err, "No se pudo leer el archivo."));
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarImportacion() {
    if (!club || !usuario) return;
    setImportando(true);
    const validas = filas.filter((f) => f.errores.length === 0);
    let ok = 0;

    for (const fila of validas) {
      try {
        const creado = await createAtleta({
          club_id: club.id,
          nombre: fila.nombre,
          apellidos: fila.apellidos,
          fecha_nacimiento: fila.fecha_nacimiento!,
          genero: fila.genero,
          id_socio: fila.id_socio || null,
          foto_url: null,
          observaciones_generales: null,
          lesionado: false,
          activo: true,
        });
        for (const entrenadorId of fila.entrenadoresIds) {
          await asignarEntrenador(creado.id, entrenadorId);
        }
        ok += 1;
      } catch {
        // el resumen final refleja el recuento; el detalle ya se validó en la vista previa
      }
    }

    await supabase.from("importacion_logs").insert({
      club_id: club.id,
      tipo: "atletas",
      usuario_id: usuario.id,
      archivo_nombre: nombreArchivo,
      filas_totales: filas.length,
      filas_ok: ok,
      filas_error: filas.length - ok,
      detalle_errores: JSON.stringify(
        filas.filter((f) => f.errores.length > 0).map((f) => ({ fila: f.fila, errores: f.errores })),
      ),
    });

    setResultado({ ok, error: filas.length - ok });
    setImportando(false);
  }

  const validas = filas.filter((f) => f.errores.length === 0).length;
  const conError = filas.length - validas;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-navy-900">Importar atletas desde Excel</h1>
      <p className="mt-1 text-sm text-navy-800/70">
        Columnas esperadas: {CABECERAS.join(", ")}. "Entrenadores" acepta uno o varios emails separados por punto y coma.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={descargarPlantilla}
          className="rounded-lg border border-navy-900/20 px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-white"
        >
          Descargar plantilla
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800"
        >
          Seleccionar archivo…
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {errorGeneral && <p className="mt-4 text-sm text-red-600">{errorGeneral}</p>}
      {procesando && <p className="mt-4 text-sm text-navy-800/60">Procesando archivo…</p>}

      {filas.length > 0 && !resultado && (
        <div className="mt-6">
          <p className="text-sm text-navy-800">
            <span className="font-semibold text-green-700">{validas} filas listas</span>
            {conError > 0 && (
              <>
                {" "}
                · <span className="font-semibold text-red-600">{conError} con error</span>
              </>
            )}
          </p>

          <div className="mt-3 max-h-96 overflow-auto rounded-2xl border border-navy-900/10 bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="sticky top-0 border-b border-navy-900/10 bg-white text-left text-xs uppercase tracking-wide text-navy-800/60">
                <tr>
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Fecha nac.</th>
                  <th className="px-3 py-2">ID socio</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.fila} className="border-b border-navy-900/5 last:border-0">
                    <td className="px-3 py-2 text-navy-800/60">{f.fila}</td>
                    <td className="px-3 py-2 text-navy-900">
                      {f.nombre} {f.apellidos}
                    </td>
                    <td className="px-3 py-2 text-navy-800/70">{f.fecha_nacimiento ?? "—"}</td>
                    <td className="px-3 py-2 text-navy-800/70">{f.id_socio || "—"}</td>
                    <td className="px-3 py-2">
                      {f.errores.length === 0 ? (
                        <span className="text-xs font-medium text-green-700">OK</span>
                      ) : (
                        <span className="text-xs font-medium text-red-600" title={f.errores.join("; ")}>
                          {f.errores.join("; ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={confirmarImportacion}
            disabled={validas === 0 || importando}
            className="mt-4 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-gold-300 hover:bg-navy-800 disabled:opacity-50"
          >
            {importando ? "Importando…" : `Importar ${validas} atletas`}
          </button>
        </div>
      )}

      {resultado && (
        <div className="mt-6 rounded-2xl border border-navy-900/10 bg-white p-6">
          <p className="text-sm font-semibold text-navy-900">
            Importación completada: {resultado.ok} atletas creados
            {resultado.error > 0 && `, ${resultado.error} con error`}.
          </p>
          <button
            onClick={() => navigate("/atletas")}
            className="mt-4 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800"
          >
            Ver listado de atletas
          </button>
        </div>
      )}
    </div>
  );
}
