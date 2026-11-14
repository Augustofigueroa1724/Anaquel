/**
 * Alto que necesita un lomo para enseñar entero su texto (autor y título, que van en vertical).
 * Se mide con un lienzo y las mismas fuentes que el CSS de cada tipo de lomo. Si cambian las
 * fuentes o tamaños de `.lomo` en anaquel.css o formulario.css, hay que cambiarlos aquí.
 */
import { coleccionDe, type Libro } from '../../domain/libro';

type Tipo = 'folio' | 'blanche' | 'albin' | 'clasico' | 'moderno' | 'condensado';
interface Letra { fuente: string; px: number; espaciado: number; mayus?: boolean }
interface Receta { titulo: Letra; autor?: Letra; fijo: number }

const DISPLAY = '"Bodoni Moda", Georgia, serif';
const SANS = 'Manrope, system-ui, sans-serif';
const COND = 'Oswald, "Arial Narrow", sans-serif';

// «fijo» = lo que no es texto: relleno, huecos, filetes, logo, sello o franja.
const RECETAS: Record<Tipo, Receta> = {
  folio: { autor: { fuente: `700 7.5px ${SANS}`, px: 7.5, espaciado: 0.06, mayus: true }, titulo: { fuente: `500 12px ${DISPLAY}`, px: 12, espaciado: 0 }, fijo: 38 },
  blanche: { autor: { fuente: `500 8.5px ${DISPLAY}`, px: 8.5, espaciado: 0 }, titulo: { fuente: `500 12.5px ${DISPLAY}`, px: 12.5, espaciado: 0 }, fijo: 62 },
  albin: { autor: { fuente: `italic 500 8.5px ${DISPLAY}`, px: 8.5, espaciado: 0 }, titulo: { fuente: `italic 500 12.5px ${DISPLAY}`, px: 12.5, espaciado: 0 }, fijo: 76 },
  clasico: { titulo: { fuente: `italic 500 12.5px ${DISPLAY}`, px: 12.5, espaciado: 0.01 }, fijo: 46 },
  moderno: { titulo: { fuente: `800 9.5px ${SANS}`, px: 9.5, espaciado: 0.16, mayus: true }, fijo: 42 },
  condensado: { titulo: { fuente: `500 13px ${COND}`, px: 13, espaciado: 0.05, mayus: true }, fijo: 42 },
};

let ctx: CanvasRenderingContext2D | null | undefined;
const cache = new Map<string, number>();

/** Las fuentes llegan después del primer pintado: al estar listas se olvida lo medido. */
export function olvidaMedidas(): void { cache.clear(); }

function largo(texto: string, l: Letra): number {
  const t = l.mayus ? texto.toUpperCase() : texto;
  const k = `${l.fuente}|${t}`;
  const guardado = cache.get(k);
  if (guardado !== undefined) return guardado;
  if (ctx === undefined) ctx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  let w = t.length * l.px * 0.58; // sin lienzo (pruebas): estimación
  if (ctx) { ctx.font = l.fuente; w = ctx.measureText(t).width; }
  const total = (w + t.length * l.px * l.espaciado) * 1.05 + 4;
  cache.set(k, total);
  return total;
}

/** { texto: px que ocupan autor y título; fijo: px del resto del lomo }. */
export function medidaLomo(libro: Libro): { texto: number; fijo: number } {
  const r = RECETAS[(coleccionDe(libro) ?? libro.edicion) as Tipo];
  return { texto: largo(libro.titulo, r.titulo) + (r.autor ? largo(libro.autor, r.autor) : 0), fijo: r.fijo };
}
