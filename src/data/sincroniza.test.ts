import { describe, expect, it, vi } from 'vitest';
vi.mock('../platform/cuenta', () => ({ supabase: {} }));
import { diferencias, soloDeEsteMovil } from './sincroniza';
import { COLORES_TELA, type Libro } from '../domain/libro';

const l = (id: number, titulo = `L${id}`): Libro => ({
  id, titulo, autor: 'A', anio: 2000, isbn: '', estado: 'leido', color: COLORES_TELA[0], edicion: 'clasico',
});

describe('diferencias', () => {
  it('detecta nuevos, cambiados y borrados', () => {
    const antes = [l(1), l(2), l(3)];
    const ahora = [l(1), l(2, 'Otro título'), l(4)];
    const d = diferencias(antes, ahora);
    expect(d.cambiados.map((x) => x.id)).toEqual([2, 4]);
    expect(d.borrados).toEqual([3]);
  });
  it('sin cambios no sube nada', () => {
    expect(diferencias([l(1)], [l(1)])).toEqual({ cambiados: [], borrados: [] });
  });
});

describe('soloDeEsteMovil', () => {
  const l = (id: number, isbn = ''): Libro => ({ id, titulo: `T${id}`, autor: 'A', anio: 0, isbn, estado: 'pendiente', color: '#000', edicion: 'clasico' });
  it('no vuelve a subir lo que se borró desde otro dispositivo', () => {
    const r = soloDeEsteMovil([l(1), l(2), l(3)], [l(1)], new Set([1, 2]), false);
    expect(r.map((x) => x.id)).toEqual([3]); // el 2 se borró en otro sitio; el 3 es nuevo de este móvil
  });
  it('sin registro: suma lo local solo en un inicio de sesión nuevo', () => {
    expect(soloDeEsteMovil([l(5)], [l(1)], null, true).map((x) => x.id)).toEqual([5]);
    expect(soloDeEsteMovil([l(5)], [l(1)], null, false)).toEqual([]);
  });
  it('no duplica un libro que ya está en la cuenta con el mismo ISBN', () => {
    expect(soloDeEsteMovil([l(9, '978')], [l(1, '978')], null, true)).toEqual([]);
  });
});
