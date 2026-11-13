# CLAUDE.md · Anaquel

App móvil para catalogar libros (iPhone y Android con Capacitor). El usuario escanea el ISBN con la cámara y el libro entra en su anaquel. Interfaz en español; los textos se traducirán después.

## Estado
- Fase: primera implementación (andamiaje, estantería, ficha, libro 3D animado, escáner simulado, datos en localStorage).
- Escáner nativo implementado (ML Kit vía Capacitor, EAN-13). Sin probar en dispositivo: no hay Mac ni SDK de Android aquí; se prueba en CI y en el Redmi.
- Búsqueda por ISBN: Google Books y, si falla, Open Library (`src/data/buscar-isbn.ts`), con tope de 8 s por petición.
- CI: `.github/workflows/ci.yml` (en cada push a main y PR: pruebas, build y humo). `android-build.yml` (a mano: APK de depuración y release firmada opcional). `ios-build.yml` (a mano: compila para el simulador sin firma; con `testflight=true`, registra el App ID en Ubuntu y después firma con fastlane match y sube a TestFlight; `fastlane/Fastfile`, bundle `app.anaquel.catalogo`).
- TestFlight necesita en este repo los secrets ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8, APPLE_TEAM_ID y MATCH_PASSWORD, y la app creada a mano en App Store Connect (la API de Apple no la crea).
- **Certificados de distribución de Apple (12 nov 2026):** la cuenta tiene un tope (2 o 3). Anaquel lo alcanzó porque cada app creó el suyo con match. Se revocaron dos sobrantes (no los de Fifth Square `78G9JJ88JS` ni Crate Mates `4Z5BYZ528H`). Regla para el futuro: **una app nueva reutiliza un certificado existente**, no crea otro; la lane `registra` lista los activos.
- **Icono (12 nov 2026):** Monograma C·2 (la «A» de Bodoni en latón con dos libros apoyados). Fuente: `tools/icono.svg`; `npm run iconos` regenera iOS (AppIcon y arranque), Android (mipmaps, adaptativo con fondo `#161618`, arranque) y la web (`public/favicon.png`, `apple-touch-icon.png`). Propuestas en `docs/mocks/iconos.html` e `icono-c.html`.
- **Cuentas y backend (opción B, 12 nov 2026):** Supabase del proyecto `cratemates`, tablas `aq_perfiles`, `aq_libros` (el Libro entero en `datos` jsonb) y `aq_amistades`, con RLS; funciones `aq_anaquel_de(amigo)` (sin notas ni préstamos) y `aq_borra_mi_cuenta()` (borra lo aq_* y el usuario de auth solo si no usa Crate Mates). Migración en `supabase/migrations/`. **La autenticación se comparte con Crate Mates**: nunca tocar tablas `cm_*`. Login: Apple nativo (plugin local `plugins/apple-signin`, copiado de Crate Mates) y Google por OAuth con vuelta a `anaquel://auth`. Sin sesión la app funciona en local con los ejemplos; al entrar, `src/app/cuenta.ts` descarga, suma lo local (salvo ejemplos) y sube cada cambio con 800 ms de espera; al salir vuelve a los ejemplos. **Libros de ejemplo:** llevan `ejemplo: true`; se ven mientras no hay libros propios (con o sin cuenta), nunca se suben al servidor y desaparecen al añadir el primer libro propio (escanear, importar o «Lo quiero» de un amigo). Con sesión, la cabecera muestra el círculo con tu foto de Google o tu inicial (abre ajustes).
- **Pestaña Añadir** (antes Escanear; el id sigue siendo `#tab-escanear`): primero dos tarjetas, «Código de barras» (abre el visor, con «Volver») y «A mano». **Añadir a mano:** (`src/features/manual/AnadirManual.tsx`): título (obligatorio), autor, género con el mismo selector, año e ISBN opcionales, «Lo tengo» o «Lo quiero» y estado. Avisa si el libro ya está. **Autocompletar** (`src/data/autocompletar.ts`): al escribir 3 letras en título o autor (o los dos), a los 350 ms busca en Google Books (`intitle:`/`inauthor:`, primero en español) y, si no hay nada, en Open Library; seis sugerencias con portada, y al tocar una rellena título, autor, año, ISBN y género. Sin red, el formulario funciona igual. Desde la red de las sesiones de Claude Google Books da 429 (cuota compartida) y Open Library no llega: se prueba con respuestas simuladas.
- **Pestañas:** Anaquel, Lo quiero (lista de deseos, `posesion: 'quiero'`), Añadir y Amigos (alias, solicitudes, anaquel del amigo de solo lectura y «Lo quiero» desde él). **Sugerencias** en la pestaña Lo quiero (`src/data/sugerencias.ts`): «Imprescindibles», una selección propia de literatura reconocida (clásicos y premiados, `src/data/imprescindibles.ts`, se amplía a mano) que rota cada día y pone primero tus géneros; y «De tus autores favoritos» con Google Books en español, descartando autoayuda, empresa, salud, religión, etc. (`NO_LITERATURA`). Solo literatura: nada de autoayuda. Rueda de ajustes en la cabecera: cuenta, borrar cuenta, importar de Goodreads (`src/data/goodreads.ts`).
- **Mueble nórdico (13 nov 2026):** botón en la cabecera (`#cambia-mueble`, solo en la pestaña Anaquel) que alterna el mueble clásico de nogal y latón con uno nórdico: pared de listones verticales de roble con juntas suaves (opción 1 de `docs/mocks/paredes-nordico.html`, tokens `--liston`, `--junta`), estantería abierta de roble claro con dos montantes negros, etiqueta del género en tinta, pestañas de separador blancas y cabecera sin serifa, en claro y oscuro. Preferencia del dispositivo (`anaquel.estilo.v1`, `src/app/estilo.ts`), aplicada como `data-estilo="nordico"` en `<html>` antes del primer pintado; todo el tema vive en `src/styles/nordico.css` y solo redefine tokens y el mueble. En este estilo el acento es la tinta, no el latón.
- **Trampas:** un selector de Zustand que devuelve un array nuevo (`s.libros.filter(...)`) mete a React en bucle (error 185); seleccionar `s.libros` y filtrar con `useMemo`. El CSS del prototipo pone `section{position:absolute;inset:0}`: dentro de pantallas usar `div`, no `section`.
- Pendiente: Play Store, arrastre del libro en móvil real, configurar Apple y Google en Supabase (ver README).

