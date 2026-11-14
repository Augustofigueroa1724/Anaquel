/** Metadatos de un libro encontrados por ISBN. */
import { conClaveBooks } from '../config';
import { generoDesdeCategorias } from '../domain/libro';
import { pideTexto } from '../platform/http';

export interface MetaLibro {
  titulo: string;
  autor: string;
  anio: number;
  genero?: string;
  /** Portada real (https). */
  portada?: string;
  editorial?: string;
  paginas?: number;
}

/** URL https de la miniatura de Google Books, sin el doblez de página («edge=curl»). */
export const portadaGoogle = (url: string): string => url.replace(/^http:/, 'https:').replace(/&edge=curl/, '');

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
  const img = info.imageLinks as { thumbnail?: string; smallThumbnail?: string } | undefined;
  const portada = img?.thumbnail ?? img?.smallThumbnail;
  const editorial = typeof info.publisher === 'string' ? info.publisher : undefined;
  const paginas = typeof info.pageCount === 'number' && info.pageCount > 0 ? info.pageCount : undefined;
  return {
    ...(paginas ? { paginas } : {}),
    titulo: info.title,
    autor: autores.join(', ') || AUTOR_DESCONOCIDO,
    anio: Number.isFinite(anio) ? anio : 0,
    ...(genero ? { genero } : {}),
    ...(portada ? { portada: portadaGoogle(portada) } : {}),
    ...(editorial ? { editorial } : {}),
  };
}

export const AUTOR_DESCONOCIDO = 'Autor desconocido';
const conAutor = (m: MetaLibro | null): m is MetaLibro => !!m && m.autor !== AUTOR_DESCONOCIDO;

/**
 * Open Library. Admite la API de libros con datos (`/api/books?jscmd=data`, que trae los nombres de
 * los autores en la misma respuesta) y, por compatibilidad, la ficha simple `/isbn/X.json` (sin autor).
 */
export function parseOpenLibrary(json: unknown): MetaLibro | null {
  const raiz = json as Record<string, unknown> | null;
  const clave = raiz && Object.keys(raiz).find((k) => k.startsWith('ISBN:'));
  const libro = (clave ? raiz![clave] : raiz) as { title?: unknown; publish_date?: unknown; authors?: { name?: unknown }[]; subjects?: ({ name?: unknown } | string)[];
    cover?: { large?: unknown; medium?: unknown }; publishers?: ({ name?: unknown } | string)[]; number_of_pages?: unknown } | null;
  if (typeof libro?.title !== 'string') return null;
  const anio = Number.parseInt(String(libro.publish_date ?? '').match(/\d{4}/)?.[0] ?? '', 10);
  const autores = Array.isArray(libro.authors) ? libro.authors.map((a) => a?.name).filter((n): n is string => typeof n === 'string') : [];
  const temas = Array.isArray(libro.subjects) ? libro.subjects.map((t) => (typeof t === 'string' ? t : t?.name)).filter((t): t is string => typeof t === 'string') : [];
  const genero = generoDesdeCategorias(temas);
  const portada = [libro.cover?.large, libro.cover?.medium].find((u): u is string => typeof u === 'string');
  const ed = Array.isArray(libro.publishers) ? libro.publishers.map((p) => (typeof p === 'string' ? p : p?.name)).find((n): n is string => typeof n === 'string') : undefined;
  return {
    titulo: libro.title, autor: autores.join(', ') || AUTOR_DESCONOCIDO, anio: Number.isFinite(anio) ? anio : 0,
    ...(genero ? { genero } : {}), ...(portada ? { portada: portada.replace(/^http:/, 'https:') } : {}), ...(ed ? { editorial: ed } : {}),
    ...(typeof libro.number_of_pages === 'number' && libro.number_of_pages > 0 ? { paginas: libro.number_of_pages } : {}),
  };
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
  const genero = generoDesdeCategorias([...campo('subject'), ...campo('type').filter((t) => !/texte|text/i.test(t))]);
  const editorial = campo('publisher')[0]?.split(':').pop()?.trim();
  const paginas = Number.parseInt(campo('format').join(' ').match(/(\d+)\s*p\./)?.[1] ?? '', 10);
  return {
    titulo, autor: autores.join(', ') || AUTOR_DESCONOCIDO, anio: Number.isFinite(anio) ? anio : 0,
    ...(genero ? { genero } : {}), ...(editorial ? { editorial } : {}), ...(paginas > 0 ? { paginas } : {}),
  };
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
  let sinAutor = null as MetaLibro | null;
  const google = async () => {
    try {
      return parseGoogleBooks(await pideJson(conClaveBooks(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`), fetchFn, tiempoMs));
    } catch { sinRed = true; return null; }
  };
  const openLibrary = async () => {
    try {
      return parseOpenLibrary(await pideJson(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`, fetchFn, tiempoMs));
    } catch { sinRed = true; return null; }
  };
  const bnf = async () => {
    try {
      const xml = await textoFn(urlBnf(isbn), tiempoMs);
      return xml ? parseBnf(xml) : null;
    } catch { return null; }
  };
  // Los ISBN franceses (978-2, 979-1) van antes a la BnF. Se para en la primera fuente que da autor;
  // si ninguna lo da, se queda el primer título encontrado (y el autor se puede escribir en la ficha).
  const fuentes = /^97(82|91)/.test(isbn) ? [google, bnf, openLibrary] : [google, openLibrary, bnf];
  let encontrado = null as MetaLibro | null;
  // Lo que falta en la fuente principal (género, portada, editorial) se toma de las demás.
  const completa = (base: MetaLibro, otra: MetaLibro | null): MetaLibro => ({
    ...base,
    ...(base.genero || !otra?.genero ? {} : { genero: otra.genero }),
    ...(base.portada || !otra?.portada ? {} : { portada: otra.portada }),
    ...(base.editorial || !otra?.editorial ? {} : { editorial: otra.editorial }),
    ...(base.paginas || !otra?.paginas ? {} : { paginas: otra.paginas }),
  });
  for (const fuente of fuentes) {
    const meta = await fuente();
    if (!meta) continue;
    if (!encontrado && conAutor(meta)) encontrado = completa({ ...meta, ...(sinAutor ? { titulo: sinAutor.titulo } : {}) }, sinAutor);
    else if (!sinAutor) sinAutor = meta;
    else sinAutor = completa(sinAutor, meta);
    if (encontrado) encontrado = completa(encontrado, meta);
    if (encontrado?.genero && encontrado.portada) break;
  }
  if (encontrado) return { estado: 'encontrado', meta: encontrado };
  if (sinAutor) return { estado: 'encontrado', meta: sinAutor };
  return { estado: sinRed ? 'sin-red' : 'no-encontrado' };
}
