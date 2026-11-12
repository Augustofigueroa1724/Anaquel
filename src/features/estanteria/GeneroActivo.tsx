import { useBiblioteca } from '../../app/biblioteca';

/** Pastilla con el género que se está viendo; tocarla vuelve a todos. */
export function GeneroActivo() {
  const genero = useBiblioteca((s) => s.filtroGenero);
  const quitar = useBiblioteca((s) => s.setFiltroGenero);
  if (!genero) return null;
  return (
    <div className="genero-activo">
      <button onClick={() => quitar(null)} aria-label={`Quitar el filtro ${genero}`}>
        <span>{genero}</span><span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
