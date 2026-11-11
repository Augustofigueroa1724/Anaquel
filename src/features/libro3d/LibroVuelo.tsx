import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import { tintaPara, type Libro } from '../../domain/libro';
import { Interior } from '../estanteria/Estanteria';
import { Portada } from './Portada';
import { H, lomoEn, marcoRect, poseDestino, poseLomo, tf, W } from './vuelo';

type Origen = 'lomo' | 'escaner';
interface Mostrado { libro: Libro; origen: Origen }

const EASE_SACA = 'cubic-bezier(.22,.8,.24,1)';
const EASE_GUARDA = 'cubic-bezier(.5,0,.3,1)';
const reducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pinza = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Libro 3D: sale del estante (o del visor), gira hacia el usuario y queda sobre la ficha.
 * Se anima con la API Web Animations; la geometría está en vuelo.ts.
 */
export function LibroVuelo() {
  const libroEnEstante = useBiblioteca((s) => s.libros.find((l) => l.id === s.abierto) ?? null);
  const candidato = useBiblioteca((s) => s.candidato);
  const actual: Mostrado | null = libroEnEstante
    ? { libro: libroEnEstante, origen: 'lomo' }
    : candidato ? { libro: candidato, origen: 'escaner' } : null;

  // El último libro abierto se conserva para la animación de cierre.
  const ultimo = useRef<Mostrado | null>(null);
  if (actual) ultimo.current = actual;

  const nodo = useRef<HTMLDivElement>(null);
  const anims = useRef<Animation[]>([]);
  const finRef = useRef('');
  const destinoRef = useRef({ x: 0, y: 0, s: 1 });
  const lomoOculto = useRef<HTMLElement | null>(null);
  const abiertoRef = useRef(false);
  const conteoAlAbrir = useRef(0);
  const claveAnterior = useRef('');

  const clave = actual ? `${actual.origen}:${actual.libro.id}` : '';

  useLayoutEffect(() => {
    abiertoRef.current = actual !== null;
    if (clave !== claveAnterior.current) {
      if (actual) sacar(actual);
      else if (ultimo.current) guardar(ultimo.current);
      claveAnterior.current = clave;
    }
  }, [clave]);

  // Arrastrar el libro para girarlo; al soltar vuelve a su pose con muelle.
  const montado = ultimo.current !== null;
  useEffect(() => {
    const node = nodo.current;
    if (!node) return;
    let ini: { x: number; y: number } | null = null;

    const baja = (e: PointerEvent) => {
      if (!abiertoRef.current) return;
      ini = { x: e.clientX, y: e.clientY };
      node.setPointerCapture(e.pointerId);
      anims.current.forEach((a) => { a.commitStyles(); a.cancel(); });
      anims.current = [];
    };
    const mueve = (e: PointerEvent) => {
      if (!ini) return;
      const d = destinoRef.current;
      const ry = pinza(-18 + (e.clientX - ini.x) * 0.6, -160, 160);
      const rx = pinza(5 - (e.clientY - ini.y) * 0.25, -25, 25);
      node.style.transform = tf(d.x, d.y, 0, ry, rx, d.s);
    };
    const suelta = () => {
      if (!ini) return;
      ini = null;
      node.animate(
        [{ transform: node.style.transform }, { transform: finRef.current }],
        { duration: reducido() ? 0 : 600, easing: 'cubic-bezier(.3,1.4,.4,1)', fill: 'forwards' },
      );
      node.style.transform = finRef.current;
    };
    node.addEventListener('pointerdown', baja);
    node.addEventListener('pointermove', mueve);
    node.addEventListener('pointerup', suelta);
    node.addEventListener('pointercancel', suelta);
    return () => {
      node.removeEventListener('pointerdown', baja);
      node.removeEventListener('pointermove', mueve);
      node.removeEventListener('pointerup', suelta);
      node.removeEventListener('pointercancel', suelta);
    };
  }, [montado]);

  function sacar(m: Mostrado) {
    const node = nodo.current;
    if (!node) return;
    anims.current.forEach((a) => a.cancel());
    anims.current = [];
    if (lomoOculto.current) { lomoOculto.current.style.visibility = ''; lomoOculto.current = null; }

    conteoAlAbrir.current = useBiblioteca.getState().libros.length;
    const o = m.origen === 'lomo' ? lomoEn(m.libro.id) : null;
    const T = o ? Math.max(18, o.r.width / (o.r.height / H)) : 30;
    node.style.setProperty('--T', `${T}px`);

    const d = poseDestino();
    const fin = tf(d.x, d.y, 0, -18, 5, d.s);
    destinoRef.current = d;
    finRef.current = fin;

    const marco = marcoRect();
    let frames: Keyframe[];
    if (o) {
      o.el.style.visibility = 'hidden';
      lomoOculto.current = o.el;
      const p = poseLomo(o.r);
      frames = [
        { transform: tf(p.x, p.y, p.z, 90, 0, p.s) },
        { transform: tf(p.x, p.y - 8, p.z + 110, 90, 0, p.s), offset: 0.3, easing: 'cubic-bezier(.4,0,.2,1)' },
        { transform: fin },
      ];
    } else if (m.origen === 'escaner' && marco) {
      frames = [
        { transform: tf(marco.left + marco.width / 2 - W / 2, marco.top + marco.height / 2 - H / 2, -200, -60, 40, 0.2), opacity: 0 },
        { transform: fin, opacity: 1 },
      ];
    } else {
      frames = [
        { transform: tf(window.innerWidth / 2 - W / 2, window.innerHeight, 0, 90, 0, 0.6), opacity: 0 },
        { transform: fin, opacity: 1 },
      ];
    }
    node.style.visibility = 'visible';
    anims.current = [node.animate(frames, { duration: reducido() ? 0 : 1000, easing: EASE_SACA, fill: 'forwards' })];
    node.style.pointerEvents = 'auto';
  }

  function guardar(m: Mostrado) {
    const node = nodo.current;
    if (!node) return;
    const actualT = getComputedStyle(node).transform;
    anims.current.forEach((a) => a.cancel());
    anims.current = [];
    node.style.transform = actualT;

    const anadido = m.origen === 'escaner' && useBiblioteca.getState().libros.length > conteoAlAbrir.current;
    let fin: string | null = null;
    let op = 1;
    if (m.origen === 'lomo') {
      const o = lomoEn(m.libro.id);
      if (o) { const p = poseLomo(o.r); fin = tf(p.x, p.y, p.z, 90, 0, p.s); }
    } else if (anadido) {
      const t = document.getElementById('tab-estanteria')?.getBoundingClientRect();
      if (t && t.width > 0) { fin = tf(t.left + t.width / 2 - W / 2, t.top + t.height / 2 - H / 2, 0, 90, 0, 0.08); op = 0.2; }
    } else {
      const mr = marcoRect();
      if (mr) { fin = tf(mr.left + mr.width / 2 - W / 2, mr.top + mr.height / 2 - H / 2, -200, -60, 40, 0.2); op = 0; }
    }
    if (!fin) { fin = tf(window.innerWidth / 2 - W / 2, window.innerHeight, 0, 90, 0, 0.6); op = 0; }

    const a = node.animate(
      [{ transform: actualT, opacity: 1 }, { transform: fin, opacity: op }],
      { duration: reducido() ? 0 : 700, easing: EASE_GUARDA, fill: 'forwards' },
    );
    anims.current = [a];
    a.onfinish = () => {
      // El libro 3D va en una capa fija: si se queda visible sobre el lomo, al hacer
      // scroll en la estantería parece que sigue volando. Se oculta y vuelve el lomo.
      node.style.pointerEvents = 'none';
      node.style.visibility = 'hidden';
      a.cancel();
      anims.current = [];
      if (lomoOculto.current) { lomoOculto.current.style.visibility = ''; lomoOculto.current = null; }
    };
  }

  const u = ultimo.current;
  const { tinta, oro } = u ? tintaPara(u.libro.color) : { tinta: '', oro: '' };
  return (
    <div className="escenario" aria-hidden="true">
      {u && (
        <div
          ref={nodo}
          className="libro3d"
          style={{
            '--W': `${W}px`, '--H': `${H}px`, '--T': '30px',
            '--c': u.libro.color, '--t': tinta, '--g': oro,
            pointerEvents: 'none',
          } as CSSProperties}
        >
          <div className="cara tapa"><Portada libro={u.libro} /></div>
          <div className="cara trasera" />
          <div className={`cara canto lomo ${u.libro.edicion}`} style={{ '--c': u.libro.color, '--t': tinta, '--g': oro } as CSSProperties}>
            <Interior libro={u.libro} />
          </div>
          <div className="cara hojas" />
          <div className="cara sup" />
          <div className="cara inf" />
        </div>
      )}
    </div>
  );
}
