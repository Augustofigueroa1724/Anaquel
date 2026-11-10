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
- «Prestar» aún no tiene flujo.
- Pendiente: escáner nativo, búsqueda real por ISBN, Capacitor, CI y backend.

## Decisiones
| Fecha | Decisión | Motivo |
|---|---|---|
| Nov 2026 | Paleta «Nogal y latón», sin verde como acento | El verde pino parecía app de salud o bosque |
| Nov 2026 | Estantería en HTML como vista principal; 3D opcional | Debe verse bien aunque three.js no cargue |
| Nov 2026 | React + Vite + TypeScript, Zustand | Mismo stack que los otros proyectos |
| Nov 2026 | localStorage primero, detrás de un repositorio | Empezar rápido; migrar a SQLite antes de la tienda |
| Nov 2026 | Escaneo con cámara del móvil (EAN-13) | Lectura directa del ISBN |
| Nov 2026 | Libro 3D con CSS 3D y Web Animations, no three.js | Ligero, sin dependencias de WebGL; la estantería no depende de él |
