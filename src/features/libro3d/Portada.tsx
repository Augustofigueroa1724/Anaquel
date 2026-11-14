import { useState, type CSSProperties } from 'react';
import { tintaPara, type Libro } from '../../domain/libro';

/**
 * Fuentes de la portada, de más nítida a menos: la grande de Open Library por ISBN (de esa edición;
 * con `default=false` da error si no la tiene) y después la guardada (la miniatura de Google Books,
 * de 128 px, que se ve borrosa ampliada). Sin ISBN ni portada, ninguna.
 */
export function fuentesPortada(libro: Pick<Libro, 'isbn' | 'portada'>): string[] {
  const isbn = (libro.isbn || '').replace(/[^0-9X]/gi, '');
  return [
    ...(isbn.length >= 10 ? [`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`] : []),
    ...(libro.portada ? [libro.portada] : []),
  ];
}

/**
 * Portada real si la hay: ocupa la tapa entera sin recortar (las cubiertas son casi 2:3, como la
 * tapa). Prueba las fuentes en orden; una imagen que falla o sale diminuta pasa a la siguiente.
 * Si ninguna sirve, la generada.
 */
export function Portada({ libro }: { libro: Libro }) {
  const fuentes = fuentesPortada(libro);
  const [i, setI] = useState(0);
  const src = libro.portada || libro.portadaBuscada ? fuentes[i] : undefined;
  if (src) {
    return (
      <div className="portada real">
        <img
          key={src}
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setI((n) => n + 1)}
          onLoad={(e) => { if (e.currentTarget.naturalWidth < 60) setI((n) => n + 1); }}
        />
      </div>
    );
  }
  return <PortadaGenerada libro={libro} />;
}

/** Portada generada en la misma tela y tinta que el lomo. Respaldo cuando no hay portada real. */
function PortadaGenerada({ libro }: { libro: Libro }) {
  const { tinta, oro } = tintaPara(libro.color);
  const L = libro.titulo.length;
  const base = { '--c': libro.color, '--t': tinta, '--g': oro } as CSSProperties;

  if (libro.edicion === 'clasico') {
    const fs = L > 22 ? 16 : L > 12 ? 19 : 24;
    return (
      <div className="portada clasico" style={{ ...base, '--fs': `${fs}px` } as CSSProperties}>
        <div className="marco-p">
          <span className="orn" />
          <h3>{libro.titulo}</h3>
          <span className="orn" />
          <p>{libro.autor}</p>
        </div>
      </div>
    );
  }
  if (libro.edicion === 'moderno') {
    const fs = L > 22 ? 14 : L > 12 ? 17 : 24;
    return (
      <div className="portada moderno" style={{ ...base, '--fs': `${fs}px` } as CSSProperties}>
        <span className="bloque" />
        <p>{libro.autor}</p>
        <h3>{libro.titulo}</h3>
      </div>
    );
  }
  const fs = L > 22 ? 22 : L > 12 ? 27 : 38;
  return (
    <div className="portada condensado" style={{ ...base, '--fs': `${fs}px` } as CSSProperties}>
      <h3>{libro.titulo}</h3>
      <p>{libro.autor}</p>
    </div>
  );
}
