import { useEffect, useMemo, useState } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import { anadeGenero, borraGenero, cargaGeneros, esBase, juntaGeneros } from '../../data/generos';
import { GENEROS_BASE } from '../../domain/libro';

/** Chips de género (lista común) y «+ Nuevo». Un género añadido y sin usar se puede quitar. */
export function SelectorGenero({ valor, onCambio }: { valor: string; onCambio: (g: string) => void }) {
  const libros = useBiblioteca((s) => s.libros);
  // Los base salen al momento; los de la lista común se suman cuando llegan del servidor.
  const [catalogo, setCatalogo] = useState<string[]>(() => juntaGeneros(GENEROS_BASE));
  const [nuevo, setNuevo] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { void cargaGeneros().then((g) => setCatalogo((c) => juntaGeneros(c, g))); }, []);

  const usados = useMemo(() => libros.map((l) => l.genero ?? '').filter(Boolean), [libros]);
  const lista = useMemo(() => juntaGeneros(catalogo, usados, valor ? [valor] : []), [catalogo, usados, valor]);

  async function anade() {
    if (nuevo === null) return;
    const r = await anadeGenero(nuevo);
    if (!r.ok) { setError(r.error); return; }
    setCatalogo((c) => juntaGeneros(c, [r.genero]));
    onCambio(r.genero);
    setNuevo(null); setError('');
  }

  async function quita(g: string) {
    if (await borraGenero(g)) setCatalogo((c) => c.filter((x) => x.toLowerCase() !== g.toLowerCase()));
    else setError(`«${g}» lo usan libros de otras personas y no se puede quitar.`);
  }

  return (
    <div className="selector-genero">
      <span className="rotulo">Género</span>
      <div className="chips-genero">
        {lista.map((g) => {
          const activo = g.toLowerCase() === valor.toLowerCase();
          const quitable = !esBase(g) && !activo && !usados.some((u) => u.toLowerCase() === g.toLowerCase());
          return (
            <span key={g} className={`chip-genero${activo ? ' activo' : ''}`}>
              <button type="button" aria-pressed={activo} onClick={() => onCambio(activo ? '' : g)}>{g}</button>
              {quitable && <button type="button" className="quita-genero" aria-label={`Quitar ${g} de la lista`} onClick={() => void quita(g)}>×</button>}
            </span>
          );
        })}
        {nuevo === null && <button type="button" className="chip-genero nuevo" onClick={() => setNuevo('')}>+ Nuevo</button>}
      </div>
      {nuevo !== null && (
        <div className="fila-anadir">
          <label className="campo"><span>Nuevo género</span>
            <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} autoFocus autoComplete="off" placeholder="Viajes, Teatro…"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void anade(); } }} />
          </label>
          <button type="button" className="btn" onClick={() => void anade()}>Añadir</button>
        </div>
      )}
      {error && <p className="nota" role="alert">{error}</p>}
    </div>
  );
}
