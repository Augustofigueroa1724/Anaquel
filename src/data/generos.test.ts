import { describe, expect, it, vi } from 'vitest';
vi.mock('../platform/cuenta', () => ({ supabase: {} }));
import { juntaGeneros, normalizaGenero } from './generos';

describe('géneros', () => {
  it('normaliza espacios y la primera letra', () => {
    expect(normalizaGenero('  ciencia   ficción ')).toBe('Ciencia ficción');
    expect(normalizaGenero('   ')).toBe('');
  });
  it('junta listas sin duplicados aunque cambien las mayúsculas', () => {
    expect(juntaGeneros(['Novela', 'Ensayo'], ['novela', 'Viajes'], ['viajes'])).toEqual(['Ensayo', 'Novela', 'Viajes']);
  });
});
