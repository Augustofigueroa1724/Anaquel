import { describe, expect, it, vi } from 'vitest';
vi.mock('../platform/cuenta', () => ({ supabase: {} }));
import { diferencias } from './sincroniza';
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
