/** Geometría del libro 3D (portada de 152 × 228 px). Funciones puras salvo las que leen el DOM. */
export const W = 152;
export const H = 228;

export function tf(x: number, y: number, z: number, ry: number, rx: number, s: number): string {
  return `translate3d(${x}px,${y}px,${z}px) rotateY(${ry}deg) rotateX(${rx}deg) scale3d(${s},${s},${s})`;
}

export interface Pose { x: number; y: number; s: number; z: number }

/** Pose que deja el libro exactamente encima del lomo de origen. */
export function poseLomo(r: DOMRect): Pose {
  const s = r.height / H;
  return { x: r.left + r.width / 2 - W / 2, y: r.top + r.height / 2 - H / 2, s, z: (-W * s) / 2 };
}

/** Hueco libre sobre la hoja de ficha, donde se muestra el libro de frente. */
export function poseDestino(): { x: number; y: number; s: number } {
  const hoja = document.getElementById('hoja');
  const alto = Math.min(hoja?.scrollHeight ?? 0, window.innerHeight * 0.56);
  const arriba = 12;
  const libre = window.innerHeight - alto - arriba;
  const s = Math.max(0.5, Math.min(1.12, (libre - 40) / H));
  return { x: window.innerWidth / 2 - W / 2, y: arriba + libre / 2 - H / 2 + 6, s };
}

/** Lomo visible en la estantería, o null si el filtro lo oculta. */
export function lomoEn(id: number): { el: HTMLElement; r: DOMRect } | null {
  const el = document.querySelector<HTMLElement>(`.lomo[data-id="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 ? { el, r } : null;
}

/** Marco del visor de escáner, si la pestaña está visible. */
export function marcoRect(): DOMRect | null {
  const m = document.querySelector<HTMLElement>('.marco');
  if (!m) return null;
  const r = m.getBoundingClientRect();
  return r.width > 0 ? r : null;
}
