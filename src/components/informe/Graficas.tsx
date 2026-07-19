import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatoRitmo } from "../../lib/informe";
import type { Intento, RitmoKm } from "../../types/database";

const COLOR_PRIMARIO = "#1E3E7E"; // navy-800
const COLOR_ACENTO = "#F5B800"; // gold-500
const COLOR_NULO = "#DC2626"; // red-600, solo para marcar intentos no válidos

function formatoFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

export type PuntoProgresion = {
  fecha: string;
  valor: number | null;
  tipo: "competicion" | "test_control";
  condiciones: string | null;
  validez: string;
};

function TooltipProgresion({ active, payload }: { active?: boolean; payload?: Array<{ payload: PuntoProgresion }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-navy-900/10 bg-white p-3 text-xs shadow-sm">
      <p className="font-semibold text-navy-900">{new Date(p.fecha).toLocaleDateString("es-ES")}</p>
      <p className="mt-1 text-navy-800">
        Resultado: <span className="font-semibold">{p.valor ?? "—"}</span>
      </p>
      <p className="text-navy-800/70">{p.tipo === "competicion" ? "Competición" : "Test de control"}</p>
      {p.validez !== "valido" && <p className="text-red-600">{p.validez === "nulo" ? "Nulo" : "No presentado"}</p>}
      {p.condiciones && <p className="mt-1 text-navy-800/60">{p.condiciones}</p>}
    </div>
  );
}

export function GraficaProgresion({
  datos,
  mejorMarca,
  invertirEje,
}: {
  datos: PuntoProgresion[];
  mejorMarca: number | null;
  invertirEje: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={datos} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#14274E" strokeOpacity={0.08} />
        <XAxis dataKey="fecha" tickFormatter={formatoFecha} tick={{ fontSize: 12 }} />
        <YAxis reversed={invertirEje} tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
        <Tooltip content={<TooltipProgresion />} />
        {mejorMarca !== null && (
          <ReferenceLine y={mejorMarca} stroke={COLOR_ACENTO} strokeDasharray="6 4" label={{ value: "PB", position: "right", fontSize: 11 }} />
        )}
        <Line type="monotone" dataKey="valor" name="Resultado" stroke={COLOR_PRIMARIO} strokeWidth={2} dot={{ r: 3 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

export type PuntoFisicoVsMarca = { fecha: string; fisico: number | null; marca: number | null };

export function GraficaFisicoVsMarca({
  datos,
  etiquetaFisico,
  invertirEjeMarca,
}: {
  datos: PuntoFisicoVsMarca[];
  etiquetaFisico: string;
  invertirEjeMarca: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={datos} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#14274E" strokeOpacity={0.08} />
        <XAxis dataKey="fecha" tickFormatter={formatoFecha} tick={{ fontSize: 12 }} />
        <YAxis yAxisId="fisico" tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
        <YAxis yAxisId="marca" orientation="right" reversed={invertirEjeMarca} tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
        <Tooltip labelFormatter={(v) => new Date(String(v)).toLocaleDateString("es-ES")} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line yAxisId="fisico" type="monotone" dataKey="fisico" name={etiquetaFisico} stroke={COLOR_PRIMARIO} strokeWidth={2} dot={{ r: 3 }} connectNulls />
        <Line yAxisId="marca" type="monotone" dataKey="marca" name="Marca" stroke={COLOR_ACENTO} strokeWidth={2} dot={{ r: 3 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GraficaIntentos({ intentos }: { intentos: Intento[] }) {
  const mejorValor = Math.max(...intentos.filter((i) => i.validez === "valido").map((i) => i.valor), -Infinity);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={intentos} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#14274E" strokeOpacity={0.08} />
        <XAxis dataKey="numero" tickFormatter={(n) => `#${n}`} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(valor, _nombre, item) => [
            `${valor}`,
            (item?.payload as Intento | undefined)?.validez !== "valido" ? "Nulo" : "Válido",
          ]}
        />
        <Bar dataKey="valor" name="Intento" radius={[4, 4, 0, 0]}>
          {intentos.map((it, i) => (
            <Cell key={i} fill={it.validez !== "valido" ? COLOR_NULO : it.valor === mejorValor ? COLOR_ACENTO : COLOR_PRIMARIO} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraficaRitmoFc({ datos }: { datos: RitmoKm[] }) {
  const ordenados = [...datos].sort((a, b) => a.km - b.km);
  const hayFc = ordenados.some((d) => d.fc !== null);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={ordenados} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#14274E" strokeOpacity={0.08} />
        <XAxis dataKey="km" tickFormatter={(km) => `km ${km}`} tick={{ fontSize: 12 }} />
        <YAxis yAxisId="ritmo" reversed tick={{ fontSize: 12 }} tickFormatter={formatoRitmo} width={70} />
        {hayFc && <YAxis yAxisId="fc" orientation="right" tick={{ fontSize: 12 }} />}
        <Tooltip
          formatter={(valor, nombre) => (nombre === "Ritmo" ? [formatoRitmo(Number(valor)), nombre] : [valor, nombre])}
          labelFormatter={(km) => `Km ${km}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line yAxisId="ritmo" type="monotone" dataKey="ritmo_seg" name="Ritmo" stroke={COLOR_PRIMARIO} strokeWidth={2} dot={{ r: 3 }} />
        {hayFc && <Line yAxisId="fc" type="monotone" dataKey="fc" name="FC" stroke={COLOR_ACENTO} strokeWidth={2} dot={{ r: 3 }} connectNulls />}
      </LineChart>
    </ResponsiveContainer>
  );
}
