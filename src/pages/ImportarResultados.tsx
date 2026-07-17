import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { getCompeticion } from "../lib/competiciones";
import { createResultado } from "../lib/resultados";
import { listAtletas } from "../lib/atletas";
import { listDisciplinas } from "../lib/disciplinas";
import { normalizarClave } from "../lib/excel";
import type { Atleta, Competicion, Disciplina } from "../types/database";
import { mensajeError } from "../lib/errors";

const CABECERAS = ["ID_Socio", "Nombre", "Apellidos", "Disciplina", "Marca", "Puesto", "Viento"];
const CLAVE_A_CAMPO: Record<string, string> = {
  idsocio: "id_socio",
  nombre: "nombre",
  apellidos: "apellidos",
  disciplina: "disciplina",
  marca: "marca",
  puesto: "puesto",
  viento: "viento",
};

type FilaImportacion = {
  fila: number;
  atletaNombre: string;
  disciplinaTexto: string;
  atletaId: string | null;
  disciplinaId: string | null;
  marca: string;
  puesto: number | null;
  viento: number | null;
  errores: string[];
};

function descargarPlantilla() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    CABECERAS,
    ["SOC-0142", "Laura", "Gómez Ruiz", "100m", "11.84", "1", "1.2"],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Resultados");
  XLSX.writeFile(wb, "plantilla_resultados.xlsx");
}

