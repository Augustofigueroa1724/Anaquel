import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import {
  agrupaPorGenero, altoLomo, anchoLomo, ETIQUETA, filtrar, generoDe, repartePorBaldas, tintaPara, type Libro,
} from '../../domain/libro';

/** Interior del lomo según la edición (clásico, moderno o condensado). */
export function Interior({ libro }: { libro: Libro }) {
  const titulo = (
    <span className="zona"><span className="tit"><span>{libro.titulo}</span></span></span>
  );
  if (libro.edicion === 'clasico') {
    return <><span className="banda" />{titulo}<span className="banda" /></>;
  }
  if (libro.edicion === 'moderno') {
    return <>{titulo}<span className="sello" /></>;
  }
  return <><span className="franja" />{titulo}</>;
}

function Lomo({ libro }: { libro: Libro }) {
  const abrir = useBiblioteca((s) => s.abrir);
  const { tinta, oro } = tintaPara(libro.color);
  const estilo = {
    '--c': libro.color,
    '--t': tinta,
    '--g': oro,
    width: anchoLomo(libro.id),
    height: altoLomo(libro.id),
  } as CSSProperties;
  return (
    <button
      className={`lomo ${libro.edicion}`}
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

function Balda({ libros, etiqueta }: { libros: Libro[]; etiqueta?: string }) {
  const setFiltroGenero = useBiblioteca((s) => s.setFiltroGenero);
  return (
    <div className={`balda${etiqueta ? ' con-placa' : ''}`}>
      <span className="techo" />
      <span className="pared izq" />
      <span className="pared der" />
      <span className="suelo" />
      <span className="luz" />
      <span className="halo" />
      {libros.map((l) => <Lomo key={l.id} libro={l} />)}
      {etiqueta && (
        <button className="placa" onClick={() => setFiltroGenero(etiqueta)} aria-label={`Ver solo ${etiqueta}`}>
          {etiqueta}
        </button>
      )}
    </div>
  );
}

/** Estantería HTML: vista principal. Las baldas se reparten según el ancho real de la pantalla. */
export function Estanteria() {
  const libros = useBiblioteca((s) => s.libros);
  const filtro = useBiblioteca((s) => s.filtro);
  const filtroGenero = useBiblioteca((s) => s.filtroGenero);
  const lista = useMemo(
    () => filtrar(libros, filtro).filter((l) => !filtroGenero || generoDe(l) === filtroGenero),
    [libros, filtro, filtroGenero],
  );

  const ref = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(390);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mide = () => setAncho(el.clientWidth || 390);
    mide();
    const observador = new ResizeObserver(mide);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // Cada género ocupa sus propias baldas; la primera lleva la placa con el nombre.
  const baldas = useMemo(() => {
    const util = Math.max(120, ancho - 106);
    return agrupaPorGenero(lista).flatMap(({ genero, libros: delGenero }) =>
      repartePorBaldas(delGenero, util).map((b, i) => ({ libros: b, etiqueta: i === 0 ? genero : undefined, clave: `${genero}-${i}` })),
    );
  }, [lista, ancho]);

  return (
    <div id="plano" className="plano" ref={ref}>
      {lista.length === 0 ? (
        <p className="vacio">Ningún libro en este filtro.</p>
      ) : (
        <div className="mueble">
          {baldas.map((b) => <Balda key={b.clave} libros={b.libros} etiqueta={b.etiqueta} />)}
        </div>
      )}
    </div>
  );
}
