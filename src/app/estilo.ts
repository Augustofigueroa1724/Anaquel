/** Estilo del mueble: «clásico» (nogal y latón) o «nórdico» (roble claro y blanco). Preferencia del dispositivo. */
import { barraDeEstado } from '../platform/barra-estado';
export type Estilo = 'clasico' | 'nordico';
const CLAVE = 'anaquel.estilo.v1';

export function leeEstilo(): Estilo {
  try { return localStorage.getItem(CLAVE) === 'nordico' ? 'nordico' : 'clasico'; } catch { return 'clasico'; }
}

export function aplicaEstilo(e: Estilo): void {
  if (e === 'nordico') document.documentElement.dataset.estilo = 'nordico';
  else delete document.documentElement.dataset.estilo;
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
