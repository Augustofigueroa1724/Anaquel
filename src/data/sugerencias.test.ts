import { describe, expect, it } from 'vitest';
import { consultasParaTi, filtraConocidos, imprescindibles, parseGoogle, type Sugerencia } from './sugerencias';
import { COLORES_TELA, type Libro } from '../domain/libro';

const l = (o: Partial<Libro>): Libro => ({
  id: Math.random(), titulo: 'T', autor: 'A', anio: 2000, isbn: '', estado: 'leido', color: COLORES_TELA[0], edicion: 'clasico', ...o,
});

describe('consultasParaTi', () => {
  it('busca otros libros de tus autores mejor valorados', () => {
    const libros = [l({ autor: 'Ursula K. Le Guin', valoracion: 5 }), l({ autor: 'Otro', valoracion: 2 })];
    expect(consultasParaTi(libros)).toEqual(['inauthor:"Ursula K. Le Guin"']);
  });
  it('ignora los libros de ejemplo y la lista de deseos', () => {
    expect(consultasParaTi([l({ autor: 'A', valoracion: 5, ejemplo: true }), l({ autor: 'B', valoracion: 5, posesion: 'quiero' })])).toEqual([]);
  });
});

describe('filtraConocidos', () => {
  it('quita lo que ya tienes (sin distinguir mayúsculas ni signos) y los repetidos', () => {
    const s: Sugerencia[] = [
      { clave: '1', titulo: 'Dune', autor: '', anio: 0, isbn: '' },
      { clave: '2', titulo: 'El hobbit', autor: '', anio: 0, isbn: '' },
      { clave: '3', titulo: 'El Hobbit.', autor: '', anio: 0, isbn: '' },
    ];
    expect(filtraConocidos(s, [l({ titulo: 'DUNE' })]).map((x) => x.clave)).toEqual(['2']);
  });
});

describe('parsers', () => {
  it('Google Books: ISBN-13, portada en https y género', () => {
    const r = parseGoogle({ items: [{ id: 'x', volumeInfo: {
      title: 'Terramar', authors: ['Ursula K. Le Guin'], publishedDate: '1968',
      industryIdentifiers: [{ type: 'ISBN_10', identifier: '1' }, { type: 'ISBN_13', identifier: '9788445076' }],
      imageLinks: { thumbnail: 'http://books.google.com/x.jpg' }, categories: ['Fiction / Fantasy'],
    } }] });
    expect(r[0]).toMatchObject({ titulo: 'Terramar', isbn: '9788445076', portada: 'https://books.google.com/x.jpg', genero: 'Fantasía', anio: 1968 });
  });
  it('Google Books: descarta autoayuda y empresa', () => {
    const r = parseGoogle({ items: [
      { id: 'a', volumeInfo: { title: 'Hábitos atómicos', categories: ['Self-Help / Personal Growth'] } },
      { id: 'b', volumeInfo: { title: 'Ventas', categories: ['Business & Economics'] } },
      { id: 'c', volumeInfo: { title: 'Novela buena', categories: ['Fiction'] } },
    ] });
    expect(r.map((x) => x.titulo)).toEqual(['Novela buena']);
  });
});

describe('imprescindibles', () => {
  it('pone primero tus géneros favoritos y cambia de orden cada día', () => {
    const libros = [l({ genero: 'Poesía' }), l({ genero: 'Poesía' })];
    expect(imprescindibles(libros, 1)[0].genero).toBe('Poesía');
    expect(imprescindibles([], 1)[0].titulo).not.toBe(imprescindibles([], 2)[0].titulo);
  });
  it('no incluye autoayuda: todo tiene un género literario', () => {
    expect(imprescindibles([]).every((s) => s.genero && s.genero !== 'Autoayuda')).toBe(true);
  });
});
