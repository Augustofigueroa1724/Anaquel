import { Fragment, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import {
  agrupaPorGenero, altoLomo, anchoLomo, coleccionDe, colorLomo, delAnaquel, ETIQUETA, filtrar, generoDe, conPestana, seccionesPorAutor, tintaPara, type Libro,
} from '../../domain/libro';

/** Interior del lomo: el de su colección (Folio, Blanche, Albin Michel) o el de la edición genérica. */
export function Interior({ libro }: { libro: Libro }) {
  const col = coleccionDe(libro);
  const titulo = (
    <span className="zona"><span className="tit"><span>{libro.titulo}</span></span></span>
  );
  const autor = <span className="aut"><span>{libro.autor}</span></span>;
  if (col === 'folio') return <>{autor}{titulo}<span className="logo">folio</span></>;
  if (col === 'blanche') return <><span className="filete" />{autor}{titulo}<span className="logo">nrf</span><span className="filete" /></>;
  if (col === 'albin') return <>{autor}{titulo}<span className="logo vertical"><span>Albin Michel</span></span></>;
  if (libro.edicion === 'clasico') {
    return <><span className="banda" />{titulo}<span className="banda" /></>;
  }
  if (libro.edicion === 'moderno') {
    return <>{titulo}<span className="sello" /></>;
  }
  return <><span className="franja" />{titulo}</>;
}

/** Clase del lomo: la colección si la hay, si no la edición genérica. */
export const claseLomo = (libro: Libro): string => {
  const col = coleccionDe(libro);
  return col ? `ed-${col}` : libro.edicion;
};

function Lomo({ libro, onAbrir }: { libro: Libro; onAbrir?: (l: Libro) => void }) {
  const abrirEnStore = useBiblioteca((s) => s.abrir);
  const abrir = (id: number) => (onAbrir ? onAbrir(libro) : abrirEnStore(id));
  const c = colorLomo(libro);
  const { tinta, oro } = tintaPara(c);
  const estilo = {
    '--c': c,
    '--t': tinta,
    '--g': oro,
    width: anchoLomo(libro.id),
    height: altoLomo(libro.id),
  } as CSSProperties;
  return (
    <button
      className={`lomo ${claseLomo(libro)}`}
      data-id={libro.id}
      data-st={libro.estado}
      style={estilo}
      onClick={() => abrir(libro.id)}
      aria-label={`${libro.titulo}, ${libro.autor}. ${ETIQUETA[libro.estado]}`}
    >
      <Interior libro={libro} />
      {libro.estado === 'leyendo' && <span className="cinta" aria-hidden="true" />}
    </button>
  );
}

/**
 * Una balda por género, en carrusel: los lomos van alineados a la izquierda y la balda
 * se desliza en horizontal, sin límite de libros (100 novelas caben en la misma balda).
 */
function Balda({ libros, etiqueta, onAbrir, soloLectura }: {
  libros: Libro[]; etiqueta?: string; onAbrir?: (l: Libro) => void; soloLectura?: boolean;
}) {
  const setFiltroGenero = useBiblioteca((s) => s.setFiltroGenero);
  const riel = useRef<HTMLDivElement>(null);
  const [hayMas, setHayMas] = useState(false);
  const secciones = useMemo(() => seccionesPorAutor(libros), [libros]);
  useLayoutEffect(() => {
    const el = riel.current;
    if (!el) return;
    const mira = () => setHayMas(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
    mira();
    el.addEventListener('scroll', mira, { passive: true });
    const ro = new ResizeObserver(mira);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', mira); ro.disconnect(); };
  }, [libros.length]);
  return (
    <div className={`balda carrusel${etiqueta ? ' con-placa' : ''}${hayMas ? ' hay-mas' : ''}`}>
      <span className="techo" />
      <span className="pared izq" />
      <span className="pared der" />
      <span className="suelo" />
      <span className="luz" />
      <span className="halo" />
      <div className="riel" ref={riel}>
        {secciones.map((sec) => (
          <Fragment key={`${sec.tipo}:${sec.etiqueta}`}>
            {conPestana(sec) && (
              <span className={`separador ${sec.tipo}`} aria-hidden="true">
                <span className="pestana"><span>{sec.etiqueta}</span></span>
              </span>
            )}
            {sec.libros.map((l) => <Lomo key={l.id} libro={l} onAbrir={onAbrir} />)}
          </Fragment>
        ))}
      </div>
      {etiqueta && (soloLectura
        ? <span className="placa">{etiqueta} · {libros.length}</span>
        : (
          <button className="placa" onClick={() => setFiltroGenero(etiqueta)} aria-label={`Ver solo ${etiqueta}`}>
            {etiqueta} · {libros.length}
          </button>
        ))}
    </div>
  );
}

/** Estantería HTML: vista principal. Las baldas se reparten según el ancho real de la pantalla. */
export function Estanteria({ ajenos, onAbrir }: { ajenos?: Libro[]; onAbrir?: (l: Libro) => void } = {}) {
  const propios = useBiblioteca((s) => s.libros);
  const filtro = useBiblioteca((s) => s.filtro);
  const filtroGenero = useBiblioteca((s) => s.filtroGenero);
  const ordenGeneros = useBiblioteca((s) => s.ordenGeneros);
  const soloLectura = ajenos !== undefined;
  const libros = useMemo(() => delAnaquel(ajenos ?? propios), [ajenos, propios]);
  const lista = useMemo(
    () => (soloLectura ? libros : filtrar(libros, filtro).filter((l) => !filtroGenero || generoDe(l) === filtroGenero)),
    [libros, filtro, filtroGenero, soloLectura],
  );

  const ref = useRef<HTMLDivElement>(null);

  // Una balda por género, en carrusel horizontal; la placa lleva el nombre y cuántos hay.
  const baldas = useMemo(
    () => agrupaPorGenero(lista, soloLectura ? [] : ordenGeneros).map(({ genero, libros: delGenero }) => ({ libros: delGenero, etiqueta: genero, clave: genero })),
    [lista, ordenGeneros, soloLectura],
  );

  return (
    <div id="plano" className="plano" ref={ref}>
      {lista.length === 0 ? (
        <p className="vacio">
          {libros.length === 0
            ? (soloLectura ? 'Su anaquel aún está vacío.' : 'Tu anaquel está vacío. Escanea el código de barras de tu primer libro.')
            : 'Ningún libro en este filtro.'}
        </p>
      ) : (
        <div className="mueble">
          {baldas.map((b) => <Balda key={b.clave} libros={b.libros} etiqueta={b.etiqueta} onAbrir={onAbrir} soloLectura={soloLectura} />)}
        </div>
      )}
    </div>
  );
}
