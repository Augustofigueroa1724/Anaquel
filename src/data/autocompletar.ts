/**
 * Autocompletar del alta a mano: busca por título, por autor o por los dos en Google Books
 * (primero en español) y, si no hay nada, en Open Library. Solo se manda lo que se escribe.
 */
import { conClaveBooks } from '../config';
import { generoDesdeCategorias } from '../domain/libro';

export interface Candidato {
  titulo: string;
  autor: string;
  anio: number;
  isbn: string;
  genero?: string;
  portada?: string;
  /** Idioma de la edición (código de Google Books), para poner primero lo que está en español. */
  idioma?: string;
  editorial?: string;
}

const TIEMPO_MAX_MS = 6000;
const MAX = 6;

const limpia = (t: string) => t.replace(/["+:]/g, ' ').replace(/\s+/g, ' ').trim();
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const clave = (c: Candidato) => norm(`${c.titulo}|${c.autor}`);

/**
 * Lo bien que un candidato casa con lo escrito: la parte de las palabras escritas (sin tildes)
 * que aparecen en su título y autor. Las ediciones en español desempatan.
 */
export function afinidad(c: Candidato, titulo: string, autor: string): number {
  const texto = norm(`${c.titulo} ${c.autor}`);
  const palabras = norm(`${titulo} ${autor}`).split(/[^a-z0-9ñ]+/).filter((w) => w.length >= 2);
  if (!palabras.length) return 0;
  const dentro = palabras.filter((w) => texto.includes(w)).length / palabras.length;
  return dentro + (c.idioma === 'es' ? 0.05 : 0);
}

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
    const portada = (img?.thumbnail ?? img?.smallThumbnail)?.replace(/^http:/, 'https:').replace(/&edge=curl/, '');
    const titulo = typeof info.subtitle === 'string' && info.title.length < 4 ? `${info.title}: ${info.subtitle}` : info.title;
    const idioma = typeof info.language === 'string' ? info.language : undefined;
    const editorial = typeof info.publisher === 'string' ? info.publisher : undefined;
    fuera.push({ titulo, autor: autores.join(', '), anio: Number.isFinite(anio) ? anio : 0, isbn, ...(genero ? { genero } : {}), ...(portada ? { portada } : {}), ...(idioma ? { idioma } : {}), ...(editorial ? { editorial } : {}) });
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
    const portada = typeof d.cover_i === 'number' ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : undefined;
    fuera.push({ titulo: d.title, autor: autores[0], anio, isbn, ...(portada ? { portada } : {}) });
  }
  return unicos(fuera);
}

/** Sin repetidos (el mismo título y autor en varias ediciones), quedándose con el primero. */
function unicos(cs: Candidato[], max = MAX): Candidato[] {
  const vistos = new Set<string>();
  return cs.filter((c) => (vistos.has(clave(c)) ? false : (vistos.add(clave(c)), true))).slice(0, max);
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

/**
 * Sugerencias para lo escrito (mínimo 3 letras en algún campo). Pregunta a la vez a Google Books
 * (por campos y en texto libre, en cualquier idioma) y a Open Library, junta lo que llegue y lo
 * ordena por afinidad con lo escrito: así un libro en francés o recién publicado no queda tapado
 * por resultados que no tienen nada que ver. Sin red devuelve [].
 */
export async function sugiereLibros(titulo: string, autor: string, senal?: AbortSignal, fetchFn: typeof fetch = fetch): Promise<Candidato[]> {
  const q = consultaGoogle(titulo, autor);
  if (limpia(titulo).length < 3 && limpia(autor).length < 3) return [];
  if (cache.has(q)) return cache.get(q)!;
  const campos = '&printType=books&maxResults=20&fields=items(volumeInfo(title,subtitle,authors,publishedDate,industryIdentifiers,categories,imageLinks,language,publisher))';
  const libre = [limpia(titulo), limpia(autor)].filter(Boolean).join(' ');
  const google = (consulta: string) => pide(conClaveBooks(`https://www.googleapis.com/books/v1/volumes?q=${consulta}${campos}`), fetchFn, senal)
    .then(parseGoogleCandidatos, () => [] as Candidato[]);
  const ol = new URLSearchParams({ q: libre, limit: '12', fields: 'title,author_name,first_publish_year,isbn,cover_i' });
  const [porCampos, enLibre, openLibrary] = await Promise.all([
    google(encodeURIComponent(q).replace(/%2B/g, '+')),
    google(encodeURIComponent(libre)),
    pide(`https://openlibrary.org/search.json?${ol}`, fetchFn, senal).then(parseOpenLibraryCandidatos, () => [] as Candidato[]),
  ]);
  const todos = unicos([...porCampos, ...enLibre, ...openLibrary], 60)
    .map((c, i) => ({ c, a: afinidad(c, titulo, autor), i }))
    .filter((x) => x.a >= 0.5)
    .sort((x, y) => y.a - x.a || x.i - y.i)
    .map((x) => x.c);
  const res = todos.slice(0, MAX);
  if (res.length) cache.set(q, res);
  return res;
}
