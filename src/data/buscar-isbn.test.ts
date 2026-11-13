import { describe, expect, it } from 'vitest';
import { buscarPorIsbn, parseGoogleBooks, parseOpenLibrary, parseBnf } from './buscar-isbn';

const googleOk = {
  items: [{ volumeInfo: { title: 'Dune', authors: ['Frank Herbert'], publishedDate: '1965-08-01' } }],
};

function fetchDesde(respuestas: Record<string, unknown>): typeof fetch {
  return (async (url: string) => {
    const clave = Object.keys(respuestas).find((k) => String(url).includes(k));
    if (!clave) return new Response(null, { status: 404 });
    return new Response(JSON.stringify(respuestas[clave]), { status: 200 });
  }) as typeof fetch;
}

describe('parsers', () => {
  it('Google Books: título, autor y año', () => {
    expect(parseGoogleBooks(googleOk)).toEqual({ titulo: 'Dune', autor: 'Frank Herbert', anio: 1965 });
  });
  it('Google Books: la categoría se traduce a género', () => {
    const json = { items: [{ volumeInfo: { title: 'Dune', authors: ['Frank Herbert'], publishedDate: '1965', categories: ['Fiction / Science Fiction'] } }] };
    expect(parseGoogleBooks(json)?.genero).toBe('Ciencia ficción');
  });
  it('Google Books: sin items devuelve null', () => {
    expect(parseGoogleBooks({ totalItems: 0 })).toBeNull();
  });
  it('Open Library: título y año de publish_date', () => {
    expect(parseOpenLibrary({ title: 'Dune', publish_date: 'Aug 1, 1965' })).toEqual({
      titulo: 'Dune', autor: 'Autor desconocido', anio: 1965,
    });
  });
});

describe('buscarPorIsbn', () => {
  it('usa Google Books si tiene el libro', async () => {
    const r = await buscarPorIsbn('9780441013593', fetchDesde({ 'googleapis.com': googleOk }));
    expect(r.estado).toBe('encontrado');
    expect(r.meta?.titulo).toBe('Dune');
  });
  it('recurre a Open Library si Google no lo tiene', async () => {
    const r = await buscarPorIsbn('9780441013593', fetchDesde({
      'googleapis.com': { totalItems: 0 },
      'openlibrary.org': { title: 'Dune', publish_date: '1965' },
    }), 8000, async () => null);
    expect(r.estado).toBe('encontrado');
    expect(r.meta?.anio).toBe(1965);
  });
  it('no-encontrado si ninguno lo tiene', async () => {
    const r = await buscarPorIsbn('9780000000002', fetchDesde({}), 8000, async () => null);
    expect(r.estado).toBe('no-encontrado');
  });
  it('sin-red si la petición falla', async () => {
    const roto = (async () => { throw new TypeError('Failed to fetch'); }) as typeof fetch;
    const r = await buscarPorIsbn('9780441013593', roto, 8000, async () => { throw new Error('sin red'); });
    expect(r.estado).toBe('sin-red');
  });
  it('corta si la red no responde (no se queda cargando)', async () => {
    const colgado = ((_url: string, init?: RequestInit) => new Promise((_, rechaza) => {
      init?.signal?.addEventListener('abort', () => rechaza(new DOMException('abort', 'AbortError')));
    })) as typeof fetch;
    const r = await buscarPorIsbn('9780441013593', colgado, 20, async () => null);
    expect(r.estado).toBe('sin-red');
  });
});

