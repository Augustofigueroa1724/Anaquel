import { useRef } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import { ESTADOS, ETIQUETA, type Libro } from '../../domain/libro';

/** Ficha del libro (hoja inferior). Muestra el último libro abierto mientras se cierra. */
export function Hoja() {
  const abierto = useBiblioteca((s) => s.abierto);
  const libroEnEstante = useBiblioteca((s) => s.libros.find((l) => l.id === abierto) ?? null);
  const candidato = useBiblioteca((s) => s.candidato);
  const actual = libroEnEstante ?? candidato;

  const ultimo = useRef<{ libro: Libro; enEstante: boolean } | null>(null);
  if (actual) ultimo.current = { libro: actual, enEstante: libroEnEstante !== null };

  const cerrar = useBiblioteca((s) => s.cerrar);
  const abiertaHoja = actual !== null;
  const mostrado = ultimo.current;

  return (
    <>
      <div className={`velo ${abiertaHoja ? 'abierto' : ''}`} onClick={cerrar} />
      <div className={`hoja ${abiertaHoja ? 'abierta' : ''}`} role="dialog" aria-modal="true" aria-label="Ficha del libro">
        {mostrado && <Ficha libro={mostrado.libro} enEstante={mostrado.enEstante} />}
      </div>
    </>
  );
}

function Ficha({ libro, enEstante }: { libro: Libro; enEstante: boolean }) {
  const cambiaEstado = useBiblioteca((s) => s.cambiaEstado);
  const cerrar = useBiblioteca((s) => s.cerrar);
  const anadir = useBiblioteca((s) => s.anadirCandidato);
  const descartar = useBiblioteca((s) => s.descartarCandidato);
  const repetido = useBiblioteca((s) => s.libros.some((l) => l.isbn === libro.isbn));
  const busqueda = useBiblioteca((s) => s.busqueda);

  return (
    <>
      <p className="eti">{ETIQUETA[libro.estado]}</p>
      <h2>{libro.titulo}</h2>
      <p className="autor">{libro.autor}</p>
      <div className="fila"><span>Año</span><span>{libro.anio || '—'}</span></div>
      <div className="fila"><span>ISBN</span><span className="mono">{libro.isbn}</span></div>
      {enEstante && (
        <div className="estados" role="group" aria-label="Estado de lectura">
          {ESTADOS.map((e) => (
            <button
              key={e}
              className="chip"
              aria-pressed={libro.estado === e}
              onClick={() => cambiaEstado(libro.id, e)}
            >
              {ETIQUETA[e]}
            </button>
          ))}
        </div>
      )}
      <div className="botones">
        {enEstante ? (
          <>
            <button className="btn sec">Prestar</button>
            <button className="btn" onClick={cerrar}>Listo</button>
          </>
        ) : (
          <>
            <button className="btn sec" onClick={descartar}>Cancelar</button>
            {!repetido && busqueda === 'buscando' && <p className="nota">Buscando datos del libro…</p>}
            {!repetido && busqueda === 'no-encontrado' && <p className="nota">No encontramos este ISBN. Puedes añadirlo igualmente.</p>}
            {!repetido && busqueda === 'sin-red' && <p className="nota">Sin conexión: el libro se añade sin datos.</p>}
            {repetido
              ? <p className="nota">Este libro ya está en tu anaquel.</p>
              : <button className="btn" onClick={anadir}>Añadir al anaquel</button>}
          </>
        )}
      </div>
    </>
  );
}
