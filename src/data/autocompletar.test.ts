import { describe, expect, it } from 'vitest';
import { afinidad, consultaGoogle, parseGoogleCandidatos, parseOpenLibraryCandidatos, sugiereLibros, type Candidato } from './autocompletar';

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
    const c = parseOpenLibraryCandidatos({ docs: [{ title: 'Rayuela', author_name: ['Julio Cortázar'], first_publish_year: 1963, cover_i: 7, editions: { docs: [{ title: 'Rayuela', isbn: ['8437604575', '9788437604572'], cover_i: 8 }] } }] });
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

describe('afinidad y mezcla', () => {
  const c = (titulo: string, autor: string, idioma?: string): Candidato => ({ titulo, autor, anio: 0, isbn: '', ...(idioma ? { idioma } : {}) });
  it('sin tildes y en cualquier idioma', () => {
    expect(afinidad(c('Le pays des étés', 'Pierre Adrian', 'fr'), 'le pays des etes', '')).toBe(1);
    expect(afinidad(c('Pays perdu', 'Pierre Jourde'), 'le pays des etes', '')).toBeLessThan(0.5);
  });
  it('junta Google y Open Library y pone primero lo que casa', async () => {
    const respuestas: Record<string, unknown> = {
      google: { items: [{ volumeInfo: { title: 'Pays perdu', authors: ['Pierre Jourde'], language: 'fr' } }] },
      openlibrary: { docs: [{ title: 'Le pays des étés', author_name: ['Pierre Adrian'], first_publish_year: 2026, editions: { docs: [{ title: 'Le pays des étés', isbn: ['9782073140920'] }] } }] },
    };
    const f = (async (url: string) => ({ ok: true, json: async () => respuestas[url.includes('openlibrary') ? 'openlibrary' : 'google'] })) as unknown as typeof fetch;
    const r = await sugiereLibros('le pays des etes', 'adrian', undefined, f);
    expect(r[0]).toMatchObject({ titulo: 'Le pays des étés', isbn: '9782073140920' });
    expect(r.find((x) => x.titulo === 'Pays perdu')).toBeUndefined();
  });
});

describe('Open Library: edición correcta', () => {
  it('el ISBN sale de la edición que casa, no de la lista de la obra', () => {
    const c = parseOpenLibraryCandidatos({ docs: [{ title: 'Au revoir là-haut', author_name: ['Pierre Lemaitre'], isbn: ['9788467926217'], cover_i: 1,
      editions: { docs: [{ title: 'Au revoir là-haut', isbn: ['9782253194613'], cover_i: 2 }] } }] });
    expect(c[0]).toMatchObject({ isbn: '9782253194613', portada: 'https://covers.openlibrary.org/b/id/2-M.jpg' });
  });
  it('sin edición, sin ISBN', () => {
    const c = parseOpenLibraryCandidatos({ docs: [{ title: 'X', author_name: ['A'], isbn: ['9788467926217'], cover_i: 1 }] });
    expect(c[0].isbn).toBe('');
  });
});
