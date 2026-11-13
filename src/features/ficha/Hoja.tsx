import { useEffect, useRef, useState } from 'react';
import { SelectorGenero } from './SelectorGenero';
import { useBiblioteca } from '../../app/biblioteca';
import {
  ESTADOS, esDeseo, ETIQUETA, formateaFecha, hoyIso, validaDatos, validaPrestamo,
  type DatosLibro, type Estado, type Libro,
} from '../../domain/libro';

/** Valoración de 1 a 5 en latón. Tocar la misma estrella la quita. */
function Valoracion({ libro }: { libro: Libro }) {
  const valorar = useBiblioteca((s) => s.valorar);
  const v = libro.valoracion ?? 0;
  return (
    <div className="valoracion" role="group" aria-label="Valoración">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className={n <= v ? 'llena' : ''}
          aria-label={`${n} de 5`}
          aria-pressed={n === v}
          onClick={() => valorar(libro.id, n === v ? undefined : n)}
        >★</button>
      ))}
    </div>
  );
}

type Modo = 'ver' | 'editar' | 'borrar' | 'prestar';

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
  const [modo, setModo] = useState<Modo>('ver');
  if (modo === 'editar' && enEstante) {
    return <Formulario libro={libro} onListo={() => setModo('ver')} />;
  }
  return <Vista libro={libro} enEstante={enEstante} modo={modo} setModo={setModo} />;
}

/** Cabecera común: estado y género, título, autor y año en una línea. */
function Cabecera({ libro }: { libro: Libro }) {
  return (
    <>
      <p className="eti">{esDeseo(libro) ? 'Lo quiero' : ETIQUETA[libro.estado]}{libro.genero ? ` · ${libro.genero}` : ''}</p>
      <h2>{libro.titulo}</h2>
      <p className="autor">{[libro.autor, libro.anio || null].filter(Boolean).join(' · ')}</p>
    </>
  );
}

function Vista({
  libro, enEstante, modo, setModo,
}: {
  libro: Libro;
  enEstante: boolean;
  modo: Modo;
  setModo: (m: Modo) => void;
}) {
  const cambiaEstado = useBiblioteca((s) => s.cambiaEstado);
  const cerrar = useBiblioteca((s) => s.cerrar);
  const anadir = useBiblioteca((s) => s.anadirCandidato);
  const descartar = useBiblioteca((s) => s.descartarCandidato);
  const borrar = useBiblioteca((s) => s.borrarLibro);
  const devolver = useBiblioteca((s) => s.devolver);
  const repetido = useBiblioteca((s) => s.libros.some((l) => l.isbn === libro.isbn));
  const busqueda = useBiblioteca((s) => s.busqueda);
  const editar = useBiblioteca((s) => s.editarLibro);
  const setGeneroCandidato = useBiblioteca((s) => s.setGeneroCandidato);
  const deseo = enEstante && esDeseo(libro);

  return (
    <>
      <Cabecera libro={libro} />
      {enEstante && !deseo && <Valoracion libro={libro} />}
      {enEstante && libro.prestamo && modo !== 'prestar' && (
        <p className="prestado">
          Prestado a <b>{libro.prestamo.a}</b> desde el {formateaFecha(libro.prestamo.desde)}
        </p>
      )}
      {enEstante && !deseo && (
        <div className="estados" role="group" aria-label="Estado de lectura">
          {ESTADOS.map((e: Estado) => (
            <button key={e} className="chip" aria-pressed={libro.estado === e} onClick={() => cambiaEstado(libro.id, e)}>
              {ETIQUETA[e]}
            </button>
          ))}
        </div>
      )}

      {enEstante && modo === 'ver' && <Notas libro={libro} />}

      {enEstante && modo === 'borrar' && (
        <div className="confirmar">
          <p>¿Quitar «{libro.titulo}» de tu anaquel? No se puede deshacer.</p>
          <div className="botones">
            <button className="btn sec" onClick={() => setModo('ver')}>Cancelar</button>
            <button className="btn" onClick={() => borrar(libro.id)}>Sí, quitar</button>
          </div>
        </div>
      )}

      {enEstante && modo === 'prestar' && (
        <FormularioPrestamo libro={libro} onListo={() => setModo('ver')} />
      )}

      {!enEstante && busqueda !== 'buscando' && (
        <div className="genero-candidato">
          <SelectorGenero valor={libro.genero ?? ''} onCambio={setGeneroCandidato} />
        </div>
      )}

      {!(enEstante && (modo === 'borrar' || modo === 'prestar')) && (
        <>
          <div className="botones">
            {deseo ? (
              <>
                <a className="btn sec enlace" href={`https://www.amazon.es/s?k=${encodeURIComponent(libro.isbn || `${libro.titulo} ${libro.autor}`)}`} target="_blank" rel="noreferrer">Buscar en Amazon</a>
                <button className="btn" onClick={() => editar(libro.id, { posesion: 'tengo' })}>Ya lo tengo</button>
              </>
            ) : enEstante ? (
              <>
                {libro.prestamo
                  ? <button className="btn sec" onClick={() => devolver(libro.id)}>Marcar devuelto</button>
                  : <button className="btn sec" onClick={() => setModo('prestar')}>Prestar</button>}
                <button className="btn" onClick={cerrar}>Listo</button>
              </>
            ) : (
              <>
                {repetido
                  ? <p className="nota">Este libro ya está en tu anaquel.</p>
                  : <button className="btn ancho" onClick={() => anadir('tengo')}>Añadir al anaquel</button>}
                {!repetido && <button className="btn sec" onClick={() => anadir('quiero')}>Lo quiero</button>}
                <button className="btn sec" onClick={descartar}>Cancelar</button>
              </>
            )}
          </div>
          {enEstante && (
            <div className="acciones-libro">
              <button className="quitar" onClick={() => setModo('editar')}>Editar</button>
              <button className="quitar" onClick={() => setModo('borrar')}>Quitar del anaquel</button>
            </div>
          )}
          {!enEstante && busqueda === 'buscando' && <p className="nota">Buscando datos del libro…</p>}
          {!enEstante && busqueda === 'no-encontrado' && <p className="nota">No encontramos este ISBN. Puedes añadirlo igualmente.</p>}
          {!enEstante && busqueda === 'sin-red' && <p className="nota">Sin conexión: el libro se añade sin datos.</p>}
        </>
      )}
      {libro.isbn && <p className="isbn-pie">ISBN {libro.isbn}</p>}
    </>
  );
}

