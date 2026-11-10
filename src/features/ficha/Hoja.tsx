import { useRef, useState } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import {
  ESTADOS, ETIQUETA, validaDatos, type DatosLibro, type Estado, type Libro,
} from '../../domain/libro';

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
      <div id="velo" className={`velo ${abiertaHoja ? 'abierto' : ''}`} onClick={cerrar} />
      <div id="hoja" className={`hoja ${abiertaHoja ? 'abierta' : ''}`} role="dialog" aria-modal="true" aria-label="Ficha del libro">
        {mostrado && (
          <Ficha key={mostrado.libro.id} libro={mostrado.libro} enEstante={mostrado.enEstante} />
        )}
      </div>
    </>
  );
}

function Ficha({ libro, enEstante }: { libro: Libro; enEstante: boolean }) {
  const [modo, setModo] = useState<'ver' | 'editar' | 'borrar'>('ver');
  if (modo === 'editar' && enEstante) {
    return <Formulario libro={libro} onListo={() => setModo('ver')} />;
  }
  return <Vista libro={libro} enEstante={enEstante} modo={modo} setModo={setModo} />;
}

function Vista({
  libro, enEstante, modo, setModo,
}: {
  libro: Libro;
  enEstante: boolean;
  modo: 'ver' | 'editar' | 'borrar';
  setModo: (m: 'ver' | 'editar' | 'borrar') => void;
}) {
  const cambiaEstado = useBiblioteca((s) => s.cambiaEstado);
  const cerrar = useBiblioteca((s) => s.cerrar);
  const anadir = useBiblioteca((s) => s.anadirCandidato);
  const descartar = useBiblioteca((s) => s.descartarCandidato);
  const borrar = useBiblioteca((s) => s.borrarLibro);
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
          {ESTADOS.map((e: Estado) => (
            <button key={e} className="chip" aria-pressed={libro.estado === e} onClick={() => cambiaEstado(libro.id, e)}>
              {ETIQUETA[e]}
            </button>
          ))}
        </div>
      )}

      {enEstante && modo === 'borrar' ? (
        <div className="confirmar">
          <p>¿Quitar «{libro.titulo}» de tu anaquel? No se puede deshacer.</p>
          <div className="botones">
            <button className="btn sec" onClick={() => setModo('ver')}>Cancelar</button>
            <button className="btn" onClick={() => borrar(libro.id)}>Sí, quitar</button>
          </div>
        </div>
      ) : (
        <>
          <div className="botones">
            {enEstante ? (
              <>
                <button className="btn sec" onClick={() => setModo('editar')}>Editar</button>
                <button className="btn" onClick={cerrar}>Listo</button>
              </>
            ) : (
              <>
                <button className="btn sec" onClick={descartar}>Cancelar</button>
                {repetido
                  ? <p className="nota">Este libro ya está en tu anaquel.</p>
                  : <button className="btn" onClick={anadir}>Añadir al anaquel</button>}
              </>
            )}
          </div>
          {enEstante && (
            <button className="quitar" onClick={() => setModo('borrar')}>Quitar del anaquel</button>
          )}
          {!enEstante && busqueda === 'buscando' && <p className="nota">Buscando datos del libro…</p>}
          {!enEstante && busqueda === 'no-encontrado' && <p className="nota">No encontramos este ISBN. Puedes añadirlo igualmente.</p>}
          {!enEstante && busqueda === 'sin-red' && <p className="nota">Sin conexión: el libro se añade sin datos.</p>}
        </>
      )}
    </>
  );
}

function Formulario({ libro, onListo }: { libro: Libro; onListo: () => void }) {
  const editar = useBiblioteca((s) => s.editarLibro);
  const [datos, setDatos] = useState<DatosLibro>({
    titulo: libro.titulo,
    autor: libro.autor,
    anio: libro.anio,
    isbn: libro.isbn,
    estado: libro.estado,
  });
  const [error, setError] = useState<string | null>(null);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const limpio: DatosLibro = { ...datos, titulo: datos.titulo.trim(), autor: datos.autor.trim(), isbn: datos.isbn.trim() };
    const fallo = validaDatos(limpio);
    if (fallo) { setError(fallo); return; }
    editar(libro.id, limpio);
    onListo();
  }

  return (
    <form onSubmit={guardar} noValidate>
      <p className="eti">Editar libro</p>
      <label className="campo">
        <span>Título</span>
        <input value={datos.titulo} onChange={(e) => setDatos({ ...datos, titulo: e.target.value })} autoComplete="off" />
      </label>
      <label className="campo">
        <span>Autor</span>
        <input value={datos.autor} onChange={(e) => setDatos({ ...datos, autor: e.target.value })} autoComplete="off" />
      </label>
      <label className="campo">
        <span>Año</span>
        <input
          type="number"
          inputMode="numeric"
          value={datos.anio || ''}
          onChange={(e) => setDatos({ ...datos, anio: e.target.value === '' ? 0 : Number(e.target.value) })}
        />
      </label>
      <label className="campo">
        <span>ISBN</span>
        <input inputMode="numeric" value={datos.isbn} onChange={(e) => setDatos({ ...datos, isbn: e.target.value })} />
      </label>
      <div className="estados" role="group" aria-label="Estado de lectura">
        {ESTADOS.map((e) => (
          <button key={e} type="button" className="chip" aria-pressed={datos.estado === e} onClick={() => setDatos({ ...datos, estado: e })}>
            {ETIQUETA[e]}
          </button>
        ))}
      </div>
      {error && <p className="nota" role="alert">{error}</p>}
      <div className="botones">
        <button type="button" className="btn sec" onClick={onListo}>Cancelar</button>
        <button type="submit" className="btn">Guardar</button>
      </div>
    </form>
  );
}
