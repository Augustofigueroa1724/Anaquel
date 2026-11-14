// Diagnóstico: pregunta un ISBN a las tres fuentes reales (Google Books, BnF y Open Library)
// y enseña qué responde cada una. Se lanza con el workflow «Consultar ISBN» (red de GitHub).
const isbn = (process.argv[2] || '').replace(/[^0-9Xx]/g, '');
if (!isbn) { console.error('Uso: node tools/consulta-isbn.mjs ISBN'); process.exit(1); }
const clave = process.env.VITE_GOOGLE_BOOKS_KEY ? `&key=${process.env.VITE_GOOGLE_BOOKS_KEY}` : '';
const fuentes = {
  'Google Books (isbn:)': `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${clave}`,
  'Google Books (texto)': `https://www.googleapis.com/books/v1/volumes?q=${isbn}${clave}`,
  'BnF (bib.isbn all)': `https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&recordSchema=dublincore&maximumRecords=1&query=${encodeURIComponent(`bib.isbn all "${isbn}"`)}`,
  'BnF (bib.anywhere)': `https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&recordSchema=dublincore&maximumRecords=1&query=${encodeURIComponent(`bib.anywhere all "${isbn}"`)}`,
  'Open Library (api/books)': `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
  'Open Library (search)': `https://openlibrary.org/search.json?isbn=${isbn}&fields=title,author_name,first_publish_year`,
};
for (const [nombre, url] of Object.entries(fuentes)) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const t = await r.text();
    console.log(`\n=== ${nombre}: HTTP ${r.status}\n${t.replace(/\s+/g, ' ').slice(0, 1500)}`);
  } catch (e) {
    console.log(`\n=== ${nombre}: ERROR ${e.message}`);
  }
}
