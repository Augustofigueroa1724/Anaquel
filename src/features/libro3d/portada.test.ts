import { describe, expect, it } from 'vitest';
import { fuentesPortada } from './Portada';

describe('fuentesPortada', () => {
  it('primero la grande de Open Library por ISBN, después la guardada', () => {
    expect(fuentesPortada({ isbn: '978-2-08-049089-6', portada: 'https://books.google.com/x' })).toEqual([
      'https://covers.openlibrary.org/b/isbn/9782080490896-L.jpg?default=false',
      'https://books.google.com/x',
    ]);
  });
  it('sin ISBN, solo la guardada; sin nada, ninguna', () => {
    expect(fuentesPortada({ isbn: '', portada: 'https://a/b.jpg' })).toEqual(['https://a/b.jpg']);
    expect(fuentesPortada({ isbn: '' })).toEqual([]);
  });
});
