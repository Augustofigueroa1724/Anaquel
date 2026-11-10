import type { Libro } from '../domain/libro';

/** Contrato de persistencia. Hoy localStorage; más adelante SQLite o el backend. */
export interface RepositorioLibros {
  cargar(): Libro[] | null;
  guardar(libros: Libro[]): void;
}
