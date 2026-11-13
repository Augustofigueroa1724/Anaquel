import { describe, expect, it } from 'vitest';
import { consultaGoogle, parseGoogleCandidatos, parseOpenLibraryCandidatos, sugiereLibros } from './autocompletar';

const google = { items: [
  { volumeInfo: { title: 'Tokio blues', authors: ['Haruki Murakami'], publishedDate: '2005-03', industryIdentifiers: [{ type: 'ISBN_10', identifier: '8483835045' }, { type: 'ISBN_13', identifier: '9788483835043' }], categories: ['Fiction'], imageLinks: { smallThumbnail: 'http://x/y.jpg' } } },
  { volumeInfo: { title: 'Tokio Blues', authors: ['Haruki Murakami'], publishedDate: '2010' } },
  { volumeInfo: { title: 'Sin autor' } },
] };

describe('autocompletar', () => {
  it('consulta por título, autor o ambos', () => {
    expect(consultaGoogle('cien años', '')).toBe('intitle:cien años');
    expect(consultaGoogle('', 'murakami')).toBe('inauthor:murakami');
    expect(consultaGoogle('tokio', 'murakami')).toBe('intitle:tokio+inauthor:murakami');
  });
  it('lee Google Books sin repetidos ni libros sin autor', () => {
    const c = parseGoogleCandidatos(google);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ titulo: 'Tokio blues', autor: 'Haruki Murakami', anio: 2005, isbn: '9788483835043', portada: 'https://x/y.jpg' });
  });
  it('lee Open Library', () => {
    const c = parseOpenLibraryCandidatos({ docs: [{ title: 'Rayuela', author_name: ['Julio Cortázar'], first_publish_year: 1963, isbn: ['8437604575', '9788437604572'], cover_i: 7 }] });
    expect(c[0]).toMatchObject({ titulo: 'Rayuela', autor: 'Julio Cortázar', anio: 1963, isbn: '9788437604572' });
  });
  it('menos de 3 letras no consulta; sin red devuelve vacío', async () => {
    let llamadas = 0;
    const falla = (async () => { llamadas++; throw new Error('sin red'); }) as unknown as typeof fetch;
    expect(await sugiereLibros('ab', '', undefined, falla)).toEqual([]);
    expect(llamadas).toBe(0);
    expect(await sugiereLibros('zzzq', '', undefined, falla)).toEqual([]);
  });
});
