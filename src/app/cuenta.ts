import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { LIBROS_EJEMPLO, sinEjemplos } from '../data/ejemplos';
import { descargaLibros, soloDeEsteMovil, subeCambios } from '../data/sincroniza';
import { miPerfil, type Perfil } from '../data/social';
import type { Libro } from '../domain/libro';
import { alCambiarSesion, iniciaCuenta } from '../platform/cuenta';
import { useBiblioteca } from './biblioteca';

interface EstadoCuenta {
  sesion: Session | null;
  perfil: Perfil | null;
  sincronizando: boolean;
  avisoSync: string | null;
  setPerfil(p: Perfil | null): void;
}

export const useCuenta = create<EstadoCuenta>((set) => ({
  sesion: null,
  perfil: null,
  sincronizando: false,
  avisoSync: null,
  setPerfil: (perfil) => set({ perfil }),
}));

// Último estado que coincide con el servidor. null = aún no se ha descargado: no se sube nada.
let base: Libro[] | null = null;
let temporizador: ReturnType<typeof setTimeout> | undefined;

// Ids que este móvil sabe que están (o estuvieron) en la cuenta de ese usuario. Sirve para distinguir
// un libro nuevo de este móvil de uno que se borró desde otro dispositivo.
const CLAVE_SINC = 'anaquel.sincronizados.v1';
function leeSincronizados(usuario: string): Set<number> | null {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE_SINC) || 'null') as { u?: string; ids?: number[] } | null;
    return d && d.u === usuario && Array.isArray(d.ids) ? new Set(d.ids) : null;
  } catch { return null; }
}
function guardaSincronizados(libros: readonly Libro[]): void {
  const u = useCuenta.getState().sesion?.user.id;
  if (!u) return;
  try { localStorage.setItem(CLAVE_SINC, JSON.stringify({ u, ids: libros.map((l) => l.id) })); } catch { /* sin almacenamiento */ }
}

/** Al entrar: descarga los libros de la cuenta y suma los que solo estaban en este móvil. */
async function alEntrar(loginNuevo: boolean) {
  useCuenta.setState({ sincronizando: true, avisoSync: null });
  try {
    const remotos = await descargaLibros();
    const locales = sinEjemplos(useBiblioteca.getState().libros);
    const usuario = useCuenta.getState().sesion?.user.id ?? '';
    const soloAqui = soloDeEsteMovil(locales, remotos, leeSincronizados(usuario), loginNuevo);
    base = remotos;
    guardaSincronizados(remotos);
    // Sin libros, reemplazaLibros enseña los de ejemplo; esos no se suben nunca.
    useBiblioteca.getState().reemplazaLibros([...remotos, ...soloAqui]); // la suscripción sube soloAqui
    useCuenta.setState({ perfil: await miPerfil() });
  } catch {
    useCuenta.setState({ avisoSync: 'Sin conexión: tus libros se sincronizarán cuando vuelva la red.' });
  } finally {
    useCuenta.setState({ sincronizando: false });
  }
}

/** Al salir: este móvil vuelve a los libros de ejemplo, para que nadie más vea los tuyos. */
function alSalir() {
  base = null;
  useBiblioteca.getState().reemplazaLibros(LIBROS_EJEMPLO);
  useCuenta.setState({ perfil: null, avisoSync: null });
}

function programaSubida() {
  clearTimeout(temporizador);
  temporizador = setTimeout(async () => {
    if (!base || !useCuenta.getState().sesion) return;
    const ahora = sinEjemplos(useBiblioteca.getState().libros);
    try {
      await subeCambios(base, ahora);
      base = ahora;
      guardaSincronizados(ahora);
      useCuenta.setState({ avisoSync: null });
    } catch {
      useCuenta.setState({ avisoSync: 'Sin conexión: tus cambios se subirán cuando vuelva la red.' });
    }
  }, 800);
}

let arrancada = false;
export async function arrancaCuenta(): Promise<void> {
  if (arrancada) return;
  arrancada = true;
  useBiblioteca.subscribe((s, prev) => {
    if (s.libros !== prev.libros && useCuenta.getState().sesion && base) programaSubida();
  });
  window.addEventListener('online', () => {
    if (!useCuenta.getState().sesion) return;
    if (!base) void alEntrar(false); else programaSubida();
  });
  // Hasta leer la sesión guardada, un aviso de sesión es la reanudación (la carga el arranque de
  // abajo); después, un usuario distinto es un inicio de sesión nuevo hecho a mano.
  let arranqueHecho = false;
  alCambiarSesion((s) => {
    const antes = useCuenta.getState().sesion;
    useCuenta.setState({ sesion: s });
    if (!arranqueHecho) return;
    if (s && s.user.id !== antes?.user.id) void alEntrar(true);
    if (!s && antes) alSalir();
  });
  const s = await iniciaCuenta();
  useCuenta.setState({ sesion: s });
  arranqueHecho = true;
  if (s) await alEntrar(false);
}
