const ANCHO = 220;
const ALTO = 44;
const PADDING = 6;

export function Sparkline({ valores }: { valores: number[] }) {
  if (valores.length < 2) return null;

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;

  const puntos = valores.map((v, i) => {
    const x = PADDING + (i / (valores.length - 1)) * (ANCHO - PADDING * 2);
    const y = ALTO - PADDING - ((v - min) / rango) * (ALTO - PADDING * 2);
    return { x, y };
  });

  const linea = puntos.map((p) => `${p.x},${p.y}`).join(" ");
  const ultimo = puntos[puntos.length - 1];

  return (
    <svg width={ANCHO} height={ALTO} viewBox={`0 0 ${ANCHO} ${ALTO}`} className="overflow-visible">
      <line x1={PADDING} y1={ALTO - PADDING} x2={ANCHO - PADDING} y2={ALTO - PADDING} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
      <polyline points={linea} fill="none" stroke="#1E3E7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ultimo.x} cy={ultimo.y} r="3" fill="#F5B800" />
    </svg>
  );
}
