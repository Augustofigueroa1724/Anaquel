import { describe, expect, it } from 'vitest';
import { buscarPorIsbn, parseGoogleBooks, parseOpenLibrary } from './buscar-isbn';

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
    }));
    expect(r.estado).toBe('encontrado');
    expect(r.meta?.anio).toBe(1965);
  });
  it('no-encontrado si ninguno lo tiene', async () => {
    const r = await buscarPorIsbn('9780000000002', fetchDesde({}));
    expect(r.estado).toBe('no-encontrado');
  });
  it('sin-red si la petición falla', async () => {
    const roto = (async () => { throw new TypeError('Failed to fetch'); }) as typeof fetch;
    const r = await buscarPorIsbn('9780441013593', roto);
    expect(r.estado).toBe('sin-red');
  });
  it('corta si la red no responde (no se queda cargando)', async () => {
    const colgado = ((_url: string, init?: RequestInit) => new Promise((_, rechaza) => {
      init?.signal?.addEventListener('abort', () => rechaza(new DOMException('abort', 'AbortError')));
    })) as typeof fetch;
    const r = await buscarPorIsbn('9780441013593', colgado, 20);
    expect(r.estado).toBe('sin-red');
  });
});
