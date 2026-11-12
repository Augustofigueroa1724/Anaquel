/** Metadatos de un libro encontrados por ISBN. */
import { generoDesdeCategorias } from '../domain/libro';

export interface MetaLibro {
  titulo: string;
  autor: string;
  anio: number;
  genero?: string;
}

export type Busqueda = 'buscando' | 'encontrado' | 'no-encontrado' | 'sin-red';

const TIEMPO_MAX_MS = 8000;

/** Google Books: responde con CORS, así que funciona en la web y en la app. */
export function parseGoogleBooks(json: unknown): MetaLibro | null {
  const items = (json as { items?: { volumeInfo?: Record<string, unknown> }[] })?.items;
  const info = items?.[0]?.volumeInfo;
  if (!info || typeof info.title !== 'string') return null;
  const autores = Array.isArray(info.authors) ? info.authors.filter((a): a is string => typeof a === 'string') : [];
  const anio = Number.parseInt(String(info.publishedDate ?? ''), 10);
  const categorias = Array.isArray(info.categories) ? info.categories.filter((c): c is string => typeof c === 'string') : [];
  const genero = generoDesdeCategorias(categorias);
  return {
    titulo: info.title,
    autor: autores.join(', ') || 'Autor desconocido',
    anio: Number.isFinite(anio) ? anio : 0,
    ...(genero ? { genero } : {}),
  };
}

/** Open Library: respaldo. Sin autor en este paso (exigiría una segunda consulta). */
export function parseOpenLibrary(json: unknown): MetaLibro | null {
  const libro = json as { title?: unknown; publish_date?: unknown };
  if (typeof libro?.title !== 'string') return null;
  const anio = Number.parseInt(String(libro.publish_date ?? '').match(/\d{4}/)?.[0] ?? '', 10);
  return { titulo: libro.title, autor: 'Autor desconocido', anio: Number.isFinite(anio) ? anio : 0 };
}

async function pideJson(url: string, fetchFn: typeof fetch, tiempoMs: number): Promise<unknown> {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), tiempoMs);
  try {
    const r = await fetchFn(url, { signal: control.signal });
    if (!r.ok) return null;
    return await r.json();
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Busca un ISBN: primero Google Books, después Open Library. Nunca se queda colgado:
 * cada petición tiene tope de tiempo. Sin red o sin resultado devuelve el estado.
 */
export async function buscarPorIsbn(
  isbn: string,
  fetchFn: typeof fetch = fetch,
  tiempoMs = TIEMPO_MAX_MS,
): Promise<{ estado: Busqueda; meta?: MetaLibro }> {
  let sinRed = false;
  try {
    const meta = parseGoogleBooks(await pideJson(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, fetchFn, tiempoMs));
    if (meta) return { estado: 'encontrado', meta };
  } catch {
    sinRed = true;
  }
  try {
    const meta = parseOpenLibrary(await pideJson(`https://openlibrary.org/isbn/${isbn}.json`, fetchFn, tiempoMs));
    if (meta) return { estado: 'encontrado', meta };
  } catch {
    sinRed = true;
  }
  return { estado: sinRed ? 'sin-red' : 'no-encontrado' };
}
