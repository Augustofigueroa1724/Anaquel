/**
 * Autocompletar del alta a mano: busca por título, por autor o por los dos en Google Books
 * (primero en español) y, si no hay nada, en Open Library. Solo se manda lo que se escribe.
 */
import { generoDesdeCategorias } from '../domain/libro';

export interface Candidato {
  titulo: string;
  autor: string;
  anio: number;
  isbn: string;
  genero?: string;
  portada?: string;
}

const TIEMPO_MAX_MS = 6000;
const MAX = 6;

const limpia = (t: string) => t.replace(/["+:]/g, ' ').replace(/\s+/g, ' ').trim();
const clave = (c: Candidato) => `${c.titulo}|${c.autor}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Consulta de Google Books con lo que haya escrito en cada campo. */
export function consultaGoogle(titulo: string, autor: string): string {
  const partes = [];
  if (limpia(titulo)) partes.push(`intitle:${limpia(titulo)}`);
  if (limpia(autor)) partes.push(`inauthor:${limpia(autor)}`);
  return partes.join('+');
}

export function parseGoogleCandidatos(json: unknown): Candidato[] {
  const items = (json as { items?: { volumeInfo?: Record<string, unknown> }[] })?.items ?? [];
  const fuera: Candidato[] = [];
  for (const it of items) {
    const info = it.volumeInfo;
    if (!info || typeof info.title !== 'string') continue;
    const autores = Array.isArray(info.authors) ? info.authors.filter((a): a is string => typeof a === 'string') : [];
    if (!autores.length) continue;
    const anio = Number.parseInt(String(info.publishedDate ?? ''), 10);
    const ids = Array.isArray(info.industryIdentifiers) ? info.industryIdentifiers as { type?: string; identifier?: string }[] : [];
    const isbn = ids.find((i) => i.type === 'ISBN_13')?.identifier ?? ids.find((i) => i.type === 'ISBN_10')?.identifier ?? '';
    const cats = Array.isArray(info.categories) ? info.categories.filter((c): c is string => typeof c === 'string') : [];
    const genero = generoDesdeCategorias(cats);
    const img = (info.imageLinks as { smallThumbnail?: string; thumbnail?: string } | undefined);
    const portada = (img?.smallThumbnail ?? img?.thumbnail)?.replace(/^http:/, 'https:');
    const titulo = typeof info.subtitle === 'string' && info.title.length < 4 ? `${info.title}: ${info.subtitle}` : info.title;
    fuera.push({ titulo, autor: autores.join(', '), anio: Number.isFinite(anio) ? anio : 0, isbn, ...(genero ? { genero } : {}), ...(portada ? { portada } : {}) });
  }
  return unicos(fuera);
}

export function parseOpenLibraryCandidatos(json: unknown): Candidato[] {
  const docs = (json as { docs?: Record<string, unknown>[] })?.docs ?? [];
  const fuera: Candidato[] = [];
  for (const d of docs) {
    if (typeof d.title !== 'string') continue;
    const autores = Array.isArray(d.author_name) ? (d.author_name as unknown[]).filter((a): a is string => typeof a === 'string') : [];
    if (!autores.length) continue;
    const isbns = Array.isArray(d.isbn) ? (d.isbn as string[]) : [];
    const isbn = isbns.find((i) => i.length === 13) ?? isbns[0] ?? '';
    const anio = typeof d.first_publish_year === 'number' ? d.first_publish_year : 0;
    const portada = typeof d.cover_i === 'number' ? `https://covers.openlibrary.org/b/id/${d.cover_i}-S.jpg` : undefined;
    fuera.push({ titulo: d.title, autor: autores[0], anio, isbn, ...(portada ? { portada } : {}) });
  }
  return unicos(fuera);
}

/** Sin repetidos (el mismo título y autor en varias ediciones), quedándose con el primero. */
function unicos(cs: Candidato[]): Candidato[] {
  const vistos = new Set<string>();
  return cs.filter((c) => (vistos.has(clave(c)) ? false : (vistos.add(clave(c)), true))).slice(0, MAX);
}

async function pide(url: string, fetchFn: typeof fetch, senal?: AbortSignal): Promise<unknown> {
  const control = new AbortController();
  const t = setTimeout(() => control.abort(), TIEMPO_MAX_MS);
  senal?.addEventListener('abort', () => control.abort());
  try {
    const r = await fetchFn(url, { signal: control.signal });
    return r.ok ? await r.json() : null;
  } finally {
    clearTimeout(t);
  }
}

const cache = new Map<string, Candidato[]>();

/** Sugerencias para lo escrito (mínimo 3 letras en algún campo). Sin red devuelve []. */
export async function sugiereLibros(titulo: string, autor: string, senal?: AbortSignal, fetchFn: typeof fetch = fetch): Promise<Candidato[]> {
  const q = consultaGoogle(titulo, autor);
  if (limpia(titulo).length < 3 && limpia(autor).length < 3) return [];
  if (cache.has(q)) return cache.get(q)!;
  const base = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q).replace(/%2B/g, '+')}&printType=books&maxResults=20&fields=items(volumeInfo(title,subtitle,authors,publishedDate,industryIdentifiers,categories,imageLinks))`;
  let res: Candidato[] = [];
  try {
    res = parseGoogleCandidatos(await pide(`${base}&langRestrict=es`, fetchFn, senal));
    if (res.length < 3) res = unicos([...res, ...parseGoogleCandidatos(await pide(base, fetchFn, senal))]);
  } catch { /* sin red o cancelada: se prueba el respaldo */ }
  if (!res.length && !senal?.aborted) {
    try {
      const p = new URLSearchParams({ limit: '12', fields: 'title,author_name,first_publish_year,isbn,cover_i' });
      if (limpia(titulo)) p.set('title', limpia(titulo));
      if (limpia(autor)) p.set('author', limpia(autor));
      res = parseOpenLibraryCandidatos(await pide(`https://openlibrary.org/search.json?${p}`, fetchFn, senal));
    } catch { /* nada */ }
  }
  if (res.length) cache.set(q, res);
  return res;
}
