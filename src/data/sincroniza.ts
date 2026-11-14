import type { Libro } from '../domain/libro';
import { supabase } from '../platform/cuenta';

/** Libros del usuario con sesión, desde Supabase (tabla aq_libros). */
export async function descargaLibros(): Promise<Libro[]> {
  const { data, error } = await supabase.from('aq_libros').select('id, datos').order('id');
  if (error) throw error;
  return (data ?? []).map((f: { id: number; datos: Libro }) => ({ ...f.datos, id: Number(f.id) }));
}

/** Qué hay que subir y qué borrar para pasar de `antes` a `ahora`. Puro: se prueba sin red. */
export function diferencias(antes: readonly Libro[], ahora: readonly Libro[]): { cambiados: Libro[]; borrados: number[] } {
  const previos = new Map(antes.map((l) => [l.id, JSON.stringify(l)]));
  const actuales = new Set(ahora.map((l) => l.id));
  return {
    cambiados: ahora.filter((l) => previos.get(l.id) !== JSON.stringify(l)),
    borrados: antes.filter((l) => !actuales.has(l.id)).map((l) => l.id),
  };
}

/** Sube los cambios. El usuario lo pone la base de datos (auth.uid()). */
export async function subeCambios(antes: readonly Libro[], ahora: readonly Libro[]): Promise<void> {
  const { cambiados, borrados } = diferencias(antes, ahora);
  if (cambiados.length) {
    const filas = cambiados.map((l) => ({ id: l.id, datos: l, actualizado: new Date().toISOString() }));
    const { error } = await supabase.from('aq_libros').upsert(filas, { onConflict: 'user_id,id' });
    if (error) throw error;
  }
  if (borrados.length) {
    const { error } = await supabase.from('aq_libros').delete().in('id', borrados);
    if (error) throw error;
  }
}

/**
 * Libros que solo están en este móvil y hay que subir al entrar en la cuenta. Los que este móvil
 * ya había sincronizado (`conocidos`) y ya no están en el servidor se borraron desde otro
 * dispositivo: no se vuelven a subir (antes reaparecían). Sin registro de sincronizados, solo se
 * suman los locales en un inicio de sesión nuevo (libros apuntados antes de tener cuenta); al
 * reanudar una sesión, lo local es una copia de la cuenta y manda el servidor.
 */
export function soloDeEsteMovil(
  locales: readonly Libro[], remotos: readonly Libro[], conocidos: ReadonlySet<number> | null, loginNuevo: boolean,
): Libro[] {
  const ids = new Set(remotos.map((l) => l.id));
  const isbns = new Set(remotos.map((l) => l.isbn).filter(Boolean));
  return locales
    .filter((l) => !ids.has(l.id) && !(l.isbn && isbns.has(l.isbn)))
    .filter((l) => (conocidos ? !conocidos.has(l.id) : loginNuevo));
}
