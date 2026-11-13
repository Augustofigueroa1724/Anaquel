import { useEffect, useMemo, useState } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import { COLORES_TELA } from '../../domain/libro';
import { filtraConocidos, imprescindibles, paraTi, type Sugerencia } from '../../data/sugerencias';

/** Filas de sugerencias: «De tus autores» (Google Books) e «Imprescindibles» (selección literaria). */
export function Sugerencias() {
  const libros = useBiblioteca((s) => s.libros);
  const [deTi, setDeTi] = useState<Sugerencia[]>([]);

  const [cargando, setCargando] = useState(true);

  // Las consultas dependen de géneros y autores, no de cada cambio en los libros.
  const firma = useMemo(() => libros.filter((l) => !l.ejemplo).map((l) => `${l.genero}|${l.autor}|${l.valoracion ?? 0}`).sort().join(';'), [libros]);
  useEffect(() => {
    let vivo = true;
    setCargando(true);
    paraTi(useBiblioteca.getState().libros).then((a) => { if (vivo) setDeTi(a); }).catch(() => undefined).finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [firma]);

  const filaTi = useMemo(() => filtraConocidos(deTi, libros).slice(0, 15), [deTi, libros]);
  const filaImprescindibles = useMemo(() => filtraConocidos(imprescindibles(libros), libros).slice(0, 20), [libros]);

  return (
    <div className="sugerencias">
      {filaImprescindibles.length > 0 && <Fila titulo="Imprescindibles" nota="Clásicos y novelas premiadas; primero, tus géneros" sugs={filaImprescindibles} />}
      {cargando && <p className="nota">Buscando más libros de tus autores…</p>}
      {filaTi.length > 0 && <Fila titulo="De tus autores favoritos" nota="Otros libros de los autores que mejor valoras" sugs={filaTi} />}
    </div>
  );
}

function Fila({ titulo, nota, sugs }: { titulo: string; nota: string; sugs: Sugerencia[] }) {
  return (
    <div className="fila-sug">
      <p className="eti">{titulo}</p>
      <p className="nota">{nota}</p>
      <ul>{sugs.map((s, i) => <Tarjeta key={s.clave} s={s} i={i} />)}</ul>
    </div>
  );
}

function Tarjeta({ s, i }: { s: Sugerencia; i: number }) {
  const importa = useBiblioteca((st) => st.importa);
  const [rota, setRota] = useState(false);
  const anade = (posesion: 'tengo' | 'quiero') => importa([{
    titulo: s.titulo, autor: s.autor, anio: s.anio, isbn: s.isbn, estado: 'pendiente',
    ...(posesion === 'quiero' ? { posesion: 'quiero' as const } : {}), ...(s.genero ? { genero: s.genero } : {}),
  }]);
  return (
    <li className="tarjeta-sug">
      <div className="portada-sug" style={{ background: COLORES_TELA[i % COLORES_TELA.length] }}>
        {s.portada && !rota
          ? <img src={s.portada} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setRota(true)} />
          : <span>{s.titulo}</span>}
      </div>
      <b title={s.titulo}>{s.titulo}</b>
      <span className="autor-sug">{s.autor}</span>
      <button className="btn" onClick={() => anade('quiero')}>Lo quiero</button>
      <button className="quitar" onClick={() => anade('tengo')}>Ya lo tengo</button>
    </li>
  );
}
