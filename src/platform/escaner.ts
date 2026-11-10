import { Capacitor } from '@capacitor/core';
import { esIsbn13 } from '../domain/isbn';

export type ResultadoEscaner =
  | { tipo: 'isbn'; isbn: string }
  | { tipo: 'cancelado' }
  | { tipo: 'sin-permiso' }
  | { tipo: 'no-disponible' }
  | { tipo: 'codigo-no-valido'; valor: string };

/**
 * Lee un código de barras con la cámara nativa (ML Kit). En el navegador no hay
 * lector nativo: devuelve 'no-disponible' y la UI usa «Simular lectura».
 * El plugin se carga bajo demanda para no pesar en la web.
 */
export async function escaneaCodigo(): Promise<ResultadoEscaner> {
  if (!Capacitor.isNativePlatform()) return { tipo: 'no-disponible' };

  const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');
  const { supported } = await BarcodeScanner.isSupported();
  if (!supported) return { tipo: 'no-disponible' };

  let permiso = (await BarcodeScanner.checkPermissions()).camera;
  if (permiso !== 'granted') permiso = (await BarcodeScanner.requestPermissions()).camera;
  if (permiso !== 'granted') return { tipo: 'sin-permiso' };

  try {
    const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.Ean13] });
    const valor = barcodes[0]?.rawValue;
    if (!valor) return { tipo: 'cancelado' };
    return esIsbn13(valor) ? { tipo: 'isbn', isbn: valor } : { tipo: 'codigo-no-valido', valor };
  } catch {
    return { tipo: 'cancelado' };
  }
}
