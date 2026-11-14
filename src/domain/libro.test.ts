import { describe, expect, it } from 'vitest';
import {
  altoLomo, anchoLomo, contar, COLORES_TELA, edicionDe, filtrar, luminancia, repartePorBaldas,
  tintaPara, type Libro, validaDatos, validaPrestamo, hoyIso, formateaFecha, agrupaPorGenero, generoDesdeCategorias, SIN_GENERO, seccionesPorAutor, apellido, conPestana, ordenaPorPreferencia,
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
  it('ids grandes (Date.now) siguen dando una edición válida', () => {
    expect(['clasico', 'moderno', 'condensado']).toContain(edicionDe(Date.now() * 100 + 37));
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

describe('validaDatos', () => {
  const base = { titulo: 'Dune', autor: 'Frank Herbert', anio: 1965, isbn: '', estado: 'leido' as const, genero: '' };
  it('acepta datos correctos y sin año (0)', () => {
    expect(validaDatos(base)).toBeNull();
    expect(validaDatos({ ...base, anio: 0 })).toBeNull();
  });
  it('exige título', () => {
    expect(validaDatos({ ...base, titulo: '   ' })).toMatch(/título/);
  });
  it('rechaza años absurdos', () => {
    expect(validaDatos({ ...base, anio: -5 })).toMatch(/año/);
    expect(validaDatos({ ...base, anio: 3000 })).toMatch(/año/);
  });
});

describe('préstamos', () => {
  it('exige el nombre de quien recibe el libro', () => {
    expect(validaPrestamo('  ')).toMatch(/quién/);
    expect(validaPrestamo('Ana')).toBeNull();
  });
  it('fecha local en formato AAAA-MM-DD', () => {
    expect(hoyIso(new Date(2026, 10, 9))).toBe('2026-11-09');
  });
});

describe('formateaFecha', () => {
  it('muestra la fecha en español', () => {
    expect(formateaFecha('2026-11-09')).toBe('9 nov 2026');
  });
});

describe('géneros', () => {
  it('agrupa por género, los numerosos primero y «Sin género» al final', () => {
    const ls = [
      { ...libro(0), genero: 'Ensayo' }, { ...libro(1), genero: 'Novela' }, { ...libro(2), genero: 'Novela' },
      { ...libro(3) }, { ...libro(4), genero: '  ' },
    ];
    expect(agrupaPorGenero(ls).map((g) => [g.genero, g.libros.length])).toEqual([
      ['Novela', 2], ['Ensayo', 1], [SIN_GENERO, 2],
    ]);
  });
  it('traduce categorías de Google Books', () => {
    expect(generoDesdeCategorias(['Fiction / Science Fiction / General'])).toBe('Ciencia ficción');
    expect(generoDesdeCategorias(['Fiction'])).toBe('Novela');
    expect(generoDesdeCategorias(['History'])).toBe('Historia');
    expect(generoDesdeCategorias([])).toBeUndefined();
  });
});

describe('seccionesPorAutor', () => {
  const l = (id: number, autor: string, anio = 2000): Libro =>
    ({ id, titulo: `T${id}`, autor, anio, isbn: '', estado: 'pendiente', color: '#000', edicion: 'clasico' });
  it('pestaña de autor con más de un libro y letra para los sueltos, en orden alfabético', () => {
    const s = seccionesPorAutor([
      l(1, 'Gabriel García Márquez', 1967), l(2, 'Gabriel García Márquez', 1985),
      l(3, 'Julio Cortázar'), l(4, 'Carmen Laforet'), l(5, 'Juan Goytisolo'), l(6, 'Gabriel Gamoneda'),
    ]);
    expect(s.map((x) => `${x.tipo}:${x.etiqueta}`)).toEqual(['letra:C', 'letra:G', 'autor:García', 'letra:L']);
    expect(s[1].libros.map((x) => x.id)).toEqual([6, 5]);
    expect(s[2].libros.map((x) => x.id)).toEqual([1, 2]);
  });
});

it('apellido', () => {
  expect(apellido('Miguel de Cervantes')).toBe('Cervantes');
  expect(apellido('J. R. R. Tolkien')).toBe('Tolkien');
  expect(apellido('Mario Vargas Llosa')).toBe('Vargas');
});

it('la letra lleva pestaña solo con más de 2 libros', () => {
  const sec = (n: number) => ({ tipo: 'letra' as const, etiqueta: 'A', libros: Array(n).fill(null) as Libro[] });
  expect(conPestana(sec(2))).toBe(false);
  expect(conPestana(sec(3))).toBe(true);
  expect(conPestana({ tipo: 'autor', etiqueta: 'X', libros: [] })).toBe(true);
});

describe('orden de las baldas', () => {
  const g = (genero: string) => ({ genero });
  it('pone primero los géneros elegidos y deja detrás los nuevos', () => {
    const r = ordenaPorPreferencia([g('Novela'), g('Clásicos'), g('Poesía'), g('Ensayo')], ['poesía', 'Novela']);
    expect(r.map((x) => x.genero)).toEqual(['Poesía', 'Novela', 'Clásicos', 'Ensayo']);
  });
  it('sin preferencia deja el orden por defecto', () => {
    expect(ordenaPorPreferencia([g('A'), g('B')], []).map((x) => x.genero)).toEqual(['A', 'B']);
  });
});

describe('coleccionDe', () => {
  it('reconoce Folio, Blanche y Albin Michel por el ISBN', async () => {
    const { coleccionDe } = await import('./libro');
    expect(coleccionDe({ isbn: '9782070360420' })).toBe('folio');   // La peste, Folio
    expect(coleccionDe({ isbn: '9782070392537' })).toBe('folio');   // Crime et châtiment, Folio classique
    expect(coleccionDe({ isbn: '9782070780938' })).toBe('blanche'); // L'élégance du hérisson
    expect(coleccionDe({ isbn: '9782073140920' })).toBe('blanche'); // Le pays des étés
    expect(coleccionDe({ isbn: '9782226141637' })).toBe('albin');
    expect(coleccionDe({ isbn: '9782080490896' })).toBeUndefined(); // Flammarion: color de la portada
    expect(coleccionDe({ isbn: '', editorial: 'Folio' })).toBe('folio');
  });
});
