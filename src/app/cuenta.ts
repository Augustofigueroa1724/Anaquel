import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { esEjemplo, LIBROS_EJEMPLO } from '../data/ejemplos';
import { descargaLibros, subeCambios } from '../data/sincroniza';
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

/** Al entrar: descarga los libros de la cuenta y suma los que solo estaban en este móvil. */
async function alEntrar() {
  useCuenta.setState({ sincronizando: true, avisoSync: null });
  try {
    const remotos = await descargaLibros();
    const locales = useBiblioteca.getState().libros.filter((l) => !esEjemplo(l));
    const ids = new Set(remotos.map((l) => l.id));
    const isbns = new Set(remotos.map((l) => l.isbn).filter(Boolean));
    const soloAqui = locales.filter((l) => !ids.has(l.id) && !(l.isbn && isbns.has(l.isbn)));
    // Cuenta nueva (sin libros): empieza con los de ejemplo para que el anaquel no se vea vacío.
    // Sin el ISBN falso, que no debe parecer real; luego son libros suyos como cualquier otro.
    const semilla = remotos.length === 0 ? LIBROS_EJEMPLO.map((l) => ({ ...l, isbn: '' })) : [];
    base = remotos;
    useBiblioteca.getState().reemplazaLibros([...remotos, ...semilla, ...soloAqui]); // la suscripción los sube
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
    const ahora = useBiblioteca.getState().libros;
    try {
      await subeCambios(base, ahora);
      base = ahora;
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
    if (!base) void alEntrar(); else programaSubida();
  });
  alCambiarSesion((s) => {
    const antes = useCuenta.getState().sesion;
    useCuenta.setState({ sesion: s });
    if (s && s.user.id !== antes?.user.id) void alEntrar();
    if (!s && antes) alSalir();
  });
  const s = await iniciaCuenta();
  useCuenta.setState({ sesion: s });
  if (s) await alEntrar();
}
