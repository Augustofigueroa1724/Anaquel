# Anaquel · Especificación de diseño

Dirección: **«Nogal y latón»**. Una biblioteca privada: pared con papel pintado, mueble de caoba en perspectiva con luz de latón, lomos con ediciones de carácter propio y un único acento latón. Premium, editorial, claramente de libros.

Referencia viva: `prototipo/anaquel.html` (todo el CSS y JS). Capturas: `capturas/`.

---

## 1. Historial de decisiones (para no repetir errores)

| Iteración | Decisión | Motivo |
|---|---|---|
| Original | Verde pino #2f5d50 en todo | Rechazado: parecía app de salud / bosque |
| v1 «Papel y lacre» | Crema + Fraunces + terracota | Rechazado: **demasiado parecido al look de Claude** (crema, serif, arcilla) |
| v2 «Nogal y latón» | Negro/gris neutro, Bodoni Moda + Manrope, latón | Aprobado como base |
| Fondo claro | Probados A gris galería #e9eaec, B blanco #fff, C pared verde-gris #dde2de | **Elegido C** + papel pintado de ojiva |
| Mueble | Cornisa, pilastras acanaladas, caoba, luz de latón por balda, portaetiquetas | Aprobado («más elegante») |

**Evitar siempre:** fondos crema/marfil cálidos (#FAF9F5, #F0EEE6, #eeedeb), Fraunces/Newsreader/Tiempos, acentos terracota/arcilla, verde como acento.

---

## 2. Tokens (ver `diseno/tokens.css`)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | #dde2de | #0e0e0f | Pared |
| `--papel` | ojiva verde-gris + puntos latón | ojiva blanca 4 % | Papel pintado (SVG en data URI, tile 44×66) |
| `--fg` | #131313 | #f2f0ec | Texto |
| `--muted` | #4f5752 | #9b978f | Texto secundario (≥ 4,5:1) |
| `--card` | #f7f8f6 | #19191b | Hoja, indicador de filtros |
| `--line` | #c5ccc7 | #2a2a2e | Separadores |
| `--glass` | rgba(247,248,246,.66) | rgba(32,32,35,.62) | Filtros, barra inferior, pista (con `backdrop-filter: blur`) |
| `--accent` | #b08a46 | #d4ad66 | Latón: solo señales |
| `--wood` | #6b3d22 | #5c3b24 | Caoba |
| `--wood-dark` | #24140c | #1a110b | Fondo de balda |
| `--wood-light` | #9c6440 | #7d5435 | Brillos, cornisa |
| `--wood-side` | #3d2213 | #33200f | Paredes laterales en sombra |
| `--wood-floor` | #7d4a2b | #6b4529 | Suelo de balda |

**El latón se usa SOLO en:** número del filtro activo, cinta de «Leyendo», punto de la pestaña activa, etiqueta de la ficha, foco, línea del escáner, luces y placas del mueble. Los botones principales van en `--fg` sobre `--bg` (tinta), no en latón.

Modo oscuro: por `prefers-color-scheme` o `:root[data-theme="dark"]`; `data-theme="light"` lo fuerza claro.

---

## 3. Tipografía

| Familia | Uso | Detalles |
|---|---|---|
| **Bodoni Moda** (opsz, 400–700, cursiva) | Marca «Anaquel» 40 px, títulos de ficha 30 px, cifras (contador, números de filtros), cursiva de lomos clásicos | Didona de editorial de lujo |
| **Manrope** (400–800) | Toda la interfaz, botones, etiquetas | Etiquetas en mayúsculas 10,5 px, tracking .16–.22em |
| **Oswald** (500–600) | Lomos y portadas «condensados» | Mayúsculas |
| **IBM Plex Mono** 400 | ISBN | |

En la app nativa, empaquetar las fuentes en local (woff2).

---

## 4. Estructura y componentes

### Cabecera
- «MI BIBLIOTECA» (sobrelínea) + «Anaquel» en Bodoni 40 px.
- Derecha: contador `#cuenta` → `<b>43</b>libros` (cifra Bodoni 30 px, etiqueta en mayúsculas).
- Padding superior `12px + safe-area-inset-top`.

### Filtros `#filtros` (control segmentado)
- Rejilla de 4 columnas, fondo `--glass` con blur, radio 16.
- `#indicador`: pastilla `--card` con sombra que se desliza al chip activo (transición .35 s). Se recoloca en `refresca()`, en `resize` y tras cargar fuentes.
- Cada `.chip[data-f]` contiene `<span>Texto</span><span class="n">43</span>`; el número en Bodoni; activo → texto `--fg`, número latón.

### Mueble `.mueble` (estantería HTML)
- Contenedor de caoba: pilastras acanaladas a los lados (gradientes repetidos), brillo diagonal de barniz, sombra profunda.
- `::before` cornisa moldurada (22 px, sobresale 9 px), `::after` zócalo.
- Baldas `.balda`: se crean **según el ancho real** (llenado greedy por ancho de lomo) → nunca hay scroll horizontal. Libros centrados.
- Dentro de cada balda (decorativos, `aria-hidden` implícito al ser `span` vacíos): `.techo`, `.pared.izq`, `.pared.der`, `.suelo` (trapecios con `clip-path` para la perspectiva), `.luz` (barra de latón), `.halo` (luz cálida en `soft-light` sobre los lomos). `::after` = portaetiquetas de latón en el canto.

### Lomo `.lomo` (botón)
- Ancho 26–35 px, alto 124–164 px (variación por id). `data-id`, `data-st`.
- Colores de tela: `#6e2a26 #1f2d47 #b8913f #4f3348 #e6dcc6 #a14f2c #2b4a52 #252424 #c9b08a #5a1f2c #39463b #d9cfb9`.
- Tinta automática según luminancia (> .3 → texto oscuro #221a14, si no #f4ecdc); filete dorado `--g` también según luminancia.
- 3 ediciones (`edicion = ESTILOS[(i*2+(i>>2))%3]`):
  - **clásico**: Bodoni cursiva + dos bandas doradas (arriba y abajo).
  - **moderno**: Manrope 800 mayúsculas espaciadas + sello circular abajo.
  - **condensado**: Oswald mayúsculas + franja clara arriba.
- Volumen: gradiente horizontal (sombra-brillo-sombra) + sombra proyectada a la derecha.
- Estado «Leyendo»: `.cinta` de latón (marcapáginas) asomando por arriba.
- Hover/pulsado: sube 5 px.

### Portada (generada)
152 × 228 px, misma tela y tinta que el lomo, bisagra oscura a la izquierda y reflejo diagonal.
- **clásico**: marco doble dorado, ornamento de rombo, título Bodoni cursiva centrado, autor en versalitas.
- **moderno**: autor arriba, título Manrope 800 mayúsculas abajo, círculo grande translúcido.
- **condensado**: título Oswald enorme, autor abajo con filete.
- Tamaño de título según longitud (3 escalones).
- En producción: usar la portada real (API de libros) cuando exista; la generada es el respaldo.

### Libro 3D `#escenario` + `.libro3d`
- `#escenario`: capa fija, `perspective: 1300px`, entre `#velo` (z 10) y `#hoja` (z 12).
- `.libro3d` (`transform-style: preserve-3d`) con 6 caras: `tapa` (portada), `trasera`, `canto` (el lomo, mismo HTML que en el estante), `hojas` (cantos de página), `sup`, `inf`. Grosor T = ancho del lomo escalado.
- **Animación al tocar un lomo (1000 ms, `cubic-bezier(.22,.8,.24,1)`):**
  1. Pose inicial exactamente encima del lomo: `rotateY(90deg)` y escala = alto lomo / 228. El lomo original se oculta (`visibility:hidden`).
  2. 0–30 %: sale hacia el usuario (`translateZ +110px`, sube 8 px).
  3. 30–100 %: viaja al centro del hueco libre sobre la hoja, gira a `rotateY(-18deg) rotateX(5deg)` mostrando la portada, escala hasta 1–1,12.
- La hoja sube con 120 ms de retraso (coreografía).
- **Arrastrar el libro lo gira** (Y ±160°, X ±25°); al soltar vuelve a la pose con muelle (600 ms).
- **Cerrar** (velo, Listo o Esc): vuelve a su hueco exacto del estante (700 ms) y reaparece el lomo. Si el lomo ya no es visible (filtro), cae hacia abajo y se desvanece.
- Desde el 3D de three.js: entra desde abajo.
- Desde el escáner: nace del marco del visor; «Añadir al anaquel» vuela hasta la pestaña Anaquel; «Cancelar» vuelve al visor.
- `prefers-reduced-motion`: duración 0.

### Hoja `#hoja` (ficha)
- Radio 28, asa superior, máx. 56 % de alto (para que la portada quepa encima).
- Etiqueta de estado en latón (mayúsculas), título Bodoni 30, autor Manrope.
- Filas Año / ISBN (mono).
- Estado de lectura: control segmentado de 3 (`.chip[data-e]`), cambiar estado actualiza estante, contadores y cinta sin cerrar la hoja.
- Botones: «Prestar» (secundario, contorno) y «Listo» (tinta).
- `#velo`: oscurece y desenfoca (`blur(6px)`).

### Escáner `#escanear`
- Visor oscuro cálido, marco 2:1 con 4 esquinas blancas (no recuadro completo), resto de pantalla oscurecido.
- Línea de barrido latón claro #e2bb72 con brillo; se para con movimiento reducido.
- Texto «Apunta al código de barras» en Bodoni 24 + subtítulo.
- Botón claro «Simular lectura» (modo desarrollo).

### Barra inferior
- Cristal con blur, iconos SVG de trazo (estantería y código de barras), etiqueta 11 px.
- Activa: texto `--fg` + punto latón debajo.

### Pista `#pista`
Pastilla de cristal flotante: «Toca un libro para sacarlo del anaquel» (en 3D: «Arrastra para recorrer el anaquel · toca un libro»).

---

## 5. IDs y clases que usa el script (mantener)
`#estanteria #escanear #plano #escena #filtros .chip[data-f] .lomo #hoja #velo #tab-estanteria #tab-escanear #simular #cuenta #pista`

**Añadidos:** `#escenario`, `#indicador`, `.mueble`, `.balda` + decorativos (`.techo .pared .suelo .luz .halo`), dentro de `.lomo`: `.zona .tit .banda .sello .franja .cinta`, `.libro3d` y sus caras, `.portada.{clasico|moderno|condensado}`.

---

## 6. Errores del original corregidos
- Los filtros seguían visibles en Escanear (`.filtros{display:flex}` anulaba `[hidden]`) → regla global `[hidden]{display:none!important}`.
- La estantería plana se salía por debajo de la barra inferior (`.plano` sin altura) → `position:absolute; inset:0`.
- 3 baldas fijas provocaban desbordamiento horizontal → baldas dinámicas según ancho.
- No se respetaba la zona segura superior → `env(safe-area-inset-top)`.

## 7. Datos de ejemplo corregidos
- «Estrella que cae» de John Green no existe → **«Bajo la misma estrella»** (2012).
- «Hombres buenos» (Pérez-Reverte) es de **2015**, no 2019.
- ISBN de ejemplo generados (falsos); en producción vienen del escaneo/API.

## 8. Pendiente para la app real
- Lectura de ISBN real (plugin de códigos de barras de Capacitor, EAN-13).
- API de metadatos de libros (título, autor, año, portada) y búsqueda manual / foto de portada si no hay resultado.
- Persistencia local y compartir la biblioteca con amigos.
- Flujo real de «Prestar».
- i18n (todos los textos centralizados).
