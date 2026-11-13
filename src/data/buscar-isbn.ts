/** Metadatos de un libro encontrados por ISBN. */
import { generoDesdeCategorias } from '../domain/libro';
import { pideTexto } from '../platform/http';

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

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const desescapa = (t: string) => t
  .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
  .replace(/&(amp|lt|gt|quot|apos);/g, (_, e: string) => ENTIDADES[e]);

/**
 * Catálogo de la Biblioteca Nacional de Francia (SRU, Dublin Core). Registra por depósito legal
 * todo lo publicado en Francia, también las novedades que Google Books y Open Library aún no tienen.
 * Título «Le pays des étés / Pierre Adrian» y autor «Adrian, Pierre (1991-....). Auteur du texte».
 */
export function parseBnf(xml: string): MetaLibro | null {
  const campo = (n: string) => [...xml.matchAll(new RegExp(`<dc:${n}[^>]*>([\\s\\S]*?)</dc:${n}>`, 'g'))].map((m) => desescapa(m[1]).trim());
  const titulo = campo('title')[0]?.split(' / ')[0].replace(/\s*\[[^\]]*\]\s*/g, ' ').replace(/\s+:\s*/, ': ').trim();
  if (!titulo) return null;
  const autores = campo('creator').map((c) => {
    const nombre = c.replace(/\s*\(.*$/, '').replace(/\.\s*[^.,]*$/, '').trim();
    const [ap, nom] = nombre.split(/,\s*/);
    return nom ? `${nom} ${ap}` : ap;
  }).filter(Boolean);
  const anio = Number.parseInt(campo('date')[0]?.match(/\d{4}/)?.[0] ?? '', 10);
  return { titulo, autor: autores.join(', ') || 'Autor desconocido', anio: Number.isFinite(anio) ? anio : 0 };
}

const urlBnf = (isbn: string) =>
  `https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&recordSchema=dublincore&maximumRecords=1&query=${encodeURIComponent(`bib.isbn all "${isbn}"`)}`;

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
  textoFn: (url: string, ms: number) => Promise<string | null> = pideTexto,
): Promise<{ estado: Busqueda; meta?: MetaLibro }> {
  let sinRed = false;
  try {
    const meta = parseGoogleBooks(await pideJson(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, fetchFn, tiempoMs));
    if (meta) return { estado: 'encontrado', meta };
  } catch {
    sinRed = true;
  }
  const bnf = async (): Promise<MetaLibro | null> => {
    try {
      const xml = await textoFn(urlBnf(isbn), tiempoMs);
      return xml ? parseBnf(xml) : null;
    } catch {
      return null;
    }
  };
  // Los ISBN franceses (978-2, 979-1) van antes a la BnF: Open Library no da el autor en este paso.
  const frances = /^97(82|91)/.test(isbn);
  if (frances) {
    const meta = await bnf();
    if (meta) return { estado: 'encontrado', meta };
  }
  try {
    const meta = parseOpenLibrary(await pideJson(`https://openlibrary.org/isbn/${isbn}.json`, fetchFn, tiempoMs));
    if (meta) return { estado: 'encontrado', meta };
  } catch {
    sinRed = true;
  }
  if (!frances) {
    const meta = await bnf();
    if (meta) return { estado: 'encontrado', meta };
  }
  return { estado: sinRed ? 'sin-red' : 'no-encontrado' };
}
