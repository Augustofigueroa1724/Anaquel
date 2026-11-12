export type Estado = 'leido' | 'leyendo' | 'pendiente';
export type Filtro = 'todos' | Estado;
export type Edicion = 'clasico' | 'moderno' | 'condensado';

export interface Libro {
  id: number;
  titulo: string;
  autor: string;
  anio: number;
  isbn: string;
  estado: Estado;
  color: string;
  edicion: Edicion;
  /** Préstamo activo: a quién y desde qué día (AAAA-MM-DD). Ausente si el libro está en casa. */
  prestamo?: { a: string; desde: string };
  /** Género o categoría: cada uno ocupa sus propias baldas. */
  genero?: string;
  /** Notas o comentarios del lector. */
  notas?: string;
  /** «quiero» = lista de deseos (aún no lo tiene). Sin valor = lo tiene. */
  posesion?: 'tengo' | 'quiero';
  /** Valoración de 1 a 5. */
  valoracion?: number;
}

export const ESTADOS: readonly Estado[] = ['leido', 'leyendo', 'pendiente'];

export const ETIQUETA: Record<Estado, string> = {
  leido: 'Leído',
  leyendo: 'Leyendo',
  pendiente: 'Pendiente',
};

export const FILTROS: readonly { id: Filtro; texto: string }[] = [
  { id: 'todos', texto: 'Todos' },
  { id: 'leyendo', texto: 'Leyendo' },
  { id: 'pendiente', texto: 'Pendientes' },
  { id: 'leido', texto: 'Leídos' },
];

/** Telas de lomo (paleta del diseño «Nogal y latón»). */
export const COLORES_TELA: readonly string[] = [
  '#6e2a26', '#1f2d47', '#b8913f', '#4f3348', '#e6dcc6', '#a14f2c',
  '#2b4a52', '#252424', '#c9b08a', '#5a1f2c', '#39463b', '#d9cfb9',
];

const EDICIONES: readonly Edicion[] = ['clasico', 'moderno', 'condensado'];

/** Reparte las tres ediciones de forma estable según el id. */
export function edicionDe(i: number): Edicion {
  // Math.floor en vez de >> para que los ids grandes (Date.now) no se vuelvan negativos.
  return EDICIONES[(((i * 2 + Math.floor(i / 4)) % 3) + 3) % 3];
}

export const esDeseo = (l: Libro): boolean => l.posesion === 'quiero';
/** Los libros que se ven en el anaquel (los de la lista de deseos van aparte). */
export const delAnaquel = (libros: readonly Libro[]): Libro[] => libros.filter((l) => !esDeseo(l));
/** Id para un libro nuevo: único entre dispositivos sin tener que preguntar al servidor. */
export const nuevoId = (desplazamiento = 0): number => Date.now() * 100 + desplazamiento + Math.floor(Math.random() * 100);

