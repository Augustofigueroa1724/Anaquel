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
  /** Libro de muestra: se ve hasta que el usuario añade el primero suyo y nunca se sube a la cuenta. */
  ejemplo?: true;
  /** Portada real (URL de Google Books u Open Library). Sin ella se dibuja la generada. */
  portada?: string;
  /** Editorial, si la fuente la da: ayuda a reconocer la colección del lomo. */
  editorial?: string;
  /** Ya se buscó portada para este libro (para no repetir la búsqueda en cada arranque). */
  portadaBuscada?: true;
  /** Color dominante de la portada: tiñe el lomo cuando no hay colección reconocida. */
  colorPortada?: string;
  /** Número de páginas: da el grosor del lomo. */
  paginas?: number;
  /** Ya se buscaron las páginas (para no repetir la búsqueda). */
  paginasBuscadas?: true;
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

/** Grosor del lomo por páginas: 26 px (lo mínimo para leer el título) hasta 150 páginas y 60 px como mucho. */
export const anchoPorPaginas = (paginas: number): number => Math.round(Math.min(60, Math.max(26, 26 + (paginas - 150) * 0.06)));

/** Grosor del lomo de un libro: por sus páginas si se saben; si no, el de siempre. */
export const anchoLomoDe = (l: Pick<Libro, 'id'> & { paginas?: number }): number =>
  (l.paginas && l.paginas > 0 ? anchoPorPaginas(l.paginas) : anchoLomo(l.id));
/** Alto del lomo: entre 172 y 220 px, para que quepan los títulos y el grosor se lea en proporción; la balda mide 300 px para que las pestañas de los separadores quepan encima. */
export const altoLomo = (id: number): number => 172 + (id % 5) * 12;

/** Tope del alto de un lomo: lo que cabe en la balda (336 px) bajo las pestañas de los separadores. */
export const ALTO_MAX_LOMO = 250;

/**
 * Alto del lomo según su texto: el que hace falta para que autor y título se lean enteros, nunca
 * menos que el de base (variedad) ni más que el tope. Si ni con el tope cabe, `escala` (< 1) dice
 * cuánto encoger la letra, hasta 0,78; por debajo de eso el título se corta con puntos.
 */
export function altoLomoDe(id: number, texto: number, fijo: number): { alto: number; escala: number } {
  const alto = Math.min(ALTO_MAX_LOMO, Math.max(altoLomo(id), Math.ceil(texto + fijo)));
  const hueco = alto - fijo;
  return { alto, escala: texto > hueco ? Math.max(0.78, hueco / texto) : 1 };
}

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
export function agrupaPorGenero(libros: readonly Libro[], orden: readonly string[] = []): { genero: string; libros: Libro[] }[] {
  const grupos = new Map<string, Libro[]>();
  for (const l of libros) {
    const g = generoDe(l);
    grupos.set(g, [...(grupos.get(g) ?? []), l]);
  }
  const base = [...grupos.entries()]
    .map(([genero, ls]) => ({ genero, libros: ls }))
    .sort((a, b) => {
      if (a.genero === SIN_GENERO) return 1;
      if (b.genero === SIN_GENERO) return -1;
      return b.libros.length - a.libros.length || a.genero.localeCompare(b.genero, 'es');
    });
  return ordenaPorPreferencia(base, orden);
}

/**
 * Orden de las baldas elegido por el usuario: los géneros de `orden` van primero y en ese orden;
 * los demás (géneros nuevos que aún no ha colocado) siguen detrás con el orden por defecto.
 */
export function ordenaPorPreferencia<T extends { genero: string }>(grupos: readonly T[], orden: readonly string[]): T[] {
  const pos = new Map(orden.map((g, i) => [g.toLowerCase(), i]));
  const fijos = grupos.filter((g) => pos.has(g.genero.toLowerCase()))
    .sort((a, b) => pos.get(a.genero.toLowerCase())! - pos.get(b.genero.toLowerCase())!);
  return [...fijos, ...grupos.filter((g) => !pos.has(g.genero.toLowerCase()))];
}

/** Traduce las categorías de Google Books (en inglés) a un género de la app. */
export function generoDesdeCategorias(categorias: readonly string[]): string | undefined {
  const texto = categorias.join(' / ').toLowerCase();
  const tabla: [RegExp, string][] = [
    [/science fiction|sci-fi|scifi|ciencia ficci|science-fiction/, 'Ciencia ficción'],
    [/fantasy|fantas[ií]a|fantastique/, 'Fantasía'],
    [/horror|terror|[ée]pouvante/, 'Terror'],
    [/mystery|detective|crime|thriller|polic[ií]a|policier|roman noir|novela negra/, 'Policiaca'],
    [/comics|graphic novel|bandes? dessin|c[óo]mic/, 'Cómic'],
    [/juvenile|jeunesse|infantil|children/, 'Infantil'],
    [/poetry|po[ée]sie|poes[ií]a/, 'Poesía'],
    [/biography|autobiography|biograf|m[ée]moires|memoirs/, 'Biografía'],
    [/history|histoire|historia/, 'Historia'],
    [/philosophy|philosophie|filosof|social science|science|psychology|political|business|economics|essai|ensayo|essays/, 'Ensayo'],
    [/classics|classiques|cl[áa]sicos/, 'Clásicos'],
    [/fiction|novel|roman|novela|literature|litt[ée]rature|literatura|drama|th[ée][âa]tre|teatro/, 'Novela'],
  ];
  return tabla.find(([re]) => re.test(texto))?.[1];
}

