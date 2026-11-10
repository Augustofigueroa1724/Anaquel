import { describe, expect, it } from 'vitest';
import { H, tf, W } from './vuelo';

describe('tf', () => {
  it('genera la transformación con el formato del prototipo', () => {
    expect(tf(1, 2, 3, 90, 0, 0.5)).toBe('translate3d(1px,2px,3px) rotateY(90deg) rotateX(0deg) scale3d(0.5,0.5,0.5)');
  });
  it('la portada tiene las dimensiones del diseño', () => {
    expect(W).toBe(152);
    expect(H).toBe(228);
  });
});
