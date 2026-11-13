// Supabase: proyecto `cratemates`, tablas aq_* (opción B, 12 nov 2026). La clave
// publicable es pública por diseño: lo que protege los datos son las políticas RLS.
export const SUPABASE_URL = 'https://qwuuxbbutoatiytxsfra.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_k0aAT6h3RQf-xgpoPYFblg_mSx_vPMN';
// Esquema de la app para volver del login de Google: anaquel://auth
export const APP_SCHEME = 'anaquel';
// Clave de Google Books (opcional). Sin clave, Google Books comparte un cupo diario con todo el
// mundo y a veces responde 429; entonces el autor se busca en Open Library y la BnF. Se inyecta en
// el build desde el secret GOOGLE_BOOKS_KEY (variable VITE_GOOGLE_BOOKS_KEY); es pública en el
// bundle como cualquier clave de cliente: se limita en Google Cloud a la API Books.
const CLAVE_BOOKS: string = (import.meta.env?.VITE_GOOGLE_BOOKS_KEY as string | undefined) ?? '';
export const conClaveBooks = (url: string): string => (CLAVE_BOOKS ? `${url}&key=${encodeURIComponent(CLAVE_BOOKS)}` : url);
