/** Un ISBN-13 (lo que codifica el EAN-13 de un libro): 13 dígitos, prefijo 978 o 979 y dígito de control válido. */
export function esIsbn13(codigo: string): boolean {
  if (!/^\d{13}$/.test(codigo)) return false;
  if (!/^97[89]/.test(codigo)) return false;
  const suma = [...codigo.slice(0, 12)].reduce((s, d, i) => s + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  const control = (10 - (suma % 10)) % 10;
  return control === Number(codigo[12]);
}

/** Formato legible: 978-0-00-000000-0 se muestra con guiones; aquí solo se separa el prefijo. */
export function formateaIsbn(isbn: string): string {
  return isbn.length === 13 ? `${isbn.slice(0, 3)}-${isbn.slice(3)}` : isbn;
}

/** ISBN-10 (o ASIN de libro de Amazon) → ISBN-13 con prefijo 978. null si no es un ISBN-10 válido. */
export function isbn10a13(codigo: string): string | null {
  const c = codigo.replace(/[^0-9Xx]/g, '').toUpperCase();
  if (!/^\d{9}[\dX]$/.test(c)) return null;
  const suma10 = [...c].reduce((s, d, i) => s + (d === 'X' ? 10 : Number(d)) * (10 - i), 0);
  if (suma10 % 11 !== 0) return null;
  const base = '978' + c.slice(0, 9);
  const suma = [...base].reduce((s, d, i) => s + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return base + ((10 - (suma % 10)) % 10);
}
