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
- Pendiente: Play Store, arrastre del libro en móvil real, backend (al final).

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
- Modelo: `Libro { id, titulo, autor, anio, isbn, estado: 'leido'|'leyendo'|'pendiente', color, edicion: 'clasico'|'moderno'|'condensado' }`.
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
