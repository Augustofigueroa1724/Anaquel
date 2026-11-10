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
