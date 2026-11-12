import { useEffect, useState } from 'react';
import { Amigos } from '../features/amigos/Amigos';
import { Ajustes } from '../features/ajustes/Ajustes';
import { Deseos } from '../features/deseos/Deseos';
import { Escanear } from '../features/escaner/Escanear';
import { Estanteria } from '../features/estanteria/Estanteria';
import { Filtros } from '../features/estanteria/Filtros';
import { GeneroActivo } from '../features/estanteria/GeneroActivo';
import { Hoja } from '../features/ficha/Hoja';
import { LibroVuelo } from '../features/libro3d/LibroVuelo';
import { delAnaquel, esDeseo, filtrar } from '../domain/libro';
import { useBiblioteca } from './biblioteca';
import { arrancaCuenta, useCuenta } from './cuenta';

type Pestana = 'estanteria' | 'deseos' | 'escanear' | 'amigos';

const ICONOS: Record<Pestana, string> = {
  estanteria: 'M3 20h18M5 20V6h3v14M8 20V4h3v16M13.5 20l-1.8-13.2 2.9-.4L16.4 19.6M17 20V9h3v11',
  deseos: 'M7 3.5h10a1 1 0 0 1 1 1V21l-6-4-6 4V4.5a1 1 0 0 1 1-1z',
  escanear: 'M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M8 8v8M11 8v8M13.5 8v8M16 8v8',
  amigos: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.3 3.3-5.5 6.5-5.5s5.9 2.2 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.3 2.6 3.6 5.2',
};
const NOMBRES: Record<Pestana, string> = { estanteria: 'Anaquel', deseos: 'Lo quiero', escanear: 'Escanear', amigos: 'Amigos' };

export default function App() {
  const [pestana, setPestana] = useState<Pestana>('estanteria');
  const [ajustes, setAjustes] = useState(false);
  const libros = useBiblioteca((s) => s.libros);
  const filtro = useBiblioteca((s) => s.filtro);
  const cerrar = useBiblioteca((s) => s.cerrar);
  const visibles = filtrar(delAnaquel(libros), filtro).length;
  const deseos = libros.filter(esDeseo).length;
  const sesion = useCuenta((s) => s.sesion);
  const datosUsuario = sesion?.user.user_metadata as { avatar_url?: string; picture?: string; full_name?: string; name?: string } | undefined;
  const foto = datosUsuario?.avatar_url || datosUsuario?.picture;
  const nombreUsuario = datosUsuario?.full_name || datosUsuario?.name || sesion?.user.email || '';

  useEffect(() => { void arrancaCuenta(); }, []);
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => { if (e.key === 'Escape') { cerrar(); setAjustes(false); } };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [cerrar]);

  return (
    <>
      <div className="app">
        <header>
          <div className="titulo">
            <span className="sobre">Mi biblioteca</span>
            <span className="marca">Anaquel</span>
          </div>
          <div className="cab-derecha">
            {sesion ? (
              <button className="avatar" onClick={() => setAjustes(true)} aria-label={`Tu cuenta: ${nombreUsuario}`}>
                {foto ? <img src={foto} alt="" referrerPolicy="no-referrer" /> : <span>{(nombreUsuario || '?').trim().charAt(0).toUpperCase()}</span>}
              </button>
            ) : (
            <button className="rueda" onClick={() => setAjustes(true)} aria-label="Ajustes y cuenta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
            </button>
            )}
            {pestana === 'estanteria' && (
              <span className="cuenta" id="cuenta">{visibles} {visibles === 1 ? 'libro' : 'libros'}</span>
            )}
          </div>
        </header>

        {pestana === 'estanteria' && <Filtros />}
        {pestana === 'estanteria' && <GeneroActivo />}

        <main>
          {pestana === 'estanteria' && (
            <section id="estanteria">
              <Estanteria />
              <div className="pista" id="pista">Toca un libro para sacarlo del anaquel</div>
            </section>
          )}
          {pestana === 'deseos' && <section className="desplaza"><Deseos /></section>}
          {pestana === 'escanear' && <section id="escanear"><Escanear /></section>}
          {pestana === 'amigos' && <section className="desplaza"><Amigos /></section>}
        </main>

        <nav>
          {(Object.keys(NOMBRES) as Pestana[]).map((p) => (
            <button
              key={p}
              id={p === 'estanteria' ? 'tab-estanteria' : p === 'escanear' ? 'tab-escanear' : `tab-${p}`}
              aria-current={pestana === p ? 'page' : undefined}
              onClick={() => setPestana(p)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONOS[p]} /></svg>
              {NOMBRES[p]}{p === 'deseos' && deseos > 0 ? ` · ${deseos}` : ''}
            </button>
          ))}
        </nav>
      </div>

      <LibroVuelo />
      <Hoja />
      {ajustes && <Ajustes onCerrar={() => setAjustes(false)} />}
    </>
  );
}
