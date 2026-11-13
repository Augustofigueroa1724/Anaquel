import { GENEROS_BASE } from '../domain/libro';
import { supabase } from '../platform/cuenta';

/**
 * Catálogo común de géneros (como los tipos de sitio de Fifth Square): los base viven en la
 * app y los que añade la gente en la tabla aq_generos, que ven todos. Sin duplicados (sin
 * distinguir mayúsculas). Sin sesión, los nuevos se guardan en este móvil.
 */
const LOCAL = 'anaquel.generos.v1';

/** «  ciencia   ficción » → «Ciencia ficción». Puro. */
export function normalizaGenero(nombre: string): string {
  const limpio = nombre.trim().replace(/\s+/g, ' ');
  return limpio ? limpio.charAt(0).toLocaleUpperCase('es') + limpio.slice(1) : '';
}

/** Junta varias listas sin repetir (sin distinguir mayúsculas) y ordena en español. Puro. */
export function juntaGeneros(...listas: readonly (readonly string[])[]): string[] {
  const vistos = new Map<string, string>();
  for (const lista of listas) for (const g of lista) {
    const n = normalizaGenero(g);
    if (n && !vistos.has(n.toLowerCase())) vistos.set(n.toLowerCase(), n);
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

const locales = (): string[] => {
  try { return JSON.parse(localStorage.getItem(LOCAL) || '[]') as string[]; } catch { return []; }
};

export const esBase = (g: string): boolean => GENEROS_BASE.some((b) => b.toLowerCase() === g.toLowerCase());

/** Base + catálogo común + los de este móvil. Si no hay red, base + locales. */
export async function cargaGeneros(): Promise<string[]> {
  let comunes: string[] = [];
  try {
    const { data, error } = await supabase.from('aq_generos').select('nombre');
    if (!error) comunes = (data ?? []).map((f: { nombre: string }) => f.nombre);
  } catch { /* sin red o sin tabla: seguimos con lo que hay */ }
  return juntaGeneros(GENEROS_BASE, comunes, locales());
}

/** Añade un género al catálogo. Devuelve el nombre normalizado o un mensaje de error. */
export async function anadeGenero(nombre: string): Promise<{ ok: true; genero: string } | { ok: false; error: string }> {
  const g = normalizaGenero(nombre);
  if (g.length < 2 || g.length > 30) return { ok: false, error: 'El género lleva entre 2 y 30 letras.' };
  try { localStorage.setItem(LOCAL, JSON.stringify(juntaGeneros(locales(), [g]))); } catch { /* sin almacenamiento */ }
  const { data } = await supabase.auth.getSession();
  if (data.session && !esBase(g)) {
    // Si ya existía (otra persona lo creó) o no hay red, el género sigue valiendo en este móvil.
    await supabase.from('aq_generos').insert({ nombre: g });
  }
  return { ok: true, genero: g };
}

/** Quita un género del catálogo si ningún libro de nadie lo usa (lo comprueba el servidor). */
export async function borraGenero(nombre: string): Promise<boolean> {
  try { localStorage.setItem(LOCAL, JSON.stringify(locales().filter((g) => g.toLowerCase() !== nombre.toLowerCase()))); } catch { /* nada */ }
  const { data } = await supabase.auth.getSession();
  if (!data.session) return true;
  const { data: borrado, error } = await supabase.rpc('aq_borra_genero', { g: nombre });
  return !error && borrado !== false;
}
