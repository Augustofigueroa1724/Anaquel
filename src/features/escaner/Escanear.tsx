import { useState } from 'react';
import { useBiblioteca } from '../../app/biblioteca';
import { Capacitor } from '@capacitor/core';
import { escaneaCodigo } from '../../platform/escaner';

const NATIVO = Capacitor.isNativePlatform();

const AVISOS: Record<string, string> = {
  'sin-permiso': 'Necesitamos permiso para usar la cámara. Actívalo en Ajustes.',
  'no-disponible': 'El lector de códigos no está disponible en este dispositivo.',
  'codigo-no-valido': 'Ese código no es el ISBN de un libro.',
};

/**
 * Pestaña «Añadir»: primero se elige cómo (como la puerta de Fifth Square: tarjetas
 * antes, no un conmutador dentro). Código de barras abre el visor; a mano, el formulario.
 */
export function Escanear({ onManual }: { onManual: () => void }) {
  const [modo, setModo] = useState<'elegir' | 'codigo'>('elegir');
  if (modo === 'codigo') return <Visor onVolver={() => setModo('elegir')} />;
  return (
    <div className="puerta">
      <h2 className="titulo-seccion">Añadir un libro</h2>
      <button className="tarjeta-opcion" id="opcion-codigo" onClick={() => setModo('codigo')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden="true"><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M8 8v8M11 8v8M13.5 8v8M16 8v8" /></svg>
        <span><b>Código de barras</b><small>Escanea el ISBN de la contraportada y los datos se rellenan solos</small></span>
      </button>
      <button className="tarjeta-opcion" id="manual" onClick={onManual}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3zM13.5 6.5l3 3" /></svg>
        <span><b>A mano</b><small>Para libros sin código o que no aparecen: escribe el título y el autor</small></span>
      </button>
    </div>
  );
}

/** Visor de la cámara. En la app nativa lee el ISBN; en el navegador queda «Simular lectura». */
function Visor({ onVolver }: { onVolver: () => void }) {
  const simular = useBiblioteca((s) => s.simularLectura);
  const leerIsbn = useBiblioteca((s) => s.leerIsbn);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function escanear() {
    setOcupado(true);
    setAviso(null);
    const r = await escaneaCodigo();
    setOcupado(false);
    if (r.tipo === 'isbn') leerIsbn(r.isbn);
    else if (r.tipo !== 'cancelado') setAviso(AVISOS[r.tipo] ?? null);
  }

  return (
    <div className="visor" aria-label="Vista de la cámara">
      <div className="fondo" />
      <div className="marco" />
      <button className="volver-visor" onClick={onVolver}>‹ Volver</button>
      <p>
        Apunta al código de barras
        <small>Suele estar en la contraportada</small>
        {aviso && <small role="alert">{aviso}</small>}
      </p>
      <div className="acciones">
        {NATIVO && (
          <button className="btn" onClick={escanear} disabled={ocupado}>
            {ocupado ? 'Leyendo…' : 'Escanear'}
          </button>
        )}
        {!NATIVO && <button className="btn" id="simular" onClick={simular}>Simular lectura</button>}
      </div>
    </div>
  );
}
