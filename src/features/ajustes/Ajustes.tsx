import { useMemo, useState } from 'react';
import { agrupaPorGenero, delAnaquel } from '../../domain/libro';
import { useBiblioteca } from '../../app/biblioteca';
import { useCuenta } from '../../app/cuenta';
import { libroDesdeGoodreads, sinRepetidos } from '../../data/goodreads';
import { borraCuenta, cierraSesion } from '../../platform/cuenta';
import { BotonesLogin } from '../cuenta/BotonesLogin';

/** Cuenta e importación. Se abre desde la rueda de la cabecera. */
export function Ajustes({ onCerrar }: { onCerrar: () => void }) {
  const sesion = useCuenta((s) => s.sesion);
  const sincronizando = useCuenta((s) => s.sincronizando);
  const aviso = useCuenta((s) => s.avisoSync);
  const libros = useBiblioteca((s) => s.libros);
  const importa = useBiblioteca((s) => s.importa);
  const ordenGeneros = useBiblioteca((s) => s.ordenGeneros);
  const setOrdenGeneros = useBiblioteca((s) => s.setOrdenGeneros);
  const baldas = useMemo(() => agrupaPorGenero(delAnaquel(libros), ordenGeneros).map((g) => ({ genero: g.genero, n: g.libros.length })), [libros, ordenGeneros]);

  // Sube o baja un género una posición y guarda el orden completo de las baldas actuales.
  function mueve(i: number, paso: -1 | 1) {
    const orden = baldas.map((b) => b.genero);
    const j = i + paso;
    if (j < 0 || j >= orden.length) return;
    [orden[i], orden[j]] = [orden[j], orden[i]];
    setOrdenGeneros(orden);
  }
  const [confirmaBorrar, setConfirmaBorrar] = useState(false);
  const [mensaje, setMensaje] = useState('');

  async function alElegirCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const fichero = e.target.files?.[0];
    e.target.value = '';
    if (!fichero) return;
    const leidos = libroDesdeGoodreads(await fichero.text());
    if (!leidos.length) { setMensaje('Ese fichero no parece una exportación de Goodreads.'); return; }
    const nuevos = sinRepetidos(leidos, libros);
    const n = importa(nuevos);
    const repetidos = leidos.length - nuevos.length;
    setMensaje(`${n === 1 ? "Importado 1 libro" : `Importados ${n} libros`}${repetidos ? ` (${repetidos} ya estaban)` : ''}. Los de «Quiero leer» van a tu lista de deseos.`);
  }

  async function borra() {
    const r = await borraCuenta();
    setMensaje(r.ok ? 'Cuenta borrada.' : r.error);
    setConfirmaBorrar(false);
  }

  return (
    <div className="panel" role="dialog" aria-modal="true" aria-label="Ajustes">
      <div className="panel-cab">
        <h2>Ajustes</h2>
        <button className="cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>
      </div>

      <div className="bloque">
        <p className="eti">Tu cuenta</p>
        {sesion ? (
          <>
            <p>Has entrado como <b>{sesion.user.email || 'usuario de Apple'}</b>. Tus libros se guardan en tu cuenta.</p>
            {sincronizando && <p className="nota">Sincronizando…</p>}
            {aviso && <p className="nota">{aviso}</p>}
            <div className="botones">
              <button className="btn sec" onClick={() => void cierraSesion()}>Cerrar sesión</button>
            </div>
            {confirmaBorrar ? (
              <div className="confirmar">
                <p>Se borrarán tus libros, tus notas y tus amistades de Anaquel. No se puede deshacer.</p>
                <div className="botones">
                  <button className="btn sec" onClick={() => setConfirmaBorrar(false)}>Cancelar</button>
                  <button className="btn" onClick={() => void borra()}>Sí, borrar mi cuenta</button>
                </div>
              </div>
            ) : (
              <button className="quitar" onClick={() => setConfirmaBorrar(true)}>Borrar mi cuenta</button>
            )}
          </>
        ) : (
          <>
            <p>Entra para guardar tus libros en tu cuenta, verlos en todos tus dispositivos y compartir tu anaquel con amigos.</p>
            <BotonesLogin />
          </>
        )}
      </div>

      {baldas.length > 1 && (
        <div className="bloque" id="orden-baldas">
          <p className="eti">Orden de las baldas</p>
          <ol className="orden-baldas">
            {baldas.map((b, i) => (
              <li key={b.genero}>
                <span className="nombre">{b.genero}</span><span className="n">{b.n}</span>
                <button type="button" className="flecha" onClick={() => mueve(i, -1)} disabled={i === 0} aria-label={`Subir ${b.genero}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
                </button>
                <button type="button" className="flecha" onClick={() => mueve(i, 1)} disabled={i === baldas.length - 1} aria-label={`Bajar ${b.genero}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                </button>
              </li>
            ))}
          </ol>
          {ordenGeneros.length > 0 && (
            <button type="button" className="enlace" onClick={() => setOrdenGeneros([])}>Volver al orden automático (por número de libros)</button>
          )}
        </div>
      )}

      <div className="bloque">
        <p className="eti">Importar</p>
        <p>Trae tu biblioteca de Goodreads: en su web, <b>Mis libros → Importar y exportar → Exportar biblioteca</b>, y elige aquí el fichero.</p>
        <label className="btn sec archivo">
          Importar de Goodreads (.csv)
          <input type="file" accept=".csv,text/csv" onChange={(e) => void alElegirCsv(e)} />
        </label>
      </div>

      {mensaje && <p className="nota" role="status">{mensaje}</p>}
      <p className="isbn-pie">Anaquel 0.1</p>
    </div>
  );
}
