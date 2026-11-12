import { generoDesdeCategorias, type Libro } from '../domain/libro';

/** Un libro que la app propone añadir a la lista de deseos. */
export interface Sugerencia {
  clave: string;
  titulo: string;
  autor: string;
  anio: number;
  isbn: string;
  portada?: string;
  genero?: string;
}

const TIEMPO_MAX_MS = 8000;
const CACHE = 'anaquel.sugerencias.v1';
const UN_DIA = 24 * 60 * 60 * 1000;

/** Género de la app → término de Google Books (sus categorías van en inglés). */
const MATERIA: Record<string, string> = {
  Novela: 'fiction', 'Ciencia ficción': 'science fiction', Fantasía: 'fantasy', Policiaca: 'mystery',
  Terror: 'horror', Ensayo: 'philosophy', Historia: 'history', Biografía: 'biography',
  Poesía: 'poetry', Cómic: 'comics', Clásicos: 'classics', Infantil: 'juvenile fiction',
};

/** Qué buscar «para ti»: tus 2 géneros más leídos y tus 2 autores mejor valorados. Puro. */
export function consultasParaTi(libros: readonly Libro[]): string[] {
  const propios = libros.filter((l) => !l.ejemplo && l.posesion !== 'quiero');
  const cuenta = new Map<string, number>();
  for (const l of propios) if (l.genero && MATERIA[l.genero]) cuenta.set(l.genero, (cuenta.get(l.genero) ?? 0) + 1);
  const generos = [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([g]) => `subject:"${MATERIA[g]}"`);
  const autores = [...new Set(
    propios.filter((l) => (l.valoracion ?? 0) >= 4 && l.autor).sort((a, b) => (b.valoracion ?? 0) - (a.valoracion ?? 0)).map((l) => l.autor),
  )].slice(0, 2).map((a) => `inauthor:"${a}"`);
  return [...autores, ...generos];
}

/** Quita lo que ya está en tu anaquel o en tu lista, y los repetidos. Puro. */
export function filtraConocidos(sugs: readonly Sugerencia[], libros: readonly Libro[]): Sugerencia[] {
  const norma = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const titulos = new Set(libros.filter((l) => !l.ejemplo).map((l) => norma(l.titulo)));
  const isbns = new Set(libros.map((l) => l.isbn).filter(Boolean));
  const vistos = new Set<string>();
  return sugs.filter((s) => {
    const t = norma(s.titulo);
    if (!t || titulos.has(t) || (s.isbn && isbns.has(s.isbn)) || vistos.has(t)) return false;
    vistos.add(t);
    return true;
  });
}

export function parseGoogle(json: unknown): Sugerencia[] {
  const items = (json as { items?: { id?: string; volumeInfo?: Record<string, unknown> }[] })?.items ?? [];
  return items.flatMap((it) => {
    const v = it.volumeInfo;
    if (!v || typeof v.title !== 'string') return [];
    const ids = Array.isArray(v.industryIdentifiers) ? (v.industryIdentifiers as { type: string; identifier: string }[]) : [];
    const isbn = ids.find((i) => i.type === 'ISBN_13')?.identifier ?? '';
    const autores = Array.isArray(v.authors) ? (v.authors as string[]) : [];
    const img = (v.imageLinks as { thumbnail?: string } | undefined)?.thumbnail;
    const cats = Array.isArray(v.categories) ? (v.categories as string[]) : [];
    const anio = Number.parseInt(String(v.publishedDate ?? ''), 10);
    return [{
      clave: `g:${it.id ?? v.title}`,
      titulo: v.title,
      autor: autores.join(', '),
      anio: Number.isFinite(anio) ? anio : 0,
      isbn,
      ...(img ? { portada: img.replace(/^http:/, 'https:') } : {}),
      ...(generoDesdeCategorias(cats) ? { genero: generoDesdeCategorias(cats) } : {}),
    }];
  });
}

export function parseTendencias(json: unknown): Sugerencia[] {
  const works = (json as { works?: Record<string, unknown>[] })?.works ?? [];
  return works.flatMap((w) => {
    if (typeof w.title !== 'string') return [];
    const autores = Array.isArray(w.author_name) ? (w.author_name as string[]) : [];
    const portada = typeof w.cover_i === 'number' ? `https://covers.openlibrary.org/b/id/${w.cover_i}-M.jpg` : undefined;
    return [{
      clave: `ol:${String(w.key ?? w.title)}`,
      titulo: w.title,
      autor: autores.slice(0, 2).join(', '),
      anio: typeof w.first_publish_year === 'number' ? w.first_publish_year : 0,
      isbn: '',
      ...(portada ? { portada } : {}),
    }];
  });
}

async function json(url: string, fetchFn: typeof fetch): Promise<unknown> {
  const control = new AbortController();
  const t = setTimeout(() => control.abort(), TIEMPO_MAX_MS);
  try {
    const r = await fetchFn(url, { signal: control.signal });
    return r.ok ? await r.json() : null;
  } finally { clearTimeout(t); }
}

function deCache(clave: string): Sugerencia[] | null {
  try {
    const todo = JSON.parse(localStorage.getItem(CACHE) || '{}') as Record<string, { en: number; s: Sugerencia[] }>;
    const e = todo[clave];
    return e && Date.now() - e.en < UN_DIA ? e.s : null;
  } catch { return null; }
}
function aCache(clave: string, s: Sugerencia[]) {
  try {
    const todo = JSON.parse(localStorage.getItem(CACHE) || '{}') as Record<string, unknown>;
    todo[clave] = { en: Date.now(), s };
    localStorage.setItem(CACHE, JSON.stringify(todo));
  } catch { /* sin almacenamiento: se vuelve a pedir */ }
}

/** Lo más leído esta semana en Open Library (gratis, sin clave). Se guarda un día. */
export async function tendencias(fetchFn: typeof fetch = fetch): Promise<Sugerencia[]> {
  const guardado = deCache('tendencias');
  if (guardado) return guardado;
  const s = parseTendencias(await json('https://openlibrary.org/trending/weekly.json?limit=30', fetchFn));
  if (s.length) aCache('tendencias', s);
  return s;
}

/** Libros en español de tus géneros y autores favoritos (Google Books). Se guarda un día. */
export async function paraTi(libros: readonly Libro[], fetchFn: typeof fetch = fetch): Promise<Sugerencia[]> {
  const consultas = consultasParaTi(libros);
  if (!consultas.length) return [];
  const clave = `parati:${consultas.join('|')}`;
  const guardado = deCache(clave);
  if (guardado) return guardado;
  const resultados = await Promise.all(consultas.map((q) =>
    json(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&langRestrict=es&printType=books&maxResults=10`, fetchFn)
      .then(parseGoogle).catch(() => [] as Sugerencia[])));
  // Intercala los resultados de cada consulta para que se mezclen autores y géneros.
  const mezcla: Sugerencia[] = [];
  for (let i = 0; i < 10; i++) for (const r of resultados) if (r[i]) mezcla.push(r[i]);
  if (mezcla.length) aCache(clave, mezcla);
  return mezcla;
}
