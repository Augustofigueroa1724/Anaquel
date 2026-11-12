import { useEffect, useState } from 'react';
import { entraConApple, entraConGoogle, ES_IOS, tomaErrorLogin, type Resultado } from '../../platform/cuenta';

/** Entrar con Apple (solo iPhone, Apple lo exige si hay otro login) o con Google. */
export function BotonesLogin() {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const e = tomaErrorLogin(); if (e) setError(e); }, []);

  async function entra(f: () => Promise<Resultado>) {
    setOcupado(true); setError('');
    const r = await f();
    setOcupado(false);
    if (!r.ok && r.error) setError(r.error);
  }

  return (
    <div className="login">
      {ES_IOS && (
        <button className="btn login-apple" disabled={ocupado} onClick={() => entra(entraConApple)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.8zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z"/></svg>
          Continuar con Apple
        </button>
      )}
      <button className="btn sec login-google" disabled={ocupado} onClick={() => entra(entraConGoogle)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8.3z"/><path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9C3.7 21 7.6 23.5 12 23.5z"/><path fill="#FBBC05" d="M5.6 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.8H1.8C1 8.3.5 10.1.5 12s.5 3.7 1.3 5.2l3.8-2.9z"/><path fill="#EA4335" d="M12 5c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.5 15.1.5 12 .5 7.6.5 3.7 3 1.8 6.8l3.8 2.9C6.5 7 9 5 12 5z"/></svg>
          Continuar con Google
      </button>
      {error && <p className="nota" role="alert">{error}</p>}
    </div>
  );
}