/** Notas del lector: se guardan solas al dejar de escribir. */
function Notas({ libro }: { libro: Libro }) {
  const editar = useBiblioteca((s) => s.editarLibro);
  const [texto, setTexto] = useState(libro.notas ?? '');
  const ultimoGuardado = useRef(libro.notas ?? '');

  useEffect(() => {
    if (texto === ultimoGuardado.current) return;
    const t = setTimeout(() => {
      ultimoGuardado.current = texto;
      editar(libro.id, { notas: texto });
    }, 600);
    return () => clearTimeout(t);
  }, [texto, editar, libro.id]);

  return (
    <label className="campo notas">
      <span>Tus notas</span>
      <textarea
        value={texto}
        rows={3}
        placeholder="Qué te pareció, una cita, a quién se lo recomendarías…"
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => {
          if (texto !== ultimoGuardado.current) { ultimoGuardado.current = texto; editar(libro.id, { notas: texto }); }
        }}
      />
    </label>
  );
}

function FormularioPrestamo({ libro, onListo }: { libro: Libro; onListo: () => void }) {
  const prestar = useBiblioteca((s) => s.prestar);
  const [a, setA] = useState('');
  const [error, setError] = useState<string | null>(null);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const fallo = validaPrestamo(a);
    if (fallo) { setError(fallo); return; }
    prestar(libro.id, a, hoyIso());
    onListo();
  }

  return (
    <form onSubmit={guardar} noValidate>
      <p className="eti">Prestar «{libro.titulo}»</p>
      <label className="campo">
        <span>¿A quién?</span>
        <input value={a} onChange={(e) => setA(e.target.value)} autoComplete="off" autoFocus />
      </label>
      {error && <p className="nota" role="alert">{error}</p>}
      <div className="botones">
        <button type="button" className="btn sec" onClick={onListo}>Cancelar</button>
        <button type="submit" className="btn">Guardar</button>
      </div>
    </form>
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
    genero: libro.genero ?? '',
  });
  const [error, setError] = useState<string | null>(null);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const limpio: DatosLibro = {
      ...datos, titulo: datos.titulo.trim(), autor: datos.autor.trim(), isbn: datos.isbn.trim(), genero: datos.genero.trim(),
    };
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
      <SelectorGenero valor={datos.genero} onCambio={(genero) => setDatos({ ...datos, genero })} />
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
