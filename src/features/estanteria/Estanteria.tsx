import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import {
  agrupaPorGenero, altoLomoDe, buscar, edicionLomo, tituloLomo, anchoLomoDe, coleccionDe, colorLomo, delAnaquel, esDeseo, ETIQUETA, filtrar, type Coleccion, generoDe, generosDe, conPestana, esPremio, seccionesPorAnio, seccionesPorAutor, tintaPara, type Libro,
} from '../../domain/libro';
import { altosPorColeccion, autorLomo, escalaPara, medidaLomo, olvidaMedidas } from './medida';

/** Interior del lomo: el de su colección (Folio, Blanche, Albin Michel) o el de la edición genérica. */
export function Interior({ libro }: { libro: Libro }) {
  const col = coleccionDe(libro);
  const titulo = (
    <span className="zona"><span className="tit"><span>{tituloLomo(libro.titulo)}</span></span></span>
  );
  const autor = <span className="aut"><span>{autorLomo(libro)}</span></span>;
  if (col === 'folio') return <>{autor}{titulo}<span className="logo">folio</span></>;
  if (col === 'blanche') return <><span className="filete" />{autor}{titulo}<span className="logo">nrf</span><span className="filete" /></>;
  if (col === 'albin') return <>{autor}{titulo}<span className="logo vertical"><span>Albin Michel</span></span></>;
  const edicion = edicionLomo(libro);
  if (edicion === 'clasico') {
    return <><span className="banda" />{titulo}<span className="banda" /></>;
  }
  if (edicion === 'moderno') {
    return <>{titulo}<span className="sello" /></>;
  }
  return <><span className="franja" />{titulo}</>;
}

/** Clase del lomo: la colección si la hay, si no la edición genérica. */
export const claseLomo = (libro: Libro): string => {
  const col = coleccionDe(libro);
  return col ? `ed-${col}` : edicionLomo(libro);
};

type Altos = Partial<Record<Coleccion, number>>;

