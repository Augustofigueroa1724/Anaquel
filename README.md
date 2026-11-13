# Anaquel

App para catalogar tu biblioteca escaneando el ISBN con la cámara del móvil, y compartirla con amigos.

## Documentación
- [CLAUDE.md](CLAUDE.md): stack, estructura y reglas de trabajo.
- [docs/handoff/](docs/handoff/): paquete de diseño «Nogal y latón».

## Desarrollo
```bash
npm install
npm run dev     # http://localhost:5173
npm test
npm run build
```

## Estado
- Estantería HTML con filtros, libro 3D que sale del estante, ficha con cambio de estado, escáner simulado y persistencia en localStorage.
- Préstamos: se anota a quién se presta y se marca devuelto. Sin lista de contactos ni recordatorios.
- Editar (título, autor, año, ISBN, estado) y quitar del anaquel, con confirmación.
- Escáner nativo con ML Kit (EAN-13) listo en código; pendiente de prueba en dispositivo.
- Búsqueda por ISBN con Google Books y Open Library.
- CI en GitHub Actions: pruebas, build y humo en cada push; APK de Android y compilación de iOS a mano.
- Pendiente: firma y TestFlight de iOS, Play Store, y backend.

## Decisiones
| Fecha | Decisión | Motivo |
|---|---|---|
| Nov 2026 | Paleta «Nogal y latón», sin verde como acento | El verde pino parecía app de salud o bosque |
| Nov 2026 | Estantería en HTML como vista principal; 3D opcional | Debe verse bien aunque three.js no cargue |
| Nov 2026 | React + Vite + TypeScript, Zustand | Mismo stack que los otros proyectos |
| Nov 2026 | localStorage primero, detrás de un repositorio | Empezar rápido; migrar a SQLite antes de la tienda |
| Nov 2026 | Escaneo con cámara del móvil (EAN-13) con @capacitor-mlkit/barcode-scanning 6.2 | Lectura directa del ISBN; mismo Capacitor 6 que el resto de apps |
| Nov 2026 | CI: Ubuntu para todo lo barato; macOS solo a mano | Cada minuto de macOS cuesta diez veces más |
| Nov 2026 | Préstamo = nombre libre y fecha, en el propio libro | Sin contactos ni servidor todavía; basta para saber dónde está el libro |
| Nov 2026 | Quitar libro con confirmación en la propia hoja, sin diálogos del sistema | Los diálogos nativos no encajan con la app y pueden no mostrarse en la web |
| Nov 2026 | Icono: monograma «A» en latón con dos libros apoyados (C·2) | Elegido entre seis propuestas; editorial y legible a 60 px |
| Nov 2026 | Una balda por género, con su nombre en la placa de latón | El mueble ya tenía placa; tocarla filtra por género |
| Nov 2026 | Ficha menos técnica: ISBN al pie y en pequeño; notas del lector | Lo que importa al lector va arriba |
| Nov 2026 | Cuentas en el Supabase de Crate Mates (tablas aq_*), login con Apple y Google | Sin coste nuevo; borrar cuenta respeta a quien también usa Crate Mates |
| Nov 2026 | Lista de deseos, valoración, importar de Goodreads y amigos | Las funciones de más valor vistas en Goodreads |
| Nov 2026 | Los libros de ejemplo se ven solo hasta añadir el primero propio, y nunca se guardan en la cuenta | El anaquel no se ve vacío al empezar, sin mezclar ejemplos con libros reales |
| Nov 2026 | Sugerencias: selección propia de literatura reconocida y otros libros de tus autores favoritos, sin autoayuda | Las tendencias de Open Library traían autoayuda y títulos en inglés |
| Nov 2026 | Una balda por género en carrusel, sin límite de libros | Antes un género con muchos libros ocupaba varias baldas |
| Nov 2026 | Catálogo común de géneros con «+ Nuevo», como los tipos de sitio de Fifth Square | Lista cerrada pero ampliable, sin duplicados |
| Nov 2026 | Búsqueda por ISBN: Google Books primero, Open Library de respaldo | Google Books tiene CORS y cobertura amplia; Open Library sin clave |
| Nov 2026 | Libro 3D con CSS 3D y Web Animations, no three.js | Ligero, sin dependencias de WebGL; la estantería no depende de él |
| 13 nov 2026 | Separadores en las baldas: pestaña con el autor (más de un libro) o la letra del apellido | Encontrar un libro de un vistazo, como las guías de una biblioteca |

## Configuración de Supabase para el login (una vez, en el panel)
Proyecto `cratemates` → Authentication:
1. **Providers → Apple**: añadir `app.anaquel.catalogo` a «Client IDs» (separado por coma de los que ya hay de Crate Mates).
2. **URL Configuration → Redirect URLs**: añadir `anaquel://auth` y `https://augustofigueroa1724.github.io/Anaquel/`.
3. **Providers → Google**: ya está activo por Crate Mates; no hace falta tocarlo.
