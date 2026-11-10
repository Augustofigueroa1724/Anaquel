import { describe, expect, it } from 'vitest';
import { esIsbn13, formateaIsbn } from './isbn';

describe('esIsbn13', () => {
  it('acepta un ISBN-13 con dígito de control correcto', () => {
    expect(esIsbn13('9780306406157')).toBe(true);
  });
  it('rechaza un dígito de control incorrecto', () => {
    expect(esIsbn13('9780306406158')).toBe(false);
  });
  it('rechaza longitud distinta de 13 y caracteres no numéricos', () => {
    expect(esIsbn13('978030640615')).toBe(false);
    expect(esIsbn13('978-0306406157')).toBe(false);
  });
  it('rechaza prefijos que no son de libro (p. ej. 0 o 04)', () => {
    expect(esIsbn13('0123456789012')).toBe(false);
  });
});

describe('formateaIsbn', () => {
  it('separa el prefijo', () => {
    expect(formateaIsbn('9780306406157')).toBe('978-0306406157');
  });
});