function Lomo({ libro, onAbrir, altos }: { libro: Libro; onAbrir?: (l: Libro) => void; altos: Altos }) {
  const abrirEnStore = useBiblioteca((s) => s.abrir);
  const abrir = (id: number) => (onAbrir ? onAbrir(libro) : abrirEnStore(id));
  const c = colorLomo(libro);
  const { tinta, oro } = tintaPara(c);
  const { texto, fijo } = medidaLomo(libro);
  // Los de una colección miden todos lo mismo; el resto, lo que pide su texto.
  const col = coleccionDe(libro);
  const comun = col ? altos[col] : undefined;
  const { alto, escala } = comun ? { alto: comun, escala: escalaPara(comun, texto, fijo) } : altoLomoDe(libro.id, texto, fijo);
  const estilo = {
    '--c': c,
    '--t': tinta,
    '--g': oro,
    width: anchoLomoDe(libro),
    height: alto,
    '--esc': escala,
  } as CSSProperties;
  return (
    <button
      className={`lomo ${claseLomo(libro)}${esDeseo(libro) ? ' deseo' : ''}`}
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
function Balda({ libros, etiqueta, onAbrir, soloLectura, altos, deseos, porAnio }: {
  libros: Libro[]; etiqueta?: string; onAbrir?: (l: Libro) => void; soloLectura?: boolean; altos: Altos; deseos?: boolean; porAnio?: boolean;
}) {
  const setFiltroGenero = useBiblioteca((s) => s.setFiltroGenero);
  const riel = useRef<HTMLDivElement>(null);
  const [hayMas, setHayMas] = useState(false);
  const secciones = useMemo(() => (deseos || porAnio ? seccionesPorAnio(libros) : seccionesPorAutor(libros)), [libros, deseos, porAnio]);
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
    <div className={`balda carrusel${etiqueta ? ' con-placa' : ''}${hayMas ? ' hay-mas' : ''}${deseos ? ' balda-deseos' : ''}`}>
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
                <span className={`pestana${sec.etiqueta.length > 8 ? ' larga' : ''}`}><span>{sec.etiqueta}</span></span>
              </span>
            )}
            {sec.libros.map((l) => <Lomo key={l.id} libro={l} onAbrir={onAbrir} altos={altos} />)}
          </Fragment>
        ))}
      </div>
      {etiqueta && (soloLectura || deseos
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
  const consulta = useBiblioteca((s) => s.consulta);
  const soloLectura = ajenos !== undefined;
  const libros = useMemo(() => delAnaquel(ajenos ?? propios), [ajenos, propios]);
  const lista = useMemo(
    () => (soloLectura ? libros : buscar(filtrar(libros, filtro), consulta).filter((l) => !filtroGenero || generoDe(l) === filtroGenero || generosDe(l).includes(filtroGenero))),
    [libros, filtro, filtroGenero, soloLectura, consulta],
  );
  // Lo que quieres y aún no tienes. Los de un premio (Goncourt…) van en la balda de ese premio, junto
  // a los que ya tienes; el resto, en una balda propia al final. Sin filtro de estado.
  const quiero = useMemo(
    () => (soloLectura || filtro !== 'todos' ? [] : buscar(propios.filter(esDeseo), consulta)),
    [propios, soloLectura, filtro, consulta],
  );
  const dePremio = useMemo(
    () => quiero.filter((l) => generosDe(l).some((g) => esPremio(g) && (!filtroGenero || g === filtroGenero))),
    [quiero, filtroGenero],
  );
  const deseos = useMemo(
    () => (filtroGenero ? [] : quiero.filter((l) => !generosDe(l).some(esPremio))),
    [quiero, filtroGenero],
  );

  const ref = useRef<HTMLDivElement>(null);

  // Las alturas de los lomos se miden con las fuentes: al terminar de cargar se vuelven a medir.
  const [fuentes, setFuentes] = useState(0);
  useEffect(() => {
    let vivo = true;
    void document.fonts?.ready.then(() => { if (vivo) { olvidaMedidas(); setFuentes((n) => n + 1); } });
    return () => { vivo = false; };
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const altos = useMemo(() => altosPorColeccion(soloLectura ? libros : propios), [libros, propios, soloLectura, fuentes]);

  // Una balda por género, en carrusel horizontal; la placa lleva el nombre y cuántos hay.
  const baldas = useMemo(
    () => agrupaPorGenero([...lista, ...dePremio], soloLectura ? [] : ordenGeneros)
      .map(({ genero, libros: delGenero }) => {
        const premio = !soloLectura && esPremio(genero);
        // Un deseo solo sale en la balda de su premio, no en sus otros géneros.
        const suyos = premio ? delGenero : delGenero.filter((l) => !esDeseo(l));
        return { libros: suyos, etiqueta: genero, clave: genero, porAnio: premio };
      })
      .filter((b) => b.libros.length > 0),
    [lista, dePremio, ordenGeneros, soloLectura, filtroGenero],
  );

  return (
    <div id="plano" className="plano" ref={ref}>
      {baldas.length === 0 && deseos.length === 0 ? (
        <p className="vacio">
          {libros.length === 0
            ? (soloLectura ? 'Su anaquel aún está vacío.' : 'Tu anaquel está vacío. Escanea el código de barras de tu primer libro.')
            : (consulta.trim() && !soloLectura ? `Ningún libro con «${consulta.trim()}».` : 'Ningún libro en este filtro.')}
        </p>
      ) : (
        <div className="mueble">
          {baldas.map((b) => <Balda key={b.clave} libros={b.libros} etiqueta={b.etiqueta} onAbrir={onAbrir} soloLectura={soloLectura} altos={altos} porAnio={b.porAnio} />)}
          {deseos.length > 0 && <Balda libros={deseos} etiqueta="Lo quiero" onAbrir={onAbrir} altos={altos} deseos />}
        </div>
      )}
    </div>
  );
}
