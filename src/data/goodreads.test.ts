import { describe, expect, it } from 'vitest';
import { libroDesdeGoodreads, parseCsv, sinRepetidos } from './goodreads';
import { COLORES_TELA } from '../domain/libro';

const CSV = [
  'Book Id,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Average Rating,Publisher,Binding,Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,Bookshelves with positions,Exclusive Shelf,My Review,Spoiler,Private Notes,Read Count,Owned Copies',
  '1,"Dune (Dune, #1)",Frank Herbert,"Herbert, Frank",,"=""0441013597""","=""9780441013593""",5,4.25,Ace,Paperback,617,2005,1965,2020/01/01,2019/12/01,science-fiction,science-fiction (#1),read,"Obra maestra.<br/>Releer.",,,1,1',
  '2,Rayuela,Julio Cortázar,"Cortázar, Julio",,"=""""","=""""",0,4.1,Alfaguara,Tapa blanda,600,1963,1963,,2021/01/01,,,to-read,,,,0,0',
].join('\n');

describe('parseCsv', () => {
  it('respeta comillas, comas y comillas dobles dentro de un campo', () => {
    expect(parseCsv('a,"b, c","d ""e"""\n1,2,3')).toEqual([['a', 'b, c', 'd "e"'], ['1', '2', '3']]);
  });
  it('admite saltos de línea dentro de un campo y CRLF', () => {
    expect(parseCsv('a,"x\ny"\r\n1,2\r\n')).toEqual([['a', 'x\ny'], ['1', '2']]);
  });
});

describe('libroDesdeGoodreads', () => {
  const libros = libroDesdeGoodreads(CSV);
  it('lee título, autor, ISBN, año original, valoración y notas', () => {
    expect(libros[0]).toMatchObject({
      titulo: 'Dune (Dune, #1)', autor: 'Frank Herbert', isbn: '9780441013593', anio: 1965,
      estado: 'leido', valoracion: 5, notas: 'Obra maestra.\nReleer.', genero: 'Ciencia ficción',
    });
  });
  it('«to-read» va a la lista de deseos, sin valoración', () => {
    expect(libros[1]).toMatchObject({ titulo: 'Rayuela', estado: 'pendiente', posesion: 'quiero', isbn: '' });
    expect(libros[1].valoracion).toBeUndefined();
  });
  it('un CSV que no es de Goodreads no importa nada', () => {
    expect(libroDesdeGoodreads('foo,bar\n1,2')).toEqual([]);
  });
});

describe('sinRepetidos', () => {
  it('quita los que ya están por ISBN o por título y autor', () => {
    const existentes = [{
      id: 1, titulo: 'Rayuela', autor: 'Julio Cortázar', anio: 1963, isbn: '', estado: 'leido' as const,
      color: COLORES_TELA[0], edicion: 'clasico' as const,
    }];
    expect(sinRepetidos(libroDesdeGoodreads(CSV), existentes).map((l) => l.titulo)).toEqual(['Dune (Dune, #1)']);
  });
});
