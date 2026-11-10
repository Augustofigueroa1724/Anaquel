import type { Libro } from '../domain/libro';
import type { RepositorioLibros } from './repositorio';

const CLAVE = 'anaquel.libros.v1';

/** localStorage. Si el navegador lo bloquea, la app sigue en memoria. */
export const repositorioLocal: RepositorioLibros = {
  cargar() {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (!raw) return null;
      const datos: unknown = JSON.parse(raw);
      return Array.isArray(datos) ? (datos as Libro[]) : null;
    } catch {
      return null;
    }
  },
  guardar(libros) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(libros));
    } catch {
      /* Sin almacenamiento: la sesión sigue funcionando en memoria. */
    }
  },
};
