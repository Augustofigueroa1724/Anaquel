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
  return EDICIONES[(i * 2 + (i >> 2)) % 3];
}

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