## Stack (aprobado)
- React 18 + Vite 5 + TypeScript 5. Estado con Zustand.
- Persistencia: localStorage detrás de `RepositorioLibros` (`src/data/repositorio.ts`). Se migra a SQLite antes de la tienda.
- Fuentes empaquetadas en local con `@fontsource` (Bodoni Moda, Manrope, Oswald, IBM Plex Mono).
- Pruebas: Vitest (lógica de dominio y datos).
- Proveedores: los mismos que el resto de proyectos (GitHub Actions para iOS y Android, Supabase y Railway cuando haya backend). No añadir proveedores nuevos sin consultar.

## Estructura
- `src/domain/`: modelo `Libro`, filtros, recuentos, reparto de baldas, tintas.
- `src/data/`: ejemplos, repositorio (interfaz y localStorage).
- `src/app/`: `App.tsx` (cáscara, pestañas), `biblioteca.ts` (store).
- `src/features/estanteria/`: mueble, baldas, lomos, filtros.
- `src/features/ficha/`: hoja de ficha y cambio de estado.
- `src/features/libro3d/`: libro que sale del estante (WAAPI + CSS 3D, geometría en `vuelo.ts`).
- `src/features/escaner/`: visor. Nativo: «Escanear»; web: «Simular lectura» (solo desarrollo).
- `src/platform/`: funciones que tocan plugins nativos. Fuera de la app devuelven `no-disponible` sin fallar.
- `android/`, `ios/`: proyectos Capacitor 6 generados con `npx cap add`. Los cambios nativos van en `AndroidManifest.xml` (CAMERA y metadatos de ML Kit) e `Info.plist` (NSCameraUsageDescription).
- `src/styles/anaquel.css`: CSS del prototipo, sin cambios salvo nota. Contiene los tokens (`:root`).
- `docs/handoff/`: paquete de diseño (fuente de verdad visual).