describe('BnF', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><srw:searchRetrieveResponse><srw:numberOfRecords>1</srw:numberOfRecords><srw:records><srw:record><srw:recordData>
<oai_dc:dc><dc:identifier>http://catalogue.bnf.fr/ark:/12148/cb47000000x</dc:identifier>
<dc:title>Le pays des &#233;t&#233;s / Pierre Adrian</dc:title>
<dc:creator>Adrian, Pierre (1991-....). Auteur du texte</dc:creator>
<dc:publisher>[Paris] : Gallimard</dc:publisher><dc:date>2026</dc:date><dc:language>fre</dc:language>
<dc:identifier>ISBN 978-2-07-314092-0</dc:identifier></oai_dc:dc></srw:recordData></srw:record></srw:records></srw:searchRetrieveResponse>`;
  it('lee título, autor y año del Dublin Core', () => {
    expect(parseBnf(xml)).toEqual({ titulo: 'Le pays des étés', autor: 'Pierre Adrian', anio: 2026 });
  });
  it('sin registros no devuelve nada', () => {
    expect(parseBnf('<srw:numberOfRecords>0</srw:numberOfRecords>')).toBeNull();
  });
  it('un ISBN francés que Google no tiene sale de la BnF', async () => {
    const vacio = (async () => ({ ok: true, json: async () => ({ totalItems: 0 }) })) as unknown as typeof fetch;
    const r = await buscarPorIsbn('9782073140920', vacio, 8000, async (url) => (url.includes('catalogue.bnf.fr') ? xml : null));
    expect(r).toEqual({ estado: 'encontrado', meta: { titulo: 'Le pays des étés', autor: 'Pierre Adrian', anio: 2026 } });
  });
});

describe('autor', () => {
  it('Open Library con datos trae el autor', () => {
    expect(parseOpenLibrary({ 'ISBN:9788433920423': { title: 'Los detectives salvajes', authors: [{ name: 'Roberto Bolaño' }], publish_date: '1998' } }))
      .toEqual({ titulo: 'Los detectives salvajes', autor: 'Roberto Bolaño', anio: 1998 });
  });
  it('si Google no trae autor, lo busca en las otras fuentes', async () => {
    const f = (async (url: string) => ({ ok: true, json: async () => (String(url).includes('googleapis')
      ? { items: [{ volumeInfo: { title: 'Los detectives salvajes', publishedDate: '1998' } }] }
      : { 'ISBN:9788433920423': { title: 'Los detectives salvajes', authors: [{ name: 'Roberto Bolaño' }], publish_date: '2010' } }) })) as unknown as typeof fetch;
    const r = await buscarPorIsbn('9788433920423', f, 8000, async () => null);
    expect(r.meta?.autor).toBe('Roberto Bolaño');
    expect(r.meta?.titulo).toBe('Los detectives salvajes');
  });
  it('si nadie trae autor, se queda el título', async () => {
    const f = (async (url: string) => ({ ok: true, json: async () => (String(url).includes('googleapis')
      ? { items: [{ volumeInfo: { title: 'Sin autor' } }] } : {}) })) as unknown as typeof fetch;
    const r = await buscarPorIsbn('9788400000000', f, 8000, async () => null);
    expect(r).toMatchObject({ estado: 'encontrado', meta: { titulo: 'Sin autor', autor: 'Autor desconocido' } });
  });
});

describe('género', () => {
  it('Open Library da el género por sus temas', () => {
    expect(parseOpenLibrary({ 'ISBN:1': { title: 'La peste', authors: [{ name: 'Albert Camus' }], subjects: [{ name: 'French fiction' }] } })?.genero).toBe('Novela');
  });
  it('si la fuente con autor no trae género, lo toma de otra', async () => {
    const f = (async (url: string) => ({ ok: true, json: async () => (String(url).includes('googleapis')
      ? { items: [{ volumeInfo: { title: 'La peste', authors: ['Albert Camus'] } }] }
      : { 'ISBN:9788400000001': { title: 'La peste', authors: [{ name: 'Albert Camus' }], subjects: ['Fiction'] } }) })) as unknown as typeof fetch;
    const r = await buscarPorIsbn('9788400000001', f, 8000, async () => null);
    expect(r.meta).toMatchObject({ autor: 'Albert Camus', genero: 'Novela' });
  });
  it('categorías en francés y español', async () => {
    const { generoDesdeCategorias } = await import('../domain/libro');
    expect(generoDesdeCategorias(['Romans français'])).toBe('Novela');
    expect(generoDesdeCategorias(['Poésie'])).toBe('Poesía');
    expect(generoDesdeCategorias(['Novela negra'])).toBe('Policiaca');
  });
});
