import { useCallback, useEffect, useState } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import { useCuenta } from '../../app/cuenta';
import {
  aceptaAmistad, anaquelDe, guardaPerfil, pideAmistad, quitaAmistad, relaciones,
  type Perfil, type Relaciones,
} from '../../data/social';
import { ETIQUETA, type Libro } from '../../domain/libro';
import { BotonesLogin } from '../cuenta/BotonesLogin';
import { Estanteria } from '../estanteria/Estanteria';

export function Amigos() {
  const sesion = useCuenta((s) => s.sesion);
  const perfil = useCuenta((s) => s.perfil);
  if (!sesion) {
    return (
      <div className="amigos">
        <h2 className="titulo-seccion">Amigos</h2>
        <p>Entra para ver el anaquel de tus amigos y que ellos vean el tuyo.</p>
        <BotonesLogin />
      </div>
    );
  }
  if (!perfil) return <EligeAlias />;
  return <Lista perfil={perfil} />;
}

function EligeAlias() {
  const setPerfil = useCuenta((s) => s.setPerfil);
  const [alias, setAlias] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  async function guarda(e: React.FormEvent) {
    e.preventDefault();
    const fallo = await guardaPerfil(alias, nombre);
    if (fallo) { setError(fallo); return; }
    const { miPerfil } = await import('../../data/social');
    setPerfil(await miPerfil());
  }
  return (
    <form className="amigos" onSubmit={(e) => void guarda(e)} noValidate>
      <h2 className="titulo-seccion">Elige tu alias</h2>
      <p>Es como te encontrarán tus amigos. Solo verán tu alias, tu nombre y tu anaquel; nunca tus notas ni tus préstamos.</p>
      <label className="campo"><span>Alias</span><input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="lectora.voraz" autoCapitalize="none" autoComplete="off" /></label>
      <label className="campo"><span>Nombre (opcional)</span><input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" /></label>
      {error && <p className="nota" role="alert">{error}</p>}
      <div className="botones"><button type="submit" className="btn">Guardar</button></div>
    </form>
  );
}

function Lista({ perfil }: { perfil: Perfil }) {
  const [rel, setRel] = useState<Relaciones | null>(null);
  const [alias, setAlias] = useState('');
  const [aviso, setAviso] = useState('');
  const [viendo, setViendo] = useState<Perfil | null>(null);
  const recarga = useCallback(async () => {
    try { setRel(await relaciones()); } catch { setAviso('Sin conexión. Inténtalo de nuevo más tarde.'); }
  }, []);
  useEffect(() => { void recarga(); }, [recarga]);

  if (viendo) return <AnaquelAmigo amigo={viendo} onVolver={() => setViendo(null)} />;

  async function pide(e: React.FormEvent) {
    e.preventDefault();
    if (!alias.trim()) return;
    const fallo = await pideAmistad(alias);
    setAviso(fallo ?? 'Solicitud enviada.');
    if (!fallo) setAlias('');
    void recarga();
  }

  return (
    <div className="amigos">
      <h2 className="titulo-seccion">Amigos</h2>
      <p className="nota">Tu alias: <b>@{perfil.alias}</b></p>
      <form className="fila-anadir" onSubmit={(e) => void pide(e)} noValidate>
        <label className="campo"><span>Añadir por alias</span><input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="@alias" autoCapitalize="none" autoComplete="off" /></label>
        <button type="submit" className="btn">Enviar</button>
      </form>
      {aviso && <p className="nota" role="status">{aviso}</p>}

      {rel && rel.recibidas.length > 0 && (
        <div className="grupo"><p className="eti">Solicitudes</p>
          <ul className="personas">{rel.recibidas.map((p) => (
            <li key={p.user_id}><Persona p={p} />
              <button className="btn" onClick={() => void aceptaAmistad(p.user_id).then(recarga)}>Aceptar</button>
              <button className="quitar" onClick={() => void quitaAmistad(p.user_id).then(recarga)}>Rechazar</button>
            </li>))}
          </ul>
        </div>
      )}

      <div className="grupo"><p className="eti">Tus amigos</p>
        {rel && rel.amigos.length === 0 && <p className="nota">Aún no tienes amigos en Anaquel. Comparte tu alias para que te añadan.</p>}
        <ul className="personas">{rel?.amigos.map((p) => (
          <li key={p.user_id}>
            <button className="persona-boton" onClick={() => setViendo(p)}><Persona p={p} /><span aria-hidden="true">›</span></button>
            <button className="quitar" onClick={() => void quitaAmistad(p.user_id).then(recarga)}>Quitar</button>
          </li>))}
        </ul>
      </div>

      {rel && rel.enviadas.length > 0 && (
        <div className="grupo"><p className="eti">Enviadas</p>
          <ul className="personas">{rel.enviadas.map((p) => (
            <li key={p.user_id}><Persona p={p} /><button className="quitar" onClick={() => void quitaAmistad(p.user_id).then(recarga)}>Cancelar</button></li>))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Persona({ p }: { p: Perfil }) {
  return <span className="persona"><b>@{p.alias}</b>{p.nombre && <span>{p.nombre}</span>}</span>;
}

/** El anaquel de un amigo, de solo lectura. Un libro suyo se puede pasar a tu lista de deseos. */
function AnaquelAmigo({ amigo, onVolver }: { amigo: Perfil; onVolver: () => void }) {
  const [libros, setLibros] = useState<Libro[] | null>(null);
  const [error, setError] = useState('');
  const [elegido, setElegido] = useState<Libro | null>(null);
  const misLibros = useBiblioteca((s) => s.libros);
  const importa = useBiblioteca((s) => s.importa);
  useEffect(() => { anaquelDe(amigo.user_id).then(setLibros).catch(() => setError('No se ha podido cargar su anaquel.')); }, [amigo.user_id]);

  const yaLoTengo = elegido && misLibros.some((l) => (l.isbn && l.isbn === elegido.isbn) || l.titulo === elegido.titulo);
  return (
    <div className="anaquel-amigo">
      <div className="cab-amigo">
        <button className="quitar" onClick={onVolver}>‹ Amigos</button>
        <h2 className="titulo-seccion">Anaquel de @{amigo.alias}</h2>
      </div>
      {error && <p className="nota">{error}</p>}
      {libros && <div className="contenedor-amigo"><Estanteria ajenos={libros} onAbrir={setElegido} /></div>}
      {elegido && (
        <div className="tarjeta-amigo" role="dialog" aria-label={elegido.titulo}>
          <p className="eti">{ETIQUETA[elegido.estado]}{elegido.genero ? ` · ${elegido.genero}` : ''}</p>
          <h3>{elegido.titulo}</h3>
          <p className="autor">{[elegido.autor, elegido.anio || null].filter(Boolean).join(' · ')}{elegido.valoracion ? ` · ${'★'.repeat(elegido.valoracion)}` : ''}</p>
          <div className="botones">
            <button className="btn sec" onClick={() => setElegido(null)}>Cerrar</button>
            {yaLoTengo
              ? <p className="nota">Ya está en tu anaquel.</p>
              : <button className="btn" onClick={() => {
                  const { id: _i, color: _c, edicion: _e, notas: _n, prestamo: _p, valoracion: _v, ...datos } = elegido;
                  importa([{ ...datos, estado: 'pendiente', posesion: 'quiero' }]);
                  setElegido(null);
                }}>Lo quiero</button>}
          </div>
        </div>
      )}
    </div>
  );
}
