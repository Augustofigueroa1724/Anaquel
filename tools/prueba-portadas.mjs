// Prueba qué variantes de la portada de Google Books dan más resolución sin caer en el
// «image not available». Uso: node tools/prueba-portadas.mjs ISBN1 ISBN2 …
const clave = process.env.VITE_GOOGLE_BOOKS_KEY ? `&key=${process.env.VITE_GOOGLE_BOOKS_KEY}` : '';
function medidas(b) { // JPEG: busca el marcador SOF y lee alto y ancho
  for (let i = 2; i < b.length - 9; i++) if (b[i] === 0xff && (b[i + 1] & 0xf0) === 0xc0 && b[i + 1] !== 0xc4 && b[i + 1] !== 0xc8 && b[i + 1] !== 0xcc)
    return `${b.readUInt16BE(i + 7)}x${b.readUInt16BE(i + 5)}`;
  return '?';
}
for (const isbn of process.argv.slice(2)) {
  const r = await (await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${clave}`)).json();
  const it = r.items?.[0];
  const t = it?.volumeInfo?.imageLinks?.thumbnail;
  console.log(`\n${isbn} ${it?.volumeInfo?.title} id=${it?.id}`);
  if (!t) { console.log('  sin imageLinks'); continue; }
  const base = t.replace('http:', 'https:').replace('&edge=curl', '');
  const vars = {
    zoom1: base,
    zoom2: base.replace('zoom=1', 'zoom=2'),
    zoom3: base.replace('zoom=1', 'zoom=3'),
    fife600: `${base}&fife=w600-h900`,
    fife800: base.replace('zoom=1', 'zoom=0') + '&fife=w800',
    publisher: `https://books.google.com/books/publisher/content/images/frontcover/${it.id}?fife=w600-h900&source=gbs_api`,
  };
  for (const [n, u] of Object.entries(vars)) {
    try { const res = await fetch(u); const b = Buffer.from(await res.arrayBuffer()); console.log(`  ${n.padEnd(10)} ${res.status} ${String(b.length).padStart(7)} B ${medidas(b)}`); }
    catch (e) { console.log(`  ${n} error ${e.message}`); }
  }
}
