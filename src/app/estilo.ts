/** Estilo del mueble: «clásico» (nogal y latón) o «nórdico» (roble claro y blanco). Preferencia del dispositivo. */
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
