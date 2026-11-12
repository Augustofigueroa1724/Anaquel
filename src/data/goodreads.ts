import { generoDesdeCategorias, type Estado, type Libro } from '../domain/libro';
import { esIsbn13, isbn10a13 } from '../domain/isbn';

/** CSV según RFC 4180: comillas, comas y saltos de línea dentro de campos. */
export function parseCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = '';
  let comillas = false;
  const t = texto.replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (comillas) {
      if (c === '"' && t[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      fila.push(campo); filas.push(fila); fila = []; campo = '';
    } else campo += c;
  }
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
  return filas.filter((f) => f.some((x) => x.trim() !== ''));
}

export type LibroImportado = Omit<Libro, 'id' | 'color' | 'edicion'>;

const ESTANTES: Record<string, Estado> = { read: 'leido', 'currently-reading': 'leyendo', 'to-read': 'pendiente' };

/**
 * Exportación de Goodreads (Mis libros → Importar/exportar → Exportar biblioteca).
 * «to-read» pasa a la lista de deseos; leídos y leyendo, al anaquel.
 */
export function libroDesdeGoodreads(texto: string): LibroImportado[] {
  const [cabecera, ...filas] = parseCsv(texto);
  if (!cabecera) return [];
  const col = (nombre: string) => cabecera.findIndex((c) => c.trim().toLowerCase() === nombre.toLowerCase());
  const iTitulo = col('Title');
  if (iTitulo < 0) return [];
  const iAutor = col('Author'), iIsbn13 = col('ISBN13'), iIsbn = col('ISBN'), iNota = col('My Rating');
  const iAnioOrig = col('Original Publication Year'), iAnio = col('Year Published'), iEstante = col('Exclusive Shelf');
  const iResena = col('My Review'), iPrivadas = col('Private Notes'), iEstantes = col('Bookshelves');
  const v = (f: string[], i: number) => (i >= 0 ? (f[i] ?? '').trim() : '');
  return filas.map((f) => {
    const isbn13 = v(f, iIsbn13).replace(/\D/g, '');
    const isbn = esIsbn13(isbn13) ? isbn13 : isbn10a13(v(f, iIsbn)) ?? '';
    const estante = v(f, iEstante);
    const estado = ESTANTES[estante] ?? 'pendiente';
    const nota = Number(v(f, iNota));
    const anio = Number(v(f, iAnioOrig)) || Number(v(f, iAnio)) || 0;
    const notas = [v(f, iResena), v(f, iPrivadas)].filter(Boolean).join('\n\n').replace(/<br\s*\/?>/gi, '\n');
    const genero = generoDesdeCategorias(v(f, iEstantes).split(',').map((x) => x.trim().replace(/-/g, ' ')));
    const libro: LibroImportado = { titulo: v(f, iTitulo), autor: v(f, iAutor), anio, isbn, estado };
    if (estante === 'to-read') libro.posesion = 'quiero';
    if (nota >= 1 && nota <= 5) libro.valoracion = nota;
    if (notas) libro.notas = notas;
    if (genero) libro.genero = genero;
    return libro;
  }).filter((l) => l.titulo);
}

/** Quita los que ya están (mismo ISBN, o mismo título y autor). */
export function sinRepetidos(nuevos: LibroImportado[], existentes: readonly Libro[]): LibroImportado[] {
  const clave = (t: string, a: string) => `${t}|${a}`.toLowerCase().replace(/\s+/g, ' ').trim();
  const isbns = new Set(existentes.map((l) => l.isbn.replace(/\D/g, '')).filter(Boolean));
  const claves = new Set(existentes.map((l) => clave(l.titulo, l.autor)));
  const vistos = new Set<string>();
  return nuevos.filter((l) => {
    const k = clave(l.titulo, l.autor);
    const i = l.isbn.replace(/\D/g, '');
    if ((i && isbns.has(i)) || claves.has(k) || vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}
