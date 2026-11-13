// Prueba de humo (decisión de los otros repos): recorre la app compilada en un
// navegador de verdad y falla con cualquier error de JavaScript, desbordamiento
// horizontal o flujo roto. Uso: npm run humo
// Si el navegador está en otra ruta (como en el entorno de desarrollo), define
// PLAYWRIGHT_CHROMIUM=/ruta/al/chromium.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PUERTO = 4173;
const BASE = `http://localhost:${PUERTO}/`;
const errores = [];

function esperaServidor(url, intentos = 60) {
  return new Promise((resolve, reject) => {
    const intenta = async (n) => {
      try {
        const r = await fetch(url);
        if (r.ok) return resolve();
      } catch { /* aún no arranca */ }
      if (n <= 0) return reject(new Error('El servidor de preview no arranca'));
      setTimeout(() => intenta(n - 1), 500);
    };
    intenta(intentos);
  });
}

async function run() {
  const preview = spawn('npx', ['vite', 'preview', '--port', String(PUERTO), '--strictPort'], { stdio: 'ignore' });
  try {
    await esperaServidor(BASE);
    const navegador = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
      args: ['--no-sandbox'],
    });
    const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errores.push(`error de script: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) errores.push(`consola: ${m.text()}`);
    });
    // Fuentes y búsquedas externas no se usan en la prueba.
    await page.route(/fonts\.g(oogleapis|static)\.com|googleapis\.com\/books|openlibrary\.org/, (r) => r.abort());

    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForSelector('.lomo');
    const lomos = await page.locator('.lomo').count();
    if (lomos === 0) errores.push('no hay lomos en la estantería');

    const desborda = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (desborda > 0) errores.push(`desbordamiento horizontal de ${desborda}px`);

    await page.locator('.lomo').nth(2).click();
    await page.waitForSelector('.hoja.abierta h2');
    await page.locator('.btn', { hasText: 'Listo' }).click();
    await page.waitForSelector('.hoja:not(.abierta)');

    await page.locator('.chip[data-f="pendiente"]').click();
    const pendientes = await page.locator('.lomo').count();
    if (pendientes === 0) errores.push('el filtro Pendientes no muestra libros');
    await page.locator('.chip[data-f="todos"]').click();

    // Mueble nórdico: el botón cambia el estilo y vuelve al clásico.
    await page.locator('#cambia-mueble').click();
    if (await page.evaluate(() => document.documentElement.dataset.estilo) !== 'nordico') errores.push('el botón no cambia al mueble nórdico');
    if (await page.locator('.lomo').count() === 0) errores.push('el mueble nórdico no muestra libros');
    await page.locator('#cambia-mueble').click();
    if (await page.evaluate(() => document.documentElement.dataset.estilo)) errores.push('el botón no vuelve al mueble clásico');

    const antes = await page.locator('#cuenta').innerText();
    await page.locator('#tab-escanear').click();
    await page.locator('#opcion-codigo').click();
    if (await page.locator('.acciones button', { hasText: /^Escanear$/ }).count() > 0) {
      errores.push('en la web no debe aparecer el botón de escaneo nativo');
    }
    await page.locator('#simular').click();
    await page.locator('.hoja.abierta .btn', { hasText: 'Añadir al anaquel' }).click();
    await page.waitForSelector('.hoja:not(.abierta)');
    await page.locator('#tab-estanteria').click();
    const despues = await page.locator('#cuenta').innerText();
    if (antes === despues) errores.push('añadir un libro simulado no sube el contador');

    // Añadir a mano desde la pestaña Escanear.
    await page.locator('#tab-escanear').click();
    await page.locator('#manual').click();
    await page.locator('.panel input').first().fill('Libro de prueba a mano');
    await page.locator('.panel button[type=submit]').click();
    await page.waitForSelector('.panel', { state: 'detached' });
    const trasManual = await page.locator('#cuenta').innerText();
    if (trasManual === despues) errores.push('añadir a mano no sube el contador');

    // Pestañas nuevas: lista de deseos, amigos (sin sesión) y ajustes.
    for (const id of ['#tab-deseos', '#tab-amigos', '#tab-estanteria']) {
      await page.locator(id).click();
      await page.waitForTimeout(200);
    }
    await page.locator('.rueda').click();
    await page.waitForSelector('.panel');
    await page.locator('.panel .cerrar').click();

    await navegador.close();
  } finally {
    preview.kill();
  }

  if (errores.length) {
    console.error('Prueba de humo fallida:\n- ' + errores.join('\n- '));
    process.exit(1);
  }
  console.log('Prueba de humo correcta.');
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
