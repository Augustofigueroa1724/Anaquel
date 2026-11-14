/**
 * Color dominante de una portada, para pintar el lomo de los libros sin colección reconocida.
 * En la app la imagen se baja por petición nativa (CapacitorHttp, sin CORS) y se lee en un lienzo;
 * en la web solo funciona si el servidor de la imagen admite CORS. Si no se puede, devuelve null.
 */
import { Capacitor, CapacitorHttp } from '@capacitor/core';

function cargaImagen(src: string, cruzada: boolean): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const img = new Image();
    if (cruzada) img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => mal(new Error('imagen'));
    img.src = src;
  });
}

/** Elige el color más repetido (cubos de 32 niveles), sin los casi blancos ni casi negros si hay otros. */
export function dominanteDePixeles(px: Uint8ClampedArray): string | null {
  const cubos = new Map<number, { n: number; r: number; g: number; b: number }>();
  const extremos = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b, a] = [px[i], px[i + 1], px[i + 2], px[i + 3]];
    if (a < 128) continue;
    const suma = r + g + b;
    const destino = suma < 60 || suma > 700 ? extremos : cubos;
    const k = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const c = destino.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
    c.n++; c.r += r; c.g += g; c.b += b;
    destino.set(k, c);
  }
  const elegido = [...(cubos.size ? cubos : extremos).values()].sort((x, y) => y.n - x.n)[0];
  if (!elegido) return null;
  const h = (v: number) => Math.round(v / elegido.n).toString(16).padStart(2, '0');
  return `#${h(elegido.r)}${h(elegido.g)}${h(elegido.b)}`;
}

export async function colorDominante(url: string): Promise<string | null> {
  try {
    let src = url;
    if (Capacitor.isNativePlatform()) {
      const r = await CapacitorHttp.get({ url, responseType: 'blob', connectTimeout: 8000, readTimeout: 8000 });
      if (r.status < 200 || r.status >= 300 || typeof r.data !== 'string') return null;
      src = `data:image/jpeg;base64,${r.data}`;
    }
    const img = await cargaImagen(src, !Capacitor.isNativePlatform());
    const lienzo = document.createElement('canvas');
    lienzo.width = 24; lienzo.height = 36;
    const ctx = lienzo.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 24, 36);
    return dominanteDePixeles(ctx.getImageData(0, 0, 24, 36).data);
  } catch {
    return null;
  }
}
