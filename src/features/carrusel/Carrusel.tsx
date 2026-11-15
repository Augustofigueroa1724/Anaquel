import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import {
  agrupaPorGenero, anchoLomoDe, buscar, colorLomo, delAnaquel, ETIQUETA, filtrar, generoDe, generosDe, tintaPara, type Libro,
} from '../../domain/libro';
import { claseLomo, Interior } from '../estanteria/Estanteria';
import { altosPorColeccion, escalaPara, medidaLomo } from '../estanteria/medida';
import { Portada } from '../libro3d/Portada';

/** Tapa de 150 × 228 px (2:3, como las cubiertas). */
const ALTO = 228;
/** Cuántos libros a cada lado del centro se dibujan (el resto no se ve). */
const VENTANA = 5;
const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Pose de un libro a `d` posiciones del centro (negativo = izquierda). */
export function poseCarrusel(d: number): { x: number; z: number; giro: number } {
  const a = Math.abs(d);
  const k = Math.min(a, 1);
  const lejos = Math.max(0, a - 1);
  return {
    // El primero de cada lado se aparta lo justo para no pisar al del centro; los demás se
    // escalonan dejando ver un buen trozo de portada, no solo el lomo.
    x: Math.sign(d) * (k * 112 + lejos * 60),
    z: -k * 90 - lejos * 14,
    // A la izquierda enseña portada y lomo; a la derecha se da la vuelta: contraportada y lomo hacia fuera.
    giro: d < 0 ? k * 50 : k * 130,
  };
}

function LibroCarrusel({ libro, d, onToca }: { libro: Libro; d: number; onToca: () => void }) {
  const c = colorLomo(libro);
  const { tinta, oro } = tintaPara(c);
  const t = anchoLomoDe(libro);
  const { texto, fijo } = medidaLomo(libro);
  const { x, z, giro } = poseCarrusel(d);
  const estilo = {
    '--t': `${t}px`, '--c': c, '--t-tinta': tinta,
    transform: `translateX(${x}px) translateZ(${z}px) rotateY(${giro}deg)`,
    zIndex: 100 - Math.round(Math.abs(d) * 10),
  } as CSSProperties;
  const centrado = Math.abs(d) < 0.5;
  return (
    <button
      type="button"
      className="libro-c"
      style={estilo}
      onClick={onToca}
      aria-label={`${libro.titulo}, ${libro.autor}. ${ETIQUETA[libro.estado]}${centrado ? '. Abrir ficha' : ''}`}
      aria-current={centrado ? 'true' : undefined}
      tabIndex={centrado ? 0 : -1}
    >
      <span className="cara-c tras" />
      <span className={`cara-c canto-c lomo ${claseLomo(libro)}`} style={{ '--c': c, '--t': tinta, '--g': oro, '--esc': escalaPara(ALTO, texto, fijo) } as CSSProperties}>
        <Interior libro={libro} />
      </span>
      <span className="cara-c tapa-c"><Portada libro={libro} /></span>
      <span className="sombra-c" />
    </button>
  );
}

/**
 * Vista alternativa a la estantería: los libros pasan en un carrusel 3D (rolodex horizontal).
 * El del centro va de frente con su portada; se pasa arrastrando, con las flechas o tocando uno
 * de los lados, y al tocar el del centro se abre su ficha.
 */
