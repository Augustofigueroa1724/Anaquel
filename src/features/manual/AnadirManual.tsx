import { useEffect, useRef, useState } from 'react';
import { sugiereLibros, type Candidato } from '../../data/autocompletar';
import { useBiblioteca } from '../../app/biblioteca';
import { sinRepetidos } from '../../data/goodreads';
import { ESTADOS, ETIQUETA, validaDatos, type DatosLibro } from '../../domain/libro';
import { SelectorGenero } from '../ficha/SelectorGenero';

/** Añadir un libro a mano, para cuando no hay código de barras o no se encuentra. */
export function AnadirManual({ onCerrar, onAnadido }: {
  onCerrar: () => void;
  onAnadido: (posesion: 'tengo' | 'quiero') => void;
}) {
  const libros = useBiblioteca((s) => s.libros);
  const importa = useBiblioteca((s) => s.importa);
  const [datos, setDatos] = useState<DatosLibro>({ titulo: '', autor: '', anio: 0, isbn: '', estado: 'pendiente', genero: '' });
  const [posesion, setPosesion] = useState<'tengo' | 'quiero'>('tengo');
  const [error, setError] = useState('');
  const [activo, setActivo] = useState<'titulo' | 'autor' | null>(null);
  const [sugs, setSugs] = useState<Candidato[]>([]);
  const elegido = useRef(false);
  const [extra, setExtra] = useState<{ portada?: string; editorial?: string }>({});

  // Autocompletar: busca al dejar de teclear (350 ms) con lo que haya en título y autor.
  useEffect(() => {
    if (!activo || elegido.current) { setSugs([]); return; }
    const control = new AbortController();
    const t = setTimeout(() => {
      sugiereLibros(datos.titulo, datos.autor, control.signal).then((r) => { if (!control.signal.aborted) setSugs(r); }, () => {});
    }, 350);
    return () => { clearTimeout(t); control.abort(); };
  }, [datos.titulo, datos.autor, activo]);

  function escribe(campo: 'titulo' | 'autor', valor: string) {
    elegido.current = false;
    setExtra({});
    setDatos((d) => ({ ...d, [campo]: valor }));
    setError('');
  }

  function elige(c: Candidato) {
    elegido.current = true;
    setExtra({ ...(c.portada ? { portada: c.portada } : {}), ...(c.editorial ? { editorial: c.editorial } : {}) });
    setDatos((d) => ({ ...d, titulo: c.titulo, autor: c.autor, anio: c.anio || d.anio, isbn: c.isbn || d.isbn, genero: d.genero || c.genero || '' }));
    setSugs([]);
    setActivo(null);
  }

  const lista = (campo: 'titulo' | 'autor') => activo === campo && sugs.length > 0 && (
    <ul className="autocompleta" role="listbox" aria-label="Sugerencias">
      {sugs.map((c) => (
        <li key={`${c.titulo}|${c.autor}|${c.isbn}`}>
          <button type="button" role="option" aria-selected="false" onMouseDown={(e) => e.preventDefault()} onClick={() => elige(c)}>
            {c.portada ? <img src={c.portada} alt="" loading="lazy" /> : <span className="sin-portada" aria-hidden="true" />}
            <span className="txt"><b>{c.titulo}</b><small>{c.autor}{c.anio ? ` · ${c.anio}` : ''}</small></span>
          </button>
        </li>
      ))}
    </ul>
  );

  function guarda(e: React.FormEvent) {
    e.preventDefault();
    const limpio: DatosLibro = {
      ...datos, titulo: datos.titulo.trim(), autor: datos.autor.trim(), isbn: datos.isbn.replace(/[^0-9Xx]/g, ''), genero: datos.genero.trim(),
    };
    const fallo = validaDatos(limpio);
    if (fallo) { setError(fallo); return; }
    const { genero, ...resto } = limpio;
    const nuevo = { ...resto, ...extra, ...(genero ? { genero } : {}), ...(posesion === 'quiero' ? { posesion: 'quiero' as const } : {}) };
    if (!sinRepetidos([nuevo], libros.filter((l) => !l.ejemplo)).length) { setError('Este libro ya está en tu anaquel o en tu lista.'); return; }
    importa([nuevo]);
    onAnadido(posesion);
  }

  return (
    <form className="panel" role="dialog" aria-modal="true" aria-label="Añadir un libro a mano" onSubmit={guarda} noValidate>
      <div className="panel-cab">
        <h2>Añadir a mano</h2>
        <button type="button" className="cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>
      </div>
      <div className="bloque">
        <div className="estados dos" role="group" aria-label="¿Lo tienes?">
          <button type="button" className="chip" aria-pressed={posesion === 'tengo'} onClick={() => setPosesion('tengo')}>Lo tengo</button>
          <button type="button" className="chip" aria-pressed={posesion === 'quiero'} onClick={() => setPosesion('quiero')}>Lo quiero</button>
        </div>
        <label className="campo"><span>Título</span>
          <input id="manual-titulo" value={datos.titulo} onChange={(e) => escribe('titulo', e.target.value)} onFocus={() => setActivo('titulo')} onBlur={() => setActivo(null)} autoComplete="off" autoFocus />
        </label>
        {lista('titulo')}
        <label className="campo"><span>Autor</span>
          <input id="manual-autor" value={datos.autor} onChange={(e) => escribe('autor', e.target.value)} onFocus={() => setActivo('autor')} onBlur={() => setActivo(null)} autoComplete="off" />
        </label>
        {lista('autor')}
        <SelectorGenero valor={datos.genero} onCambio={(genero) => setDatos({ ...datos, genero })} />
        <label className="campo"><span>Año (opcional)</span>
          <input type="number" inputMode="numeric" value={datos.anio || ''} onChange={(e) => setDatos({ ...datos, anio: e.target.value === '' ? 0 : Number(e.target.value) })} />
        </label>
        <label className="campo"><span>ISBN (opcional)</span>
          <input inputMode="numeric" value={datos.isbn} onChange={(e) => setDatos({ ...datos, isbn: e.target.value })} autoComplete="off" />
        </label>
        {posesion === 'tengo' && (
          <div className="estados" role="group" aria-label="Estado de lectura">
            {ESTADOS.map((e) => (
              <button key={e} type="button" className="chip" aria-pressed={datos.estado === e} onClick={() => setDatos({ ...datos, estado: e })}>{ETIQUETA[e]}</button>
            ))}
          </div>
        )}
        {error && <p className="nota" role="alert">{error}</p>}
        <div className="botones">
          <button type="button" className="btn sec" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn">{posesion === 'quiero' ? 'Añadir a mi lista' : 'Añadir al anaquel'}</button>
        </div>
      </div>
    </form>
  );
}
