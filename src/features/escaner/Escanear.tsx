import { useBiblioteca } from '../../app/biblioteca';

/** Visor de la cámara. Hoy simulado: la lectura real llega con el plugin nativo. */
export function Escanear() {
  const simular = useBiblioteca((s) => s.simularLectura);
  return (
    <div className="visor" aria-label="Vista de la cámara">
      <div className="fondo" />
      <div className="marco" />
      <p>
        Apunta al código de barras
        <small>Suele estar en la contraportada</small>
      </p>
      <div className="acciones">
        <button className="btn" id="simular" onClick={simular}>Simular lectura</button>
      </div>
    </div>
  );
}
