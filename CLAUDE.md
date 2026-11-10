# CLAUDE.md · Anaquel

App móvil para catalogar libros (iPhone y Android con Capacitor). El usuario escanea el ISBN con la cámara y el libro entra en su anaquel. Interfaz en español; los textos se traducirán después.

## Estado
- Fase: primera implementación (andamiaje, estantería, ficha, libro 3D animado, escáner simulado, datos en localStorage).
- Pendiente: escáner nativo, búsqueda real por ISBN, arrastre del libro validado en móvil real, Capacitor (iOS y Android), CI, backend (al final).

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
- `src/features/escaner/`: visor (simulado por ahora).
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
- Modelo: `Libro { id, titulo, autor, anio, isbn, estado: 'leido'|'leyendo'|'pendiente', color, edicion: 'clasico'|'moderno'|'condensado' }`.
- Los datos de ejemplo son ficticios; los ISBN son falsos.

## Comandos
- `npm run dev`: desarrollo.
- `npm run build`: comprobación de tipos y build.
- `npm test`: pruebas unitarias.

## Trabajo
- Rama `main`, con merge automático salvo que se indique lo contrario.
- Cada decisión relevante se anota aquí y en `README.md`.
