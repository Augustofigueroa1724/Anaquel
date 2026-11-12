import { useMemo } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import { esDeseo } from '../../domain/libro';

/** Lista de deseos: libros que quieres pero aún no tienes. */
export function Deseos() {
  // Se selecciona la lista estable y se filtra aparte: un selector que devuelve
  // un array nuevo en cada render hace que React entre en bucle (error 185).
  const libros = useBiblioteca((s) => s.libros);
  const deseos = useMemo(() => libros.filter(esDeseo), [libros]);
  const abrir = useBiblioteca((s) => s.abrir);
  return (
    <div className="lista-deseos">
      <h2 className="titulo-seccion">Lo quiero</h2>
      {deseos.length === 0 ? (
        <p className="vacio">Aún no hay deseos. Al escanear un libro, pulsa «Lo quiero» para guardarlo aquí.</p>
      ) : (
        <ul>
          {deseos.map((l) => (
            <li key={l.id}>
              <button onClick={() => abrir(l.id)}>
                <span className="mini-tela" style={{ background: l.color }} aria-hidden="true" />
                <span className="texto"><b>{l.titulo}</b><span>{[l.autor, l.anio || null].filter(Boolean).join(' · ')}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
