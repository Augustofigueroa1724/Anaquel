import { useLayoutEffect, useRef } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import { contar, delAnaquel, FILTROS, type Filtro } from '../../domain/libro';

/** Control segmentado; la pastilla se desliza al chip activo. */
export function Filtros() {
  const filtro = useBiblioteca((s) => s.filtro);
  const setFiltro = useBiblioteca((s) => s.setFiltro);
  const libros = useBiblioteca((s) => s.libros);
  const cuenta = contar(delAnaquel(libros));

  const ref = useRef<HTMLDivElement>(null);
  const indicador = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const coloca = () => {
      const chip = ref.current?.querySelector<HTMLElement>('.chip[aria-pressed="true"]');
      const ind = indicador.current;
      if (!chip || !ind) return;
      ind.style.width = `${chip.offsetWidth}px`;
      ind.style.transform = `translateX(${chip.offsetLeft}px)`;
    };
    coloca();
    window.addEventListener('resize', coloca);
    void document.fonts?.ready.then(coloca);
    return () => window.removeEventListener('resize', coloca);
  }, [filtro]);

  return (
    <div className="filtros" id="filtros" ref={ref}>
      <span className="indicador" ref={indicador} aria-hidden="true" />
      {FILTROS.map((f: { id: Filtro; texto: string }) => (
        <button
          key={f.id}
          className="chip"
          data-f={f.id}
          aria-pressed={filtro === f.id}
          onClick={() => setFiltro(f.id)}
        >
          <span>{f.texto}</span>
          <span className="n">{cuenta[f.id]}</span>
        </button>
      ))}
    </div>
  );
}
