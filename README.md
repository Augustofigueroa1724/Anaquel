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
| Nov 2026 | Búsqueda por ISBN: Google Books primero, Open Library de respaldo | Google Books tiene CORS y cobertura amplia; Open Library sin clave |
| Nov 2026 | Libro 3D con CSS 3D y Web Animations, no three.js | Ligero, sin dependencias de WebGL; la estantería no depende de él |
