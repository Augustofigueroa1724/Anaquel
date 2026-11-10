import { create } from 'zustand';
import { CANDIDATO_SIMULADO, LIBROS_EJEMPLO } from '../data/ejemplos';
import { buscarPorIsbn, type Busqueda } from '../data/buscar-isbn';
import { repositorioLocal } from '../data/repositorio-local';
import {
  candidatoDesdeIsbn, COLORES_TELA, edicionDe, type Estado, type Filtro, type Libro,
} from '../domain/libro';

interface Biblioteca {
  libros: Libro[];
  filtro: Filtro;
  abierto: number | null;
  candidato: Libro | null;
  busqueda: Busqueda | null;
  setFiltro(f: Filtro): void;
  abrir(id: number): void;
  cerrar(): void;
  cambiaEstado(id: number, estado: Estado): void;
  simularLectura(): void;
  leerIsbn(isbn: string): void;
  anadirCandidato(): void;
  descartarCandidato(): void;
}

const guardados = repositorioLocal.cargar();
const inicial = guardados && guardados.length > 0 ? guardados : LIBROS_EJEMPLO;

export const useBiblioteca = create<Biblioteca>((set, get) => ({
  libros: inicial,
  filtro: 'todos',
  abierto: null,
  candidato: null,
  busqueda: null,

  setFiltro: (filtro) => set({ filtro }),
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

  anadirCandidato: () => {
    const { libros, candidato } = get();
    if (!candidato) return;
    if (libros.some((l) => l.isbn === candidato.isbn)) return;
    const id = libros.reduce((max, l) => Math.max(max, l.id), -1) + 1;
    const nuevo: Libro = { ...candidato, id, color: COLORES_TELA[id % COLORES_TELA.length], edicion: edicionDe(id) };
    const siguiente = [...libros, nuevo];
    repositorioLocal.guardar(siguiente);
    set({ libros: siguiente, candidato: null, busqueda: null, filtro: 'todos' });
  },

  descartarCandidato: () => set({ candidato: null, busqueda: null }),
}));
