import type { Libro } from '../domain/libro';
import { supabase } from '../platform/cuenta';

export interface Perfil { user_id: string; alias: string; nombre: string | null }
export interface Amistad { solicitante: string; destinatario: string; estado: 'pendiente' | 'aceptada' }

export const ALIAS_VALIDO = /^[a-z0-9_.]{3,20}$/;
export const normalizaAlias = (a: string): string => a.trim().replace(/^@/, '').toLowerCase();

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('sin sesión');
  return data.user.id;
}

export async function miPerfil(): Promise<Perfil | null> {
  const yo = await uid();
  const { data } = await supabase.from('aq_perfiles').select('user_id, alias, nombre').eq('user_id', yo).maybeSingle();
  return (data as Perfil | null) ?? null;
}

/** Crea o cambia tu alias. Devuelve el error para pintarlo (alias ocupado, formato…). */
export async function guardaPerfil(alias: string, nombre: string): Promise<string | null> {
  const a = normalizaAlias(alias);
  if (!ALIAS_VALIDO.test(a)) return 'El alias lleva de 3 a 20 letras minúsculas, números, punto o guion bajo.';
  const yo = await uid();
  const { error } = await supabase.from('aq_perfiles').upsert({ user_id: yo, alias: a, nombre: nombre.trim() || null });
  if (error) return error.code === '23505' ? 'Ese alias ya lo usa otra persona.' : 'No se ha podido guardar. Inténtalo de nuevo.';
  return null;
}

export interface Relaciones {
  amigos: Perfil[];
  recibidas: Perfil[];
  enviadas: Perfil[];
}

export async function relaciones(): Promise<Relaciones> {
  const yo = await uid();
  const { data, error } = await supabase.from('aq_amistades').select('solicitante, destinatario, estado');
  if (error) throw error;
  const filas = (data ?? []) as Amistad[];
  const otros = [...new Set(filas.map((f) => (f.solicitante === yo ? f.destinatario : f.solicitante)))];
  const perfiles = new Map<string, Perfil>();
  if (otros.length) {
    const { data: ps } = await supabase.from('aq_perfiles').select('user_id, alias, nombre').in('user_id', otros);
    for (const p of (ps ?? []) as Perfil[]) perfiles.set(p.user_id, p);
  }
  const perfil = (id: string): Perfil => perfiles.get(id) ?? { user_id: id, alias: '…', nombre: null };
  return {
    amigos: filas.filter((f) => f.estado === 'aceptada').map((f) => perfil(f.solicitante === yo ? f.destinatario : f.solicitante)),
    recibidas: filas.filter((f) => f.estado === 'pendiente' && f.destinatario === yo).map((f) => perfil(f.solicitante)),
    enviadas: filas.filter((f) => f.estado === 'pendiente' && f.solicitante === yo).map((f) => perfil(f.destinatario)),
  };
}

/** Envía una solicitud por alias. Devuelve el error para pintarlo, o null. */
export async function pideAmistad(alias: string): Promise<string | null> {
  const a = normalizaAlias(alias);
  const yo = await uid();
  const { data } = await supabase.from('aq_perfiles').select('user_id').eq('alias', a).maybeSingle();
  if (!data) return `No hay nadie con el alias @${a}.`;
  const otro = (data as { user_id: string }).user_id;
  if (otro === yo) return 'Ese alias es el tuyo.';
  // Si el otro ya te la había enviado, se acepta directamente.
  const { data: inversa } = await supabase.from('aq_amistades').select('estado').eq('solicitante', otro).eq('destinatario', yo).maybeSingle();
  if (inversa) { await aceptaAmistad(otro); return null; }
  const { error } = await supabase.from('aq_amistades').insert({ solicitante: yo, destinatario: otro });
  if (error) return error.code === '23505' ? 'Ya le habías enviado una solicitud.' : 'No se ha podido enviar. Inténtalo de nuevo.';
  return null;
}

export async function aceptaAmistad(solicitante: string): Promise<void> {
  const yo = await uid();
  await supabase.from('aq_amistades').update({ estado: 'aceptada' }).eq('solicitante', solicitante).eq('destinatario', yo);
}

/** Rechaza una solicitud o quita a un amigo (borra la relación en los dos sentidos). */
export async function quitaAmistad(otro: string): Promise<void> {
  const yo = await uid();
  await supabase.from('aq_amistades').delete().eq('solicitante', yo).eq('destinatario', otro);
  await supabase.from('aq_amistades').delete().eq('solicitante', otro).eq('destinatario', yo);
}

/** El anaquel de un amigo, sin sus notas ni préstamos (lo filtra la base de datos). */
export async function anaquelDe(amigo: string): Promise<Libro[]> {
  const { data, error } = await supabase.rpc('aq_anaquel_de', { amigo });
  if (error) throw error;
  return (data ?? []) as Libro[];
}