/** Luminancia relativa (WCAG) de un color #rrggbb. */
export function luminancia(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Tinta del título y filete dorado según la tela del lomo. */
export function tintaPara(color: string): { tinta: string; oro: string } {
  return luminancia(color) > 0.3
    ? { tinta: '#221a14', oro: 'rgba(34,26,20,.5)' }
    : { tinta: '#f4ecdc', oro: 'rgba(222,186,112,.8)' };
}

export function filtrar(libros: readonly Libro[], filtro: Filtro): Libro[] {
  return filtro === 'todos' ? [...libros] : libros.filter((l) => l.estado === filtro);
}

export function contar(libros: readonly Libro[]): Record<Filtro, number> {
  const c: Record<Filtro, number> = { todos: libros.length, leido: 0, leyendo: 0, pendiente: 0 };
  for (const l of libros) c[l.estado] += 1;
  return c;
}

export const anchoLomo = (id: number): number => 26 + ((id * 7) % 4) * 3;
export const altoLomo = (id: number): number => 124 + (id % 5) * 10;

/** Llena las baldas por ancho: un lomo nuevo pasa a la balda siguiente si no cabe. */
export function repartePorBaldas(libros: readonly Libro[], util: number, separacion = 2): Libro[][] {
  const baldas: Libro[][] = [];
  let actual: Libro[] = [];
  let ocupado = 0;
  for (const l of libros) {
    const w = anchoLomo(l.id);
    if (actual.length > 0 && ocupado + w > util) {
      baldas.push(actual);
      actual = [];
      ocupado = 0;
    }
    actual.push(l);
    ocupado += w + separacion;
  }
  if (actual.length > 0) baldas.push(actual);
  return baldas;
}

/** Candidato a partir de un ISBN leído, sin datos todavía (la búsqueda por ISBN llega después). */
export function candidatoDesdeIsbn(isbn: string): Omit<Libro, 'id' | 'color' | 'edicion'> {
  return { titulo: 'Libro sin identificar', autor: 'Datos pendientes', anio: 0, isbn, estado: 'pendiente' };
}

export interface DatosLibro {
  titulo: string;
  autor: string;
  anio: number;
  isbn: string;
  estado: Estado;
  genero: string;
}

/** Valida lo que escribe el usuario. Devuelve el mensaje de error o null si está bien. */
export function validaDatos(d: DatosLibro): string | null {
  if (!d.titulo.trim()) return 'Escribe el título del libro.';
  if (!Number.isInteger(d.anio) || d.anio < 0 || d.anio > new Date().getFullYear() + 1) {
    return 'El año no es válido.';
  }
  return null;
}

/** Nombre de la persona a quien se presta. Devuelve el mensaje de error o null. */
export function validaPrestamo(nombre: string): string | null {
  return nombre.trim() ? null : 'Escribe a quién prestas el libro.';
}

/** Fecha de hoy en formato AAAA-MM-DD (hora local). */
export function hoyIso(fecha: Date = new Date()): string {
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${m}-${d}`;
}

/** AAAA-MM-DD → «9 nov 2026» (texto en español). */
export function formateaFecha(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || !d) return iso;
  return new Date(a, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const SIN_GENERO = 'Sin género';

/** Sugerencias al escribir el género (el usuario puede poner cualquiera). */
export const GENEROS_BASE: readonly string[] = [
  'Novela', 'Clásicos', 'Ciencia ficción', 'Fantasía', 'Policiaca', 'Terror', 'Ensayo',
  'Historia', 'Biografía', 'Poesía', 'Cómic', 'Infantil',
];

export const generoDe = (l: Libro): string => l.genero?.trim() || SIN_GENERO;

/** Agrupa por género: los más numerosos primero, «Sin género» al final. */
export function agrupaPorGenero(libros: readonly Libro[]): { genero: string; libros: Libro[] }[] {
  const grupos = new Map<string, Libro[]>();
  for (const l of libros) {
    const g = generoDe(l);
    grupos.set(g, [...(grupos.get(g) ?? []), l]);
  }
  return [...grupos.entries()]
    .map(([genero, ls]) => ({ genero, libros: ls }))
    .sort((a, b) => {
      if (a.genero === SIN_GENERO) return 1;
      if (b.genero === SIN_GENERO) return -1;
      return b.libros.length - a.libros.length || a.genero.localeCompare(b.genero, 'es');
    });
}

/** Traduce las categorías de Google Books (en inglés) a un género de la app. */
export function generoDesdeCategorias(categorias: readonly string[]): string | undefined {
  const texto = categorias.join(' / ').toLowerCase();
  const tabla: [RegExp, string][] = [
    [/science fiction|sci-fi|scifi/, 'Ciencia ficción'],
    [/fantasy/, 'Fantasía'],
    [/horror/, 'Terror'],
    [/mystery|detective|crime|thriller/, 'Policiaca'],
    [/comics|graphic novel/, 'Cómic'],
    [/juvenile/, 'Infantil'],
    [/poetry/, 'Poesía'],
    [/biography|autobiography/, 'Biografía'],
    [/history/, 'Historia'],
    [/philosophy|social science|science|psychology|political|business|economics/, 'Ensayo'],
    [/classics/, 'Clásicos'],
    [/fiction/, 'Novela'],
  ];
  return tabla.find(([re]) => re.test(texto))?.[1];
}
