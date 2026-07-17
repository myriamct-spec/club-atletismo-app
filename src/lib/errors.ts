// Los errores de supabase-js (PostgrestError, AuthError...) no siempre son
// instancias de la clase Error nativa, así que `err instanceof Error` puede
// fallar y ocultar el mensaje real tras un texto genérico. Esto comprueba
// también la forma del objeto.
export function mensajeError(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return fallback;
}
