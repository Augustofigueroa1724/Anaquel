import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { APP_SCHEME, SUPABASE_KEY, SUPABASE_URL } from '../config';

const NATIVO = Capacitor.isNativePlatform();
export const ES_IOS = Capacitor.getPlatform() === 'ios';

/**
 * Cliente de Supabase. Flujo implícito: la vuelta de Google trae los tokens en el
 * fragmento; en la web lo lee supabase-js y en la app llega por el deep link.
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: !NATIVO, flowType: 'implicit' },
});

type Oyente = (s: Session | null) => void;
const oyentes = new Set<Oyente>();
let sesion: Session | null = null;
let errorPendiente = '';

export const sesionActual = (): Session | null => sesion;
export const tomaErrorLogin = (): string => { const e = errorPendiente; errorPendiente = ''; return e; };
export function alCambiarSesion(f: Oyente): () => void { oyentes.add(f); return () => oyentes.delete(f); }
const avisa = () => oyentes.forEach((f) => f(sesion));

let iniciada = false;
/** Lee la sesión guardada y empieza a escuchar cambios y la vuelta del navegador. */
export async function iniciaCuenta(): Promise<Session | null> {
  if (iniciada) return sesion;
  iniciada = true;
  try {
    const { data } = await supabase.auth.getSession();
    sesion = data.session;
  } catch { sesion = null; }
  supabase.auth.onAuthStateChange((_e, s) => { sesion = s; avisa(); });
  if (!NATIVO) leeErrorWeb();
  if (NATIVO) {
    void CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith(`${APP_SCHEME}://auth`)) return;
      try { await Browser.close(); } catch { /* no había navegador */ }
      const q = new URLSearchParams(url.split('#')[1] || '');
      const access_token = q.get('access_token') || '';
      const refresh_token = q.get('refresh_token') || '';
      if (access_token && refresh_token) { await supabase.auth.setSession({ access_token, refresh_token }); return; }
      const desc = q.get('error_description') || q.get('error');
      if (desc) { errorPendiente = `Google no ha podido iniciar sesión (${desc.replace(/\+/g, ' ')}).`; avisa(); }
    });
  }
  return sesion;
}

function leeErrorWeb() {
  try {
    const q = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const desc = q.get('error_description') || q.get('error');
    if (!desc) return;
    errorPendiente = `Google no ha podido iniciar sesión (${desc.replace(/\+/g, ' ')}).`;
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
  } catch { /* URL rara */ }
}

export type Resultado = { ok: true } | { ok: false; error: string; cancelado?: boolean };

interface AppleAuth { ok: boolean; identityToken?: string; nonce?: string; reason?: string }
const apple = registerPlugin<{ authorize(): Promise<AppleAuth> }>('AppleSignIn');

/** Sign in with Apple nativo (solo iPhone): el token de Apple se canjea por la sesión. */
export async function entraConApple(): Promise<Resultado> {
  if (!ES_IOS) return { ok: false, error: 'Iniciar sesión con Apple solo está disponible en el iPhone.' };
  let r: AppleAuth;
  try { r = await apple.authorize(); } catch { return { ok: false, error: 'Apple no ha podido iniciar sesión. Inténtalo de nuevo.' }; }
  if (!r.ok || !r.identityToken) {
    return r.reason === 'canceled' ? { ok: false, error: '', cancelado: true } : { ok: false, error: 'Apple no ha podido iniciar sesión. Inténtalo de nuevo.' };
  }
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: r.identityToken, ...(r.nonce ? { nonce: r.nonce } : {}) });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Google por OAuth de Supabase en el navegador del sistema (Google no admite WebViews). */
export async function entraConGoogle(): Promise<Resultado> {
  const redirectTo = NATIVO ? `${APP_SCHEME}://auth` : window.location.origin + import.meta.env.BASE_URL;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: NATIVO, queryParams: { prompt: 'select_account' } },
  });
  if (error) return { ok: false, error: error.message };
  if (NATIVO) {
    if (!data?.url) return { ok: false, error: 'Google no ha podido iniciar sesión. Inténtalo de nuevo.' };
    // Se resuelve al cerrar el navegador o al llegar la sesión por el deep link.
    let quita: (() => void) | undefined;
    const fin = new Promise<void>((resolve) => {
      const h = Browser.addListener('browserFinished', async () => { (await h).remove(); resolve(); });
      quita = alCambiarSesion(() => { void h.then((l) => l.remove()); resolve(); });
    });
    await Browser.open({ url: data.url });
    await fin;
    quita?.();
  }
  return { ok: true };
}

export async function cierraSesion(): Promise<void> {
  try { await supabase.auth.signOut(); } catch { /* sin red: la sesión local se borra igual */ }
}

/** Borra todo lo de Anaquel en el servidor (y el usuario si no usa Crate Mates) y cierra la sesión. */
export async function borraCuenta(): Promise<Resultado> {
  const { error } = await supabase.rpc('aq_borra_mi_cuenta');
  if (error) return { ok: false, error: 'No se ha podido borrar la cuenta. Comprueba la conexión e inténtalo de nuevo.' };
  await cierraSesion();
  return { ok: true };
}
