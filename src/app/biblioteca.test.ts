import { describe, expect, it } from 'vitest';
import { useBiblioteca } from './biblioteca';
import { esEjemplo } from '../data/ejemplos';

describe('libros de ejemplo', () => {
  it('se ven al empezar y desaparecen al añadir el primer libro propio', () => {
    const s = useBiblioteca.getState();
    expect(s.libros.length).toBeGreaterThan(0);
    expect(s.libros.every(esEjemplo)).toBe(true);
    s.simularLectura();
    useBiblioteca.getState().anadirCandidato('tengo');
    const libros = useBiblioteca.getState().libros;
    expect(libros).toHaveLength(1);
    expect(libros.some(esEjemplo)).toBe(false);
  });
  it('si se quedan sin libros vuelven los de ejemplo', () => {
    useBiblioteca.getState().reemplazaLibros([]);
    expect(useBiblioteca.getState().libros.every(esEjemplo)).toBe(true);
  });
});
