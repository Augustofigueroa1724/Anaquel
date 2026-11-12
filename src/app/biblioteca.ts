import { create } from 'zustand';
import { CANDIDATO_SIMULADO, GENERO_EJEMPLO, LIBROS_EJEMPLO } from '../data/ejemplos';
import { buscarPorIsbn, type Busqueda } from '../data/buscar-isbn';
import { repositorioLocal } from '../data/repositorio-local';
import type { LibroImportado } from '../data/goodreads';
import {
  candidatoDesdeIsbn, COLORES_TELA, edicionDe, nuevoId, type Estado, type Filtro, type Libro,
} from '../domain/libro';

const conTela = (l: LibroImportado | Omit<Libro, 'color' | 'edicion'>, id: number): Libro =>
  ({ ...l, id, color: COLORES_TELA[id % COLORES_TELA.length], edicion: edicionDe(id) });

interface Biblioteca {
  libros: Libro[];
  filtro: Filtro;
  filtroGenero: string | null;
  abierto: number | null;
  candidato: Libro | null;
  busqueda: Busqueda | null;
  setFiltro(f: Filtro): void;
  setFiltroGenero(g: string | null): void;
  abrir(id: number): void;
  cerrar(): void;
  cambiaEstado(id: number, estado: Estado): void;
  simularLectura(): void;
  leerIsbn(isbn: string): void;
  anadirCandidato(posesion?: 'tengo' | 'quiero'): void;
  reemplazaLibros(libros: Libro[]): void;
  importa(nuevos: LibroImportado[]): number;
  valorar(id: number, valoracion: number | undefined): void;
  descartarCandidato(): void;
  editarLibro(id: number, cambios: Partial<Omit<Libro, 'id' | 'color' | 'edicion'>>): void;
  borrarLibro(id: number): void;
  prestar(id: number, a: string, desde: string): void;
  devolver(id: number): void;
}

const guardados = repositorioLocal.cargar();
// Los libros guardados antes de existir el género lo toman de los ejemplos si coinciden.
const inicial = guardados && guardados.length > 0
  ? guardados.map((l) => (l.genero || !GENERO_EJEMPLO[l.titulo] ? l : { ...l, genero: GENERO_EJEMPLO[l.titulo] }))
  : LIBROS_EJEMPLO;

export const useBiblioteca = create<Biblioteca>((set, get) => ({
  libros: inicial,
  filtro: 'todos',
  filtroGenero: null,
  abierto: null,
  candidato: null,
  busqueda: null,

  setFiltro: (filtro) => set({ filtro }),
  setFiltroGenero: (filtroGenero) => set({ filtroGenero }),
  abrir: (id) => set({ abierto: id, candidato: null }),
  cerrar: () => set({ abierto: null, candidato: null, busqueda: null }),

  cambiaEstado: (id, estado) => {
    const libros = get().libros.map((l) => (l.id === id ? { ...l, estado } : l));
    repositorioLocal.guardar(libros);
    set({ libros });
  },

  simularLectura: () => set({ busqueda: null, candidato: { ...CANDIDATO_SIMULADO, id: -1, color: COLORES_TELA[0], edicion: 'clasico' } }),
  leerIsbn: (isbn) => {
    set({
      candidato: { ...candidatoDesdeIsbn(isbn), id: -1, color: COLORES_TELA[0], edicion: 'clasico' },
      busqueda: 'buscando',
    });
    void buscarPorIsbn(isbn).then(({ estado, meta }) => {
      const actual = get().candidato;
      if (!actual || actual.isbn !== isbn) return; // el usuario ya cerró o leyó otro
      set({
        candidato: meta ? { ...actual, ...meta } : actual,
        busqueda: estado,
      });
    });
  },

  anadirCandidato: (posesion = 'tengo') => {
    const { libros, candidato } = get();
    if (!candidato) return;
    if (candidato.isbn && libros.some((l) => l.isbn === candidato.isbn)) return;
    const { id: _sinId, color: _c, edicion: _e, ...datos } = candidato;
    const nuevo = conTela({ ...datos, ...(posesion === 'quiero' ? { posesion: 'quiero' as const } : {}) }, nuevoId());
    const siguiente = [...libros, nuevo];
    repositorioLocal.guardar(siguiente);
    set({ libros: siguiente, candidato: null, busqueda: null, filtro: 'todos' });
  },

  reemplazaLibros: (libros) => {
    repositorioLocal.guardar(libros);
    set({ libros, abierto: null });
  },

  importa: (nuevos) => {
    if (!nuevos.length) return 0;
    const libros = [...get().libros, ...nuevos.map((l, i) => conTela(l, nuevoId(i * 100)))];
    repositorioLocal.guardar(libros);
    set({ libros });
    return nuevos.length;
  },

  valorar: (id, valoracion) => {
    const libros = get().libros.map((l) => {
      if (l.id !== id) return l;
      if (valoracion) return { ...l, valoracion };
      const { valoracion: _quitada, ...resto } = l;
      return resto;
    });
    repositorioLocal.guardar(libros);
    set({ libros });
  },

  editarLibro: (id, cambios) => {
    const libros = get().libros.map((l) => (l.id === id ? { ...l, ...cambios } : l));
    repositorioLocal.guardar(libros);
    set({ libros });
  },

  prestar: (id, a, desde) => {
    const libros = get().libros.map((l) => (l.id === id ? { ...l, prestamo: { a: a.trim(), desde } } : l));
    repositorioLocal.guardar(libros);
    set({ libros });
  },

  devolver: (id) => {
    const libros = get().libros.map((l) => {
      if (l.id !== id) return l;
      const { prestamo: _quitado, ...resto } = l;
      return resto;
    });
    repositorioLocal.guardar(libros);
    set({ libros });
  },

  borrarLibro: (id) => {
    const libros = get().libros.filter((l) => l.id !== id);
    repositorioLocal.guardar(libros);
    set({ libros, abierto: null });
  },

  descartarCandidato: () => set({ candidato: null, busqueda: null }),
}));
