// Baja la portada de cada ISBN (Google Books con la clave; si no, Open Library) a una carpeta.
// Uso: node tools/portadas.mjs carpeta ISBN1 ISBN2 …  (lo lanza el workflow «Portadas»)
import { mkdirSync, writeFileSync } from 'node:fs';
const [carpeta, ...isbns] = process.argv.slice(2);
mkdirSync(carpeta, { recursive: true });
const clave = process.env.VITE_GOOGLE_BOOKS_KEY ? `&key=${process.env.VITE_GOOGLE_BOOKS_KEY}` : '';
const datos = {};
for (const isbn of isbns) {
  const candidatas = [];
  try {
    const r = await (await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${clave}`)).json();
    const v = r.items?.[0]?.volumeInfo;
    if (v) datos[isbn] = { titulo: v.title, autor: (v.authors || []).join(', '), editorial: v.publisher || '', anio: v.publishedDate || '' };
    const img = v?.imageLinks;
    if (img?.thumbnail) {
      const base = img.thumbnail.replace('http:', 'https:').replace('&edge=curl', '');
      candidatas.push(base.replace('zoom=1', 'zoom=2'), base);
    }
  } catch {}
  candidatas.push(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`);
  let ok = false;
  for (const url of candidatas) {
    try {
      const r = await fetch(url);
      const b = Buffer.from(await r.arrayBuffer());
      // 15567 bytes = el «image not available» de Google; menos de 3 KB, vacío.
      if (!r.ok || b.length < 3000 || b.length === 15567) { console.log(isbn, 'descartada', r.status, b.length, url.slice(0, 50)); continue; }
      writeFileSync(`${carpeta}/${isbn}.jpg`, b); console.log(isbn, 'portada', b.length, url.slice(0, 60)); ok = true; break;
    } catch (e) { console.log(isbn, 'error', e.message); }
  }
  if (!ok) console.log(isbn, 'SIN PORTADA');
}
writeFileSync(`${carpeta}/datos.json`, JSON.stringify(datos, null, 2));
console.log(JSON.stringify(datos, null, 2));
