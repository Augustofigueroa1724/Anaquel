// Busca ISBN, portada, editorial y páginas de una lista de libros (título y autor) en Google Books
// (con la clave) y, si no, en Open Library. Lo lanza el workflow «Datos de libros».
// Uso: node tools/busca-titulos.mjs lista.json salida.json
import { readFileSync, writeFileSync } from 'node:fs';
const [entrada, salida] = process.argv.slice(2);
const lista = JSON.parse(readFileSync(entrada, 'utf8'));
const clave = process.env.VITE_GOOGLE_BOOKS_KEY ? `&key=${process.env.VITE_GOOGLE_BOOKS_KEY}` : '';
const plano = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (r.ok) return await r.json();
      if (r.status !== 429 && r.status < 500) return null;
    } catch { /* reintenta */ }
    await espera(1500 * (i + 1));
  }
  return null;
}
const apellido = (a) => plano(a).split(' ').pop();

async function google(l) {
  const q = encodeURIComponent(`intitle:"${l.titulo.replace(/\.+$/, '')}" inauthor:"${l.autor.split(' et ')[0]}"`);
  const r = await json(`https://www.googleapis.com/books/v1/volumes?q=${q}&printType=books&maxResults=20${clave}`);
  const t = plano(l.titulo);
  let mejor = null;
  for (const it of r?.items || []) {
    const v = it.volumeInfo || {};
    const isbn = (v.industryIdentifiers || []).find((x) => x.type === 'ISBN_13')?.identifier;
    if (!isbn) continue;
    const tv = plano(v.title);
    if (!(tv === t || tv.startsWith(t) || t.startsWith(tv))) continue;
    if (!(v.authors || []).some((a) => plano(a).includes(apellido(l.autor)))) continue;
    const img = v.imageLinks?.thumbnail;
    const p = (isbn.startsWith('9782') || isbn.startsWith('97910') ? 4 : 0) + (v.language === 'fr' ? 2 : 0) + (img ? 3 : 0) + (tv === t ? 1 : 0) + (v.pageCount ? 0.5 : 0);
    if (!mejor || p > mejor.p) mejor = { p, isbn, portada: img ? img.replace('http:', 'https:').replace('&edge=curl', '') : '', editorial: v.publisher || '', paginas: v.pageCount || 0, fuente: 'google' };
  }
  return mejor;
}

async function openLibrary(l) {
  const r = await json(`https://openlibrary.org/search.json?title=${encodeURIComponent(l.titulo)}&author=${encodeURIComponent(l.autor.split(' et ')[0])}&limit=5&fields=key,title,editions,editions.isbn,editions.language,editions.publisher,editions.number_of_pages,editions.cover_i`);
  for (const d of r?.docs || []) {
    for (const e of d.editions?.docs || []) {
      const isbn = (e.isbn || []).find((x) => /^97(82|910)\d+$/.test(x)) || (e.isbn || []).find((x) => x.length === 13);
      if (isbn) return { p: 0, isbn, portada: e.cover_i ? `https://covers.openlibrary.org/b/id/${e.cover_i}-L.jpg` : '', editorial: (e.publisher || [])[0] || '', paginas: e.number_of_pages || 0, fuente: 'openlibrary' };
    }
  }
  return null;
}

const fuera = [];
for (const l of lista) {
  const g = await google(l);
  const o = g && g.portada ? null : await openLibrary(l);
  const m = g ? { ...g, portada: g.portada || (o?.isbn === g.isbn ? o.portada : '') } : o;
  // Sin portada de Google, se prueba la de Open Library por ISBN.
  if (m && !m.portada) {
    try {
      const u = `https://covers.openlibrary.org/b/isbn/${m.isbn}-L.jpg?default=false`;
      const r = await fetch(u, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
      if (r.ok) m.portada = u.replace('?default=false', '');
    } catch { /* sin portada */ }
  }
  fuera.push({ ...l, ...(m ? { isbn: m.isbn, portada: m.portada, editorial: m.editorial, paginas: m.paginas, fuente: m.fuente } : {}) });
  console.log(l.anio, l.titulo, '→', m ? `${m.isbn} ${m.portada ? 'con portada' : 'SIN PORTADA'} (${m.fuente})` : 'NO ENCONTRADO');
  await espera(250);
}
writeFileSync(salida, JSON.stringify(fuera));
console.log('Con ISBN:', fuera.filter((x) => x.isbn).length, 'de', fuera.length, '· con portada:', fuera.filter((x) => x.portada).length);