export default function ImportarResultados() {
  const { id: competicionId } = useParams();
  const { club, usuario } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [competicion, setCompeticion] = useState<Competicion | null>(null);
  const [filas, setFilas] = useState<FilaImportacion[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: number; error: number } | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!club || !competicionId) return;
    setErrorGeneral(null);
    setResultado(null);
    setProcesando(true);
    setNombreArchivo(file.name);

    try {
      const [comp, atletas, disciplinas]: [Competicion | null, Atleta[], Disciplina[]] = await Promise.all([
        getCompeticion(competicionId),
        listAtletas(),
        listDisciplinas(),
      ]);
      setCompeticion(comp);

      const porIdSocio = new Map(atletas.filter((a) => a.id_socio).map((a) => [a.id_socio as string, a]));
      const porNombre = new Map<string, Atleta[]>();
      for (const a of atletas) {
        const clave = `${a.nombre} ${a.apellidos}`.trim().toLowerCase();
        porNombre.set(clave, [...(porNombre.get(clave) ?? []), a]);
      }
      const porDisciplina = new Map(disciplinas.map((d) => [d.nombre.trim().toLowerCase(), d]));

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const filasCrudas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: "" });

      const procesadas: FilaImportacion[] = filasCrudas.map((cruda, index) => {
        const normalizada: Record<string, unknown> = {};
        for (const [clave, valor] of Object.entries(cruda)) {
          const campo = CLAVE_A_CAMPO[normalizarClave(clave)];
          if (campo) normalizada[campo] = valor;
        }

        const id_socio = String(normalizada.id_socio ?? "").trim();
        const nombre = String(normalizada.nombre ?? "").trim();
        const apellidos = String(normalizada.apellidos ?? "").trim();
        const disciplinaTexto = String(normalizada.disciplina ?? "").trim();
        const marca = String(normalizada.marca ?? "").trim();
        const puestoTexto = String(normalizada.puesto ?? "").trim();
        const vientoTexto = String(normalizada.viento ?? "").trim();

        const errores: string[] = [];
        let atletaId: string | null = null;

        if (id_socio) {
          const atleta = porIdSocio.get(id_socio);
          if (atleta) atletaId = atleta.id;
          else errores.push(`Atleta no encontrado con ID de socio "${id_socio}"`);
        } else if (nombre && apellidos) {
          const coincidencias = porNombre.get(`${nombre} ${apellidos}`.trim().toLowerCase()) ?? [];
          if (coincidencias.length === 1) atletaId = coincidencias[0].id;
          else if (coincidencias.length === 0) errores.push(`Atleta no encontrado: ${nombre} ${apellidos}`);
          else errores.push(`Nombre ambiguo, hay ${coincidencias.length} atletas con ese nombre: usa ID_Socio`);
        } else {
          errores.push("Falta ID_Socio o Nombre + Apellidos para identificar al atleta");
        }

        let disciplinaId: string | null = null;
        if (!disciplinaTexto) {
          errores.push("Falta la disciplina");
        } else {
          const disciplina = porDisciplina.get(disciplinaTexto.toLowerCase());
          if (disciplina) disciplinaId = disciplina.id;
          else errores.push(`Disciplina no reconocida: "${disciplinaTexto}"`);
        }

        if (!marca) errores.push("Falta la marca");

        const puesto = puestoTexto ? Number(puestoTexto) : null;
        if (puestoTexto && Number.isNaN(puesto)) errores.push("Puesto no es un número válido");
        const viento = vientoTexto ? Number(vientoTexto) : null;
        if (vientoTexto && Number.isNaN(viento)) errores.push("Viento no es un número válido");

        return {
          fila: index + 2,
          atletaNombre: id_socio || `${nombre} ${apellidos}`.trim(),
          disciplinaTexto,
          atletaId,
          disciplinaId,
          marca,
          puesto: Number.isNaN(puesto) ? null : puesto,
          viento: Number.isNaN(viento) ? null : viento,
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
    if (!club || !usuario || !competicionId) return;
    setImportando(true);
    const validas = filas.filter((f) => f.errores.length === 0);
    let ok = 0;

    for (const fila of validas) {
      try {
        await createResultado({
          atleta_id: fila.atletaId!,
          competicion_id: competicionId,
          disciplina_id: fila.disciplinaId!,
          marca: fila.marca,
          puesto: fila.puesto,
          viento: fila.viento,
          es_marca_personal: false,
          observaciones: null,
        });
        ok += 1;
      } catch {
        // el recuento final refleja el resultado; el detalle ya se validó en la vista previa
      }
    }

    await supabase.from("importacion_logs").insert({
      club_id: club.id,
      tipo: "resultados",
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
      <Link to={`/competiciones/${competicionId}`} className="text-sm text-navy-800/60 hover:text-navy-900">
        ← Volver a la competición
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-navy-900">
        Importar resultados{competicion ? ` — ${competicion.nombre}` : ""}
      </h1>
      <p className="mt-1 text-sm text-navy-800/70">
        Columnas esperadas: {CABECERAS.join(", ")}. Se prioriza ID_Socio para identificar al atleta; si no lo indicas,
        se cruza por nombre y apellidos.
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
                  <th className="px-3 py-2">Atleta</th>
                  <th className="px-3 py-2">Disciplina</th>
                  <th className="px-3 py-2">Marca</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.fila} className="border-b border-navy-900/5 last:border-0">
                    <td className="px-3 py-2 text-navy-800/60">{f.fila}</td>
                    <td className="px-3 py-2 text-navy-900">{f.atletaNombre}</td>
                    <td className="px-3 py-2 text-navy-800/70">{f.disciplinaTexto}</td>
                    <td className="px-3 py-2 text-navy-800/70">{f.marca || "—"}</td>
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
            {importando ? "Importando…" : `Importar ${validas} resultados`}
          </button>
        </div>
      )}

      {resultado && (
        <div className="mt-6 rounded-2xl border border-navy-900/10 bg-white p-6">
          <p className="text-sm font-semibold text-navy-900">
            Importación completada: {resultado.ok} resultados creados
            {resultado.error > 0 && `, ${resultado.error} con error`}.
          </p>
          <button
            onClick={() => navigate(`/competiciones/${competicionId}`)}
            className="mt-4 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800"
          >
            Ver competición
          </button>
        </div>
      )}
    </div>
  );
}
