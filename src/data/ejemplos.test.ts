import { describe, expect, it } from 'vitest';
import { LIBROS_EJEMPLO } from './ejemplos';

describe('datos de ejemplo', () => {
  it('43 libros con ids únicos', () => {
    expect(LIBROS_EJEMPLO).toHaveLength(43);
    expect(new Set(LIBROS_EJEMPLO.map((l) => l.id)).size).toBe(43);
  });
});
