// Baja la portada de cada ISBN (Google Books con la clave; si no, Open Library) a una carpeta.
// Uso: node tools/portadas.mjs carpeta ISBN1 ISBN2 …  (lo lanza el workflow «Portadas»)
import { mkdirSync, writeFileSync } from 'node:fs';
const [carpeta, ...isbns] = process.argv.slice(2);
mkdirSync(carpeta, { recursive: true });
const clave = process.env.VITE_GOOGLE_BOOKS_KEY ? `&key=${process.env.VITE_GOOGLE_BOOKS_KEY}` : '';
const datos = {};
for (const isbn of isbns) {
  let url = null;
  try {
    const r = await (await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${clave}`)).json();
    const v = r.items?.[0]?.volumeInfo;
    if (v) datos[isbn] = { titulo: v.title, autor: (v.authors || []).join(', '), editorial: v.publisher || '', anio: v.publishedDate || '' };
    const img = v?.imageLinks;
    if (img?.thumbnail) url = img.thumbnail.replace('http:', 'https:').replace('&edge=curl', '').replace('zoom=1', 'zoom=2');
  } catch {}
  if (!url) url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  try {
    const r = await fetch(url);
    const b = Buffer.from(await r.arrayBuffer());
    if (r.ok && b.length > 2000) { writeFileSync(`${carpeta}/${isbn}.jpg`, b); console.log(isbn, 'portada', b.length, url.slice(0, 60)); }
    else console.log(isbn, 'sin portada', r.status);
  } catch (e) { console.log(isbn, 'error', e.message); }
}
writeFileSync(`${carpeta}/datos.json`, JSON.stringify(datos, null, 2));
console.log(JSON.stringify(datos, null, 2));