export function Carrusel() {
  const propios = useBiblioteca((s) => s.libros);
  const filtro = useBiblioteca((s) => s.filtro);
  const filtroGenero = useBiblioteca((s) => s.filtroGenero);
  const setFiltroGenero = useBiblioteca((s) => s.setFiltroGenero);
  const consulta = useBiblioteca((s) => s.consulta);
  const ordenGeneros = useBiblioteca((s) => s.ordenGeneros);
  const abrir = useBiblioteca((s) => s.abrir);

  const libros = useMemo(() => delAnaquel(propios), [propios]);
  // Decide qué autores van solo con el apellido en los lomos, igual que en la estantería.
  useMemo(() => altosPorColeccion(libros), [libros]);
  const base = useMemo(() => buscar(filtrar(libros, filtro), consulta), [libros, filtro, consulta]);
  const generos = useMemo(() => agrupaPorGenero(base, ordenGeneros).map((g) => g.genero), [base, ordenGeneros]);
  // Mismo orden que la estantería: por género y, dentro, tal como están; sin repetir libros.
  const lista = useMemo(() => {
    const vistos = new Set<number>();
    return agrupaPorGenero(base, ordenGeneros)
      .filter((g) => !filtroGenero || g.genero === filtroGenero)
      .flatMap((g) => g.libros)
      .filter((l) => (vistos.has(l.id) ? false : (vistos.add(l.id), true)));
  }, [base, ordenGeneros, filtroGenero]);

  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const raf = useRef(0);
  const pon = useCallback((p: number) => { posRef.current = p; setPos(p); }, []);

  const ve = useCallback((destino: number) => {
    const fin = Math.max(0, Math.min(lista.length - 1, Math.round(destino)));
    cancelAnimationFrame(raf.current);
    if (sinMovimiento()) { pon(fin); return; }
    const paso = () => {
      const dif = fin - posRef.current;
      if (Math.abs(dif) < 0.004) { pon(fin); return; }
      pon(posRef.current + dif * 0.18);
      raf.current = requestAnimationFrame(paso);
    };
    paso();
  }, [lista.length, pon]);

  // Al cambiar la lista (filtro, búsqueda, género) se vuelve al principio.
  const firma = lista.length ? `${lista.length}:${lista[0].id}:${filtroGenero ?? ''}:${filtro}:${consulta}` : '';
  useEffect(() => { cancelAnimationFrame(raf.current); pon(0); }, [firma, pon]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // Arrastre: sigue al dedo y al soltar encaja en un libro con algo de inercia.
  const gesto = useRef({ abajo: false, movido: false, x0: 0, p0: 0, xu: 0, tu: 0, vel: 0 });
  const alBajar = (e: React.PointerEvent) => {
    cancelAnimationFrame(raf.current);
    gesto.current = { abajo: true, movido: false, x0: e.clientX, p0: posRef.current, xu: e.clientX, tu: performance.now(), vel: 0 };
  };
  const alMover = (e: React.PointerEvent) => {
    const g = gesto.current;
    if (!g.abajo) return;
    const dx = e.clientX - g.x0;
    if (!g.movido && Math.abs(dx) > 6) { g.movido = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }
    if (!g.movido) return;
    const ahora = performance.now();
    g.vel = (e.clientX - g.xu) / Math.max(1, ahora - g.tu);
    g.xu = e.clientX; g.tu = ahora;
    pon(Math.max(-0.4, Math.min(lista.length - 0.6, g.p0 - dx / 88)));
  };
  const alSoltar = () => {
    const g = gesto.current;
    if (!g.abajo) return;
    g.abajo = false;
    if (g.movido) ve(posRef.current - g.vel * 3.2);
    setTimeout(() => { g.movido = false; }, 0);
  };

  const centro = Math.max(0, Math.min(lista.length - 1, Math.round(pos)));
  const actual = lista[centro];
  const toca = (i: number, libro: Libro) => {
    if (gesto.current.movido) return;
    if (i === centro) abrir(libro.id); else ve(i);
  };

  return (
    <div id="plano" className="plano vista-carrusel">
      {generos.length > 1 && (
        <div className="generos-c" role="group" aria-label="Género">
          <button type="button" aria-pressed={!filtroGenero} onClick={() => setFiltroGenero(null)}>Todos</button>
          {generos.map((g) => (
            <button key={g} type="button" aria-pressed={filtroGenero === g} onClick={() => setFiltroGenero(filtroGenero === g ? null : g)}>{g}</button>
          ))}
        </div>
      )}
      {lista.length === 0 ? (
        <p className="vacio">
          {libros.length === 0 ? 'Tu anaquel está vacío. Escanea el código de barras de tu primer libro.'
            : consulta.trim() ? `Ningún libro con «${consulta.trim()}».` : 'Ningún libro en este filtro.'}
        </p>
      ) : (
        <>
          <div className="marco-c">
            <div
              className="escena-c"
              onPointerDown={alBajar}
              onPointerMove={alMover}
              onPointerUp={alSoltar}
              onPointerCancel={alSoltar}
              onKeyDown={(e) => { if (e.key === 'ArrowRight') ve(centro + 1); if (e.key === 'ArrowLeft') ve(centro - 1); }}
            >
              {lista.map((l, i) => (Math.abs(i - pos) > VENTANA ? null : (
                <LibroCarrusel key={l.id} libro={l} d={i - pos} onToca={() => toca(i, l)} />
              )))}
            </div>
            <button type="button" className="flecha-c iz" onClick={() => ve(centro - 1)} disabled={centro === 0} aria-label="Libro anterior">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button type="button" className="flecha-c de" onClick={() => ve(centro + 1)} disabled={centro === lista.length - 1} aria-label="Libro siguiente">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
          <p className="pos-c">{centro + 1} / {lista.length}</p>
          {actual && (
            <button type="button" className="ficha-c" onClick={() => abrir(actual.id)} aria-label={`Abrir la ficha de ${actual.titulo}`}>
              <span className="eti">{ETIQUETA[actual.estado]}{(generosDe(actual).length ? generosDe(actual) : [generoDe(actual)]).map((g) => ` · ${g}`).join('')}</span>
              <b>{actual.titulo}</b>
              <span className="autor">{[actual.autor, actual.anio || null].filter(Boolean).join(' · ')}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
