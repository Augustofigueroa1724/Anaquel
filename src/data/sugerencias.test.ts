import { describe, expect, it } from 'vitest';
import { consultasParaTi, filtraConocidos, parseGoogle, parseTendencias, type Sugerencia } from './sugerencias';
import { COLORES_TELA, type Libro } from '../domain/libro';

const l = (o: Partial<Libro>): Libro => ({
  id: Math.random(), titulo: 'T', autor: 'A', anio: 2000, isbn: '', estado: 'leido', color: COLORES_TELA[0], edicion: 'clasico', ...o,
});

describe('consultasParaTi', () => {
  it('usa tus autores mejor valorados y tus géneros más leídos', () => {
    const libros = [
      l({ genero: 'Fantasía' }), l({ genero: 'Fantasía' }), l({ genero: 'Historia' }), l({ genero: 'Novela' }), l({ genero: 'Novela' }), l({ genero: 'Novela' }),
      l({ autor: 'Ursula K. Le Guin', valoracion: 5 }), l({ autor: 'Otro', valoracion: 2 }),
    ];
    expect(consultasParaTi(libros)).toEqual(['inauthor:"Ursula K. Le Guin"', 'subject:"fiction"', 'subject:"fantasy"']);
  });
  it('ignora los libros de ejemplo y la lista de deseos', () => {
    expect(consultasParaTi([l({ genero: 'Fantasía', ejemplo: true }), l({ genero: 'Historia', posesion: 'quiero' })])).toEqual([]);
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
  it('Open Library: portada por cover_i', () => {
    const r = parseTendencias({ works: [{ key: '/works/OL1W', title: 'Libro', author_name: ['A'], cover_i: 42, first_publish_year: 2020 }] });
    expect(r[0]).toMatchObject({ titulo: 'Libro', autor: 'A', portada: 'https://covers.openlibrary.org/b/id/42-M.jpg', anio: 2020 });
  });
});
