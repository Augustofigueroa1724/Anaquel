# CLAUDE.md · Anaquel

App móvil para catalogar libros (iPhone y Android con Capacitor). El usuario escanea el ISBN con la cámara y el libro entra en su anaquel. Interfaz en español (se traducirá después).

## Estado
- Fase actual: diseño. El paquete de traspaso del diseño está en `docs/handoff/`.
- Stack no decidido todavía. Propuesta del paquete: Vite + TypeScript, sin framework pesado. Pendiente de visto bueno antes de instalar nada.
- El backend va al final, después de cerrar diseño y app.

## Fuente de verdad del diseño
- `docs/handoff/DISENO.md`: dirección «Nogal y latón», tokens, componentes, animaciones e historial de decisiones.
- `docs/handoff/prototipo/anaquel.html`: prototipo de referencia (un solo archivo, abrir a 390 px).
- `docs/handoff/diseno/tokens.css`: tokens de color y tipografía.
- `docs/handoff/capturas/`: pantallas claro y oscuro, y la animación de sacar el libro.
- `docs/handoff/PROMPT.md`: prompt de implementación.

## Reglas clave (de DISENO.md)
- No usar: verde como acento, crema o marfil cálidos, Fraunces, Newsreader, Tiempos, acentos terracota.
- El latón (`--accent`) solo para señales; los botones principales van en tinta (`--fg`).
- Ningún campo por debajo de 16 px; ningún scroll horizontal; respetar `safe-area`.
- Mantener los ids que usa el script del prototipo (`#estanteria`, `#escanear`, `#plano`, `#escena`, `#filtros`, `.chip[data-f]`, `.lomo`, `#hoja`, `#velo`, `#tab-estanteria`, `#tab-escanear`, `#simular`, `#cuenta`, `#pista`).
- El 3D (three.js) es opcional: la estantería HTML es la vista principal.

## Datos
- Modelo: `Libro { id, titulo, autor, anio, isbn, estado: 'leido'|'leyendo'|'pendiente', color, edicion }`.
- Los datos del prototipo son de ejemplo. El ISBN de ejemplo es falso.

## Trabajo
- Rama `main`, con merge automático salvo que se indique lo contrario.
- Cada decisión relevante se anota aquí y en `README.md`.
