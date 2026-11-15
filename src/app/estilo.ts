import { barraDeEstado } from '../platform/barra-estado';

/** Vista del anaquel: la estantería de nogal o el carrusel 3D. Preferencia del dispositivo. */
export type Estilo = 'clasico' | 'carrusel';
const CLAVE = 'anaquel.estilo.v1';

export function leeEstilo(): Estilo {
  // «nordico» fue un mueble alternativo que se retiró el 15 nov 2026: quien lo tenía vuelve al clásico.
  try { return localStorage.getItem(CLAVE) === 'carrusel' ? 'carrusel' : 'clasico'; } catch { return 'clasico'; }
}

export function aplicaEstilo(e: Estilo): void {
  delete document.documentElement.dataset.estilo;
  try { localStorage.setItem(CLAVE, e); } catch { /* sin almacenamiento: dura la sesión */ }
}

/** Apariencia: «auto» sigue al sistema; «claro» y «oscuro» la fuerzan (`data-theme` en `<html>`). */
export type Tema = 'auto' | 'claro' | 'oscuro';
const CLAVE_TEMA = 'anaquel.tema.v1';
let quitaEscucha: (() => void) | null = null;

export function leeTema(): Tema {
  try { const t = localStorage.getItem(CLAVE_TEMA); return t === 'claro' || t === 'oscuro' ? t : 'auto'; } catch { return 'auto'; }
}

export function aplicaTema(t: Tema): void {
  const raiz = document.documentElement;
  if (t === 'auto') delete raiz.dataset.theme;
  else raiz.dataset.theme = t === 'oscuro' ? 'dark' : 'light';
  try { localStorage.setItem(CLAVE_TEMA, t); } catch { /* sin almacenamiento: dura la sesión */ }
  const consulta = window.matchMedia?.('(prefers-color-scheme: dark)');
  const pinta = () => barraDeEstado(t === 'oscuro' || (t === 'auto' && !!consulta?.matches));
  quitaEscucha?.();
  quitaEscucha = null;
  if (t === 'auto' && consulta) {
    consulta.addEventListener('change', pinta);
    quitaEscucha = () => consulta.removeEventListener('change', pinta);
  }
  pinta();
}
