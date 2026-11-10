import { describe, expect, it } from 'vitest';
import {
  altoLomo, anchoLomo, contar, COLORES_TELA, edicionDe, filtrar, luminancia, repartePorBaldas,
  tintaPara, type Libro,
} from './libro';

const libro = (id: number, estado: Libro['estado'] = 'leido'): Libro => ({
  id, titulo: `Libro ${id}`, autor: 'Autor', anio: 2000, isbn: '978', estado,
  color: COLORES_TELA[id % COLORES_TELA.length], edicion: edicionDe(id),
});

describe('edicionDe', () => {
  it('usa las tres ediciones en los primeros libros', () => {
    const usadas = new Set(Array.from({ length: 12 }, (_, i) => edicionDe(i)));
    expect(usadas.size).toBe(3);
  });
  it('es estable: el mismo id da siempre la misma edición', () => {
    expect(edicionDe(7)).toBe(edicionDe(7));
  });
});

describe('tinta del lomo', () => {
  it('tinta oscura sobre tela clara y clara sobre tela oscura', () => {
    expect(tintaPara('#e6dcc6').tinta).toBe('#221a14');
    expect(tintaPara('#1f2d47').tinta).toBe('#f4ecdc');
  });
  it('luminancia de blanco y negro en los extremos', () => {
    expect(luminancia('#ffffff')).toBeCloseTo(1, 3);
    expect(luminancia('#000000')).toBe(0);
  });
});

describe('filtros y recuentos', () => {
  const libros = [libro(0, 'leido'), libro(1, 'leyendo'), libro(2, 'pendiente'), libro(3, 'leido')];
  it('filtra por estado y devuelve todos con "todos"', () => {
    expect(filtrar(libros, 'todos')).toHaveLength(4);
    expect(filtrar(libros, 'leido').map((l) => l.id)).toEqual([0, 3]);
  });
  it('cuenta por estado', () => {
    expect(contar(libros)).toEqual({ todos: 4, leido: 2, leyendo: 1, pendiente: 1 });
  });
});

describe('dimensiones del lomo', () => {
  it('ancho y alto dentro de los rangos del diseño', () => {
    for (let id = 0; id < 50; id++) {
      expect(anchoLomo(id)).toBeGreaterThanOrEqual(26);
      expect(anchoLomo(id)).toBeLessThanOrEqual(35);
      expect(altoLomo(id)).toBeGreaterThanOrEqual(124);
      expect(altoLomo(id)).toBeLessThanOrEqual(164);
    }
  });
});

describe('repartePorBaldas', () => {
  const libros = Array.from({ length: 43 }, (_, i) => libro(i));
  it('no pierde libros y respeta el ancho útil de cada balda', () => {
    const util = 320;
    const baldas = repartePorBaldas(libros, util);
    expect(baldas.flat()).toHaveLength(43);
    for (const balda of baldas) {
      const ocupado = balda.reduce((s, l) => s + anchoLomo(l.id) + 2, 0);
      expect(ocupado - 2).toBeLessThanOrEqual(util);
    }
  });
  it('lista vacía no produce baldas', () => {
    expect(repartePorBaldas([], 300)).toEqual([]);
  });
});
