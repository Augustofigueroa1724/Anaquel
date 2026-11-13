/**
 * Petición de texto que en la app nativa no depende de CORS: usa CapacitorHttp (petición nativa).
 * En la web es un fetch normal, que fallará si el servidor no admite CORS (y quien llama lo trata como «no encontrado»).
 */
import { Capacitor, CapacitorHttp } from '@capacitor/core';

export async function pideTexto(url: string, tiempoMs: number): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const r = await CapacitorHttp.get({ url, connectTimeout: tiempoMs, readTimeout: tiempoMs, responseType: 'text' });
    return r.status >= 200 && r.status < 300 ? String(r.data ?? '') : null;
  }
  const control = new AbortController();
  const t = setTimeout(() => control.abort(), tiempoMs);
  try {
    const r = await fetch(url, { signal: control.signal });
    return r.ok ? await r.text() : null;
  } finally {
    clearTimeout(t);
  }
}
