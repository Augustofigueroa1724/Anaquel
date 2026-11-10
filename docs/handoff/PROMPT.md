# Prompt para Claude Code: construir Anaquel

> Pega este archivo como primer mensaje en Claude Code, con la carpeta `anaquel-handoff/` copiada en la raíz del repo (por ejemplo en `docs/handoff/`).

---

Vamos a construir **Anaquel**, una app móvil para catalogar libros (iPhone y Android con Capacitor). El diseño está cerrado y validado; tu trabajo es implementarlo fielmente en el repo.

## Lee primero (en este orden)
1. `docs/handoff/DISENO.md`: dirección visual, tokens, componentes, animaciones y decisiones. Es la fuente de verdad del diseño.
2. `docs/handoff/prototipo/anaquel.html`: prototipo funcional de un solo archivo. Todo el comportamiento y el CSS de referencia están aquí. Ábrelo en un navegador a 390 px de ancho.
3. `docs/handoff/capturas/`: capturas de referencia (claro y oscuro) y `09-animacion-sacar-libro.gif`.
4. `docs/handoff/brief/brief-original.txt`: brief original del cliente con las restricciones y el HTML anterior.
5. `docs/handoff/diseno/tokens.css`: tokens de color y tipografía listos para copiar.

## Qué es la app
- Lectores que quieren su biblioteca ordenada y compartirla con amigos.
- El usuario escanea el ISBN (código de barras) con la cámara y el libro se añade a su anaquel.
- Pantalla principal: un mueble de biblioteca con baldas y los libros como lomos. Hay versión 3D opcional (three.js) y versión HTML plana que debe verse siempre igual de bien.
- Pestañas abajo: **Anaquel** y **Escanear**.
- Filtros arriba: Todos, Leyendo, Pendientes, Leídos (con número de libros en cada uno).
- Al tocar un lomo, el libro sale del estante en 3D, gira, muestra la portada de frente y sube la ficha debajo (título, autor, año, ISBN, estado de lectura, botones Prestar y Listo).
- Escanear: visor de cámara con marco y línea de barrido; al leer, el libro aparece desde el visor con la ficha y el botón «Añadir al anaquel».

## Restricciones que no se pueden romper
- Toda la interfaz en **español** (se traducirá después: centraliza los textos en un archivo de i18n desde el principio).
- Móvil primero, **390 px**, margen lateral 16 px mínimo, **sin scroll horizontal**, respetar `safe-area` (arriba y abajo).
- Modo **claro y oscuro** con tokens en `:root` (ver `tokens.css`).
- El 3D (three.js) es **opcional**: si no carga o no hay WebGL, la estantería HTML es la vista principal y debe verse perfecta.
- Sin texto de relleno: títulos y autores reales.
- Accesibilidad: botones reales, `aria-label` en lomos («Título, Autor. Estado»), contraste ≥ 4,5:1, objetivos táctiles ≥ 44 px, `prefers-reduced-motion` desactiva las animaciones.

## Plan de trabajo que propongo
1. Inspecciona el repo (stack, estructura, si ya hay Capacitor). Si no hay stack, propón uno ligero (Vite + TypeScript, sin framework pesado o con el que ya use el repo) y espera mi visto bueno antes de instalar.
2. Porta los tokens (`tokens.css`) y las fuentes (Bodoni Moda, Manrope, Oswald, IBM Plex Mono). En producción, empaqueta las fuentes en local (no depender de Google Fonts en la app nativa).
3. Construye por componentes, siguiendo `DISENO.md`: cabecera, filtros segmentados, mueble y baldas, lomo (3 ediciones), portada (3 ediciones), libro 3D animado, hoja de ficha, escáner, barra inferior.
4. Modelo de datos: `Libro { id, titulo, autor, anio, isbn, estado: 'leido'|'leyendo'|'pendiente', color, edicion: 'clasico'|'moderno'|'condensado' }`. Persistencia local primero; la búsqueda por ISBN se conectará después a una API de libros (deja la interfaz preparada; en el prototipo se simula con «Simular lectura»).
5. Escáner real con un plugin de Capacitor para códigos de barras (EAN-13/ISBN). Mantén «Simular lectura» como modo de desarrollo.
6. Verifica cada pantalla contra las capturas a 390 px en claro y oscuro.

## Reglas de trabajo
- Trabaja en `main` y haz merge automáticamente salvo que te diga lo contrario.
- Documenta los cambios y decisiones relevantes en `CLAUDE.md` y `README.md` sin que te lo recuerde. Al empezar, crea/actualiza `CLAUDE.md` con un resumen de `DISENO.md` y un enlace a `docs/handoff/`.
- Código completo y funcional, listo para probar.
- Respuestas breves y al grano.
