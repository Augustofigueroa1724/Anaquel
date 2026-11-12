// Genera las imágenes maestras del icono y la pantalla de arranque a partir de
// tools/icono.svg (el Monograma C·2), con la Bodoni Moda local de @fontsource.
// Uso: npm run iconos  (después coloca_iconos.py las reparte por iOS, Android y web)
// Si el navegador no está en la ruta por defecto: PLAYWRIGHT_CHROMIUM=/ruta/chromium
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const SALIDA = 'tools/salida';
mkdirSync(SALIDA, { recursive: true });
const svg = readFileSync('tools/icono.svg', 'utf8');
const sinFondo = svg.replace(/<rect width="1024" height="1024" fill="url\(#c-fondo\)"\/>/, '');
const fuente = readFileSync('node_modules/@fontsource/bodoni-moda/files/bodoni-moda-latin-500-normal.woff2').toString('base64');
const css = `@font-face{font-family:"Bodoni Moda";font-weight:500;src:url(data:font/woff2;base64,${fuente}) format("woff2")}
html,body{margin:0;background:transparent}svg{display:block;width:100%;height:100%}`;

const navegador = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined, args: ['--no-sandbox'] });
async function pinta(nombre, lado, cuerpo, fondo = 'transparent') {
  const p = await navegador.newPage({ viewport: { width: lado, height: lado }, deviceScaleFactor: 1 });
  await p.setContent(`<style>${css} body{background:${fondo};width:${lado}px;height:${lado}px}</style>${cuerpo}`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${SALIDA}/${nombre}.png`, omitBackground: fondo === 'transparent' });
  await p.close();
}

// Icono cuadrado y opaco (iOS lo recorta él; Android «legacy»).
await pinta('icono', 1024, svg, '#121214');
// Icono redondo (Android ic_launcher_round).
await pinta('icono-redondo', 1024, `<div style="width:1024px;height:1024px;border-radius:50%;overflow:hidden">${svg}</div>`);
// Primer plano del icono adaptativo de Android: el dibujo cabe en la zona segura (72 de 108 dp).
await pinta('primer-plano', 1024, `<div style="width:1024px;height:1024px;display:flex;align-items:center;justify-content:center"><div style="width:683px;height:683px">${sinFondo}</div></div>`);
// Pantalla de arranque: fondo tinta y el monograma en el centro.
await pinta('arranque', 2732, `<div style="width:2732px;height:2732px;display:flex;align-items:center;justify-content:center"><div style="width:900px;height:900px">${sinFondo}</div></div>`, '#121214');
await navegador.close();
console.log('Maestras en', SALIDA);