const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'van', 'von', 'da', 'di', 'le', 'du']);
const sinTildes = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Apellido del autor: sin iniciales ni partículas, con tres palabras o más el segundo
 * (García Márquez, Vargas Llosa: el primer apellido) y con dos, el último.
 */
export function apellido(autor: string): string {
  const p = autor.trim().split(/\s+/).filter((t) => t && !/^\p{L}\.?$/u.test(t) && !t.endsWith('.') && !PARTICULAS.has(t.toLowerCase()));
  if (p.length === 0) return autor.trim();
  return p.length >= 3 ? p[1] : p[p.length - 1];
}

/** Clave para ordenar por apellido, sin tildes ni mayúsculas. */
export const claveAutor = (autor: string): string => sinTildes(apellido(autor));

/** Nombre para la pestaña: solo el primer apellido («García», «Murakami»), que siempre cabe. */
const nombrePestana = (autor: string): string => apellido(autor);

export type Seccion = { tipo: 'autor' | 'letra'; etiqueta: string; libros: Libro[] };

/** La pestaña del autor sale siempre; la de la letra, solo si agrupa más de 2 libros. */
export const conPestana = (s: Seccion): boolean => s.tipo === 'autor' || s.libros.length > 2;

/**
 * Separadores dentro de una balda: un autor con más de un libro tiene su pestaña con el nombre;
 * los autores con un solo libro se juntan bajo la letra de su apellido. Todo en orden alfabético
 * por apellido (la letra va antes que los autores que empiezan por ella).
 */
export function seccionesPorAutor(libros: readonly Libro[]): Seccion[] {
  const porAutor = new Map<string, Libro[]>();
  for (const l of libros) {
    const k = l.autor.trim().toLowerCase() || '?';
    porAutor.set(k, [...(porAutor.get(k) ?? []), l]);
  }
  const grupos = new Map<string, { orden: string; s: Seccion }>();
  for (const ls of porAutor.values()) {
    const autor = ls[0].autor.trim();
    const clave = claveAutor(autor) || '#';
    ls.sort((a, b) => (a.anio || 0) - (b.anio || 0) || a.titulo.localeCompare(b.titulo, 'es'));
    if (ls.length > 1) {
      const etiqueta = nombrePestana(autor);
      grupos.set(`a:${autor.toLowerCase()}`, { orden: `${clave} 1${sinTildes(autor)}`, s: { tipo: 'autor', etiqueta, libros: ls } });
    } else {
      const letra = /[a-zñ]/.test(clave[0]) ? clave[0].toUpperCase() : '#';
      const g = grupos.get(`l:${letra}`) ?? { orden: `${letra.toLowerCase()} 0`, s: { tipo: 'letra', etiqueta: letra, libros: [] } };
      g.s.libros.push(ls[0]);
      grupos.set(`l:${letra}`, g);
    }
  }
  for (const g of grupos.values()) {
    if (g.s.tipo === 'letra') g.s.libros.sort((a, b) => claveAutor(a.autor).localeCompare(claveAutor(b.autor), 'es'));
  }
  return [...grupos.values()].sort((a, b) => a.orden.localeCompare(b.orden, 'es')).map((g) => g.s);
}

/**
 * Colecciones reconocibles por el ISBN o la editorial, con lomo propio en la estantería.
 * Gallimard (978-2-07): los ISBN 2-07-03… y 2-07-04… son los de bolsillo Folio; el resto, la Blanche NRF.
 */
export type Coleccion = 'folio' | 'blanche' | 'albin';
export const COLOR_COLECCION: Record<Coleccion, string> = { folio: '#f7f6f2', blanche: '#efe6cf', albin: '#ebe7de' };

export function coleccionDe(l: Pick<Libro, 'isbn'> & { editorial?: string }): Coleccion | undefined {
  const isbn = (l.isbn || '').replace(/[^0-9X]/gi, '');
  const ed = (l.editorial || '').toLowerCase();
  const trece = isbn.length === 10 ? `978${isbn}` : isbn;
  if (/folio/.test(ed) || /^9782070[34]/.test(trece)) return 'folio';
  if (/^978207/.test(trece) || /gallimard/.test(ed)) return 'blanche';
  if (/^9782226/.test(trece) || /albin michel/.test(ed)) return 'albin';
  return undefined;
}

/** Color del lomo: el de su colección, el de su portada o la tela asignada. */
export function colorLomo(l: Pick<Libro, 'isbn' | 'color'> & { editorial?: string; colorPortada?: string }): string {
  const col = coleccionDe(l);
  return col ? COLOR_COLECCION[col] : l.colorPortada ?? l.color;
}
