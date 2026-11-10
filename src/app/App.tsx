import { useEffect, useState } from 'react';
import { Escanear } from '../features/escaner/Escanear';
import { Estanteria } from '../features/estanteria/Estanteria';
import { Filtros } from '../features/estanteria/Filtros';
import { Hoja } from '../features/ficha/Hoja';
import { LibroVuelo } from '../features/libro3d/LibroVuelo';
import { filtrar } from '../domain/libro';
import { useBiblioteca } from './biblioteca';

type Pestana = 'estanteria' | 'escanear';

export default function App() {
  const [pestana, setPestana] = useState<Pestana>('estanteria');
  const libros = useBiblioteca((s) => s.libros);
  const filtro = useBiblioteca((s) => s.filtro);
  const cerrar = useBiblioteca((s) => s.cerrar);
  const visibles = filtrar(libros, filtro).length;

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar(); };
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
          <span className="cuenta" id="cuenta">
            {visibles} {visibles === 1 ? 'libro' : 'libros'}
          </span>
        </header>

        {pestana === 'estanteria' && <Filtros />}

        <main>
          {pestana === 'estanteria' ? (
            <section id="estanteria">
              <Estanteria />
              <div className="pista" id="pista">Toca un libro para sacarlo del anaquel</div>
            </section>
          ) : (
            <section id="escanear"><Escanear /></section>
          )}
        </main>

        <nav>
          <button
            id="tab-estanteria"
            aria-current={pestana === 'estanteria' ? 'page' : undefined}
            onClick={() => setPestana('estanteria')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 20h18M5 20V6h3v14M8 20V4h3v16M13.5 20l-1.8-13.2 2.9-.4L16.4 19.6M17 20V9h3v11" /></svg>
            Anaquel
          </button>
          <button
            id="tab-escanear"
            aria-current={pestana === 'escanear' ? 'page' : undefined}
            onClick={() => setPestana('escanear')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M8 8v8M11 8v8M13.5 8v8M16 8v8" /></svg>
            Escanear
          </button>
        </nav>
      </div>

      <LibroVuelo />
      <Hoja />
    </>
  );
}
