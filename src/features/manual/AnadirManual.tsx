import { useState } from 'react';
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

  function guarda(e: React.FormEvent) {
    e.preventDefault();
    const limpio: DatosLibro = {
      ...datos, titulo: datos.titulo.trim(), autor: datos.autor.trim(), isbn: datos.isbn.replace(/[^0-9Xx]/g, ''), genero: datos.genero.trim(),
    };
    const fallo = validaDatos(limpio);
    if (fallo) { setError(fallo); return; }
    const { genero, ...resto } = limpio;
    const nuevo = { ...resto, ...(genero ? { genero } : {}), ...(posesion === 'quiero' ? { posesion: 'quiero' as const } : {}) };
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
          <input value={datos.titulo} onChange={(e) => { setDatos({ ...datos, titulo: e.target.value }); setError(""); }} autoComplete="off" autoFocus />
        </label>
        <label className="campo"><span>Autor</span>
          <input value={datos.autor} onChange={(e) => setDatos({ ...datos, autor: e.target.value })} autoComplete="off" />
        </label>
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