## Fuente de verdad del diseño
- `docs/handoff/DISENO.md`: dirección «Nogal y latón», tokens, componentes, animaciones e historial de decisiones.
- `docs/handoff/prototipo/anaquel.html`: prototipo de referencia (a 390 px).
- `docs/handoff/capturas/`: pantallas claro y oscuro, y la animación de sacar el libro.

## Reglas clave
- No usar: verde como acento, crema o marfil cálidos, Fraunces, Newsreader, Tiempos, acentos terracota.
- El latón (`--accent`) solo para señales; los botones principales van en tinta (`--fg`).
- Ningún campo por debajo de 16 px; ningún scroll horizontal; respetar `safe-area`.
- La animación del libro es CSS 3D con Web Animations (no three.js). La estantería HTML es la vista principal y no depende de ella.
- Respetar `prefers-reduced-motion`: duración 0.
- Mantener los ids del prototipo mientras se porta (`#estanteria`, `#escanear`, `#plano`, `#filtros`, `#hoja`, `#velo`, `#tab-estanteria`, `#tab-escanear`, `#simular`, `#cuenta`, `#pista`).

## Datos
- Modelo: `Libro { id, titulo, autor, anio, isbn, estado, color, edicion, genero?, notas?, prestamo? }`.
- **Géneros:** cada género ocupa **una balda en carrusel** (lomos a la izquierda, se desliza en horizontal sin límite de libros; degradado a la derecha si hay más). La placa de latón lleva el nombre y el número de libros y al tocarla filtra (`filtroGenero` en el store; la pastilla `GeneroActivo` lo quita). Un ISBN escaneado trae el género de las categorías de Google Books (`generoDesdeCategorias`). **Catálogo de géneros** (como los tipos de sitio de Fifth Square): los base en `GENEROS_BASE` y los que añade la gente en la tabla común `aq_generos` (aplicada en Supabase el 13 nov 2026; sin duplicados sin distinguir mayúsculas; `aq_borra_genero` solo borra si ningún libro lo usa). **Separadores** dentro de cada balda (`seccionesPorAutor` en `libro.ts`): tarjeta metida entre dos lomos que no ocupa hueco (ancho 0) y solo asoma su pestaña de latón, que nace del hueco entre los dos libros y se abre sobre el de la izquierda (no centrada), recta y siempre arriba del todo de la balda (riel y separador con `align-self: stretch`), por encima de los lomos sin taparlos (lomos de 124 a 164 px y balda de 236 px de alto, en los dos muebles, `docs/mocks/nordico.html`; antes los lomos bajaban un 25 %, pero se cortaban los títulos; forma de la propuesta C de `docs/mocks/separadores.html`, con el texto en vertical), con solo el primer apellido del autor («García», «Murakami») si tiene más de un libro, o con la letra de su apellido para los sueltos (la letra solo si agrupa más de 2 libros, `conPestana`); orden alfabético por apellido (`apellido()`: sin iniciales ni partículas, con tres palabras o más el primer apellido). Se eligen con chips en `SelectorGenero` y «+ Nuevo»; sin sesión los nuevos quedan en el móvil (`src/data/generos.ts`).
- **Ficha:** estado y género arriba, autor y año en una línea, notas del lector (se guardan solas) e ISBN pequeño al pie.
- Los datos de ejemplo son ficticios; los ISBN son falsos.
- Un ISBN leído se busca por Google Books (con CORS) y después Open Library. No se guarda nada del usuario en esas consultas, solo el ISBN.

## Comandos
- `npm run dev`: desarrollo.
- `npx cap sync android|ios`: copia la web a los proyectos nativos (tras `npm run build`).
- `npm run build`: comprobación de tipos y build.
- `npm test`: pruebas unitarias.
- `npm run humo`: prueba de humo en Chromium contra la build (con `PLAYWRIGHT_CHROMIUM` si el navegador no está en la ruta por defecto).

## Trabajo
- Rama `main`, con merge automático salvo que se indique lo contrario.
- Cada decisión relevante se anota aquí y en `README.md`.
