const DIACRITICOS = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, "g");

export function normalizarClave(clave: string): string {
  return clave
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .replace(/[^a-z0-9]/g, "");
}

export function parseFechaExcel(valor: unknown): string | null {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return valor.toISOString().slice(0, 10);
  }
  if (typeof valor === "string") {
    const texto = valor.trim();
    const conBarras = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (conBarras) {
      const [, d, m, y] = conBarras;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    const isoDirecto = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoDirecto) return texto;
  }
  return null;
}
