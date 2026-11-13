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

/** Visor de la cámara. En la app nativa lee el ISBN; en el navegador queda «Simular lectura». */
export function Escanear({ onManual }: { onManual: () => void }) {
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
        <button className="btn sec" id="manual" onClick={onManual}>Añadir a mano</button>
      </div>
    </div>
  );
}
