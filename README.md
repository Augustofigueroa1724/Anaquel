# Anaquel

App para catalogar tu biblioteca escaneando el ISBN con la cámara del móvil, y compartirla con amigos.

## Documentación
- [CLAUDE.md](CLAUDE.md): notas de trabajo y reglas.
- [docs/handoff/](docs/handoff/): paquete de diseño listo para implementar (dirección «Nogal y latón», tokens, prototipo y capturas).

## Estado
- Diseño cerrado en el paquete de traspaso. Implementación pendiente de elegir stack.
- Backend al final, cuando la app esté lista.

## Decisiones
| Fecha | Decisión | Motivo |
|---|---|---|
| Nov 2026 | Paleta «Nogal y latón», sin verde como acento | El verde pino parecía app de salud o bosque |
| Nov 2026 | Estantería en HTML como vista principal; 3D opcional | Debe verse bien aunque three.js no cargue |
| Nov 2026 | Escaneo con cámara del móvil (EAN-13) | Lectura directa del ISBN |
