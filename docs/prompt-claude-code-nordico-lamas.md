# Prompt para Claude Code: mueble nórdico «Lamas» de Anaquel

Pegar en Claude Code junto con `nordico-lamas.html`, `nordico-lamas-claro.png` y `nordico-lamas-oscuro.png` (guardarlos en `docs/mocks/`).

---

Rediseña el mueble «nórdico» de la estantería de Anaquel según la propuesta «Lamas». Idea: Bang & Olufsen. Baldas y perfiles de aluminio cepillado muy finos sobre una trasera de lamas estrechas de roble, colgado de una pared de yeso gris liso. Nada de contornos gruesos ni colores planos: el lujo sale de perfiles de 3 px, degradados metálicos y sombras suaves.

Referencia visual obligatoria: `docs/mocks/nordico-lamas.html` (claro e izquierda, oscuro a la derecha, con estilos en línea para leer cada valor) y las dos capturas. Si algo de este texto contradice al HTML, manda el HTML y avísame.

## Reglas

- Solo CSS: degradados, sombras, bordes y SVG en línea. Sin imágenes.
- Todo bajo `:root[data-estilo="nordico"]`. Oscuro en `@media (prefers-color-scheme: dark)` y en `[data-theme="dark"]`. No toques los demás muebles.
- No cambies el HTML ni los lomos de los libros. Si una pieza no se puede resolver solo con CSS, para y pregúntame antes de tocar el marcado.
- Los nombres de selector de este documento que no sean `.mueble`, `.techo`, `.pared.izq`, `.pared.der`, `.suelo`, `.luz` y `.halo` son descriptivos. Localiza el selector real de cada pieza en el código antes de escribir.
- Sin scroll horizontal de página; solo dentro de cada balda. Objetivos táctiles de 44 px como mínimo. Respeta las zonas seguras.
- Sin verde de acento, sin fondos crema o marfil, sin terracota. Este mueble no tiene color de acento: el estado activo se marca con el color del texto.
- Fuentes: Manrope (interfaz) y Courier New (etiquetas Dymo). No hace falta ninguna nueva. Manrope se usa en pesos 500 y 600; comprueba que estén cargados.

## 1. Tokens

```css
:root[data-estilo="nordico"] {
  /* Pared de yeso */
  --n-pared: radial-gradient(140% 60% at 15% 0%, rgba(255,255,255,.7), rgba(255,255,255,0) 60%),
             linear-gradient(175deg, #e4e3e0 0%, #d0cecb 100%);
  /* Texto e interfaz */
  --n-texto: #18191a;
  --n-texto-2: #45474a;
  --n-filete: rgba(24,25,26,.16);
  --n-barra: #ecebe9;
  --n-aviso: rgba(250,250,249,.94);
  /* Aluminio */
  --n-alu: linear-gradient(180deg, #fbfbfb 0%, #dfe1e2 22%, #b9bcbe 62%, #8f9396 100%);
  --n-alu-perfil: linear-gradient(90deg, #ffffff, #c4c7c9, #8f9396);
  --n-alu-brillo: rgba(255,255,255,.9);
  /* Lamas de roble: periodo de 12 px */
  --n-lama-junta: #5d4a34;
  --n-lama-canto: #b3956e;
  --n-lama-luz: #d3b991;
  --n-lama: #c7ab82;
  --n-lama-sombra: #a88a62;
  --n-lamas-velo: linear-gradient(180deg, rgba(255,255,255,.26) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,.14) 100%);
  --n-sombra-balda: rgba(0,0,0,.5);   /* sombra de la balda superior sobre las lamas */
  /* Libros y separadores */
  --n-cinta: #18191a;                 /* cinta marcapáginas */
  --n-separador: rgba(24,25,26,.5);
}

/* Oscuro: mismos nombres, estos valores. Aplícalos en los dos sitios. */
@media (prefers-color-scheme: dark) {
  :root[data-estilo="nordico"] { /* valores oscuros */ }
}
:root[data-estilo="nordico"][data-theme="dark"] { /* valores oscuros */ }
```

Valores oscuros:

| Token | Oscuro |
|---|---|
| `--n-pared` | `radial-gradient(140% 60% at 15% 0%, rgba(255,255,255,.06), rgba(255,255,255,0) 60%), linear-gradient(175deg, #232426 0%, #17181a 100%)` |
| `--n-texto` | `#f3f3f1` |
| `--n-texto-2` | `#b4b5b6` |
| `--n-filete` | `rgba(255,255,255,.16)` |
| `--n-barra` | `#161718` |
| `--n-aviso` | `rgba(28,29,31,.92)` |
| `--n-alu` | `linear-gradient(180deg, #8d9194 0%, #5c6063 25%, #3b3e41 65%, #26282a 100%)` |
| `--n-alu-perfil` | `linear-gradient(90deg, #707477, #9a9ea1, #3b3e41)` |
| `--n-alu-brillo` | `rgba(255,255,255,.35)` |
| `--n-lama-junta` | `#0f0b08` |
| `--n-lama-canto` | `#3d2f23` |
| `--n-lama-luz` | `#56432f` |
| `--n-lama` | `#4a3a2a` |
| `--n-lama-sombra` | `#33271c` |
| `--n-lamas-velo` | `linear-gradient(180deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,.28) 100%)` |
| `--n-sombra-balda` | `rgba(0,0,0,.75)` |
| `--n-cinta` | `#f3f3f1` |
| `--n-separador` | `rgba(255,255,255,.5)` |

Si la app tiene forma de forzar el modo claro (por ejemplo `[data-theme="light"]`), haz que el bloque de `@media` no se aplique en ese caso.

## 2. Piezas

Medidas para 390 px de ancho.

### Pared (fondo de la pantalla)
- `background: var(--n-pared)`. Lisa, sin listones. Los listones pasan a ser la trasera del mueble.

### Mueble (`.mueble`)
- Márgenes: 26 px arriba, 19 px a cada lado. Con el vuelo de las baldas (3 px), el borde visible queda a 16 px.
- `padding: 3px 3px 0; background: var(--n-alu);` El padding superior de 3 px es el perfil de arriba.
- `box-shadow: 0 34px 40px -26px rgba(0,0,0,.65);` Sin radio.
- `.mueble::before` y `.mueble::after`: perfiles laterales. `position: absolute; top: 0; bottom: 0; width: 3px; background: var(--n-alu-perfil); z-index: 2;` uno con `left: 0` y otro con `right: 0`.

### Balda (bloque de 236 px por género)
- Interior de 226 px + tabla de 10 px.
- Interior (el contenedor que no se desplaza, no la tira de libros, para que las lamas no se muevan con el carrusel):
  ```css
  background:
    var(--n-lamas-velo),
    repeating-linear-gradient(90deg,
      var(--n-lama-junta) 0 1.5px,
      var(--n-lama-canto) 1.5px 2.5px,
      var(--n-lama-luz) 2.5px 6px,
      var(--n-lama) 6px 11px,
      var(--n-lama-sombra) 11px 12px);
  box-shadow: inset 0 26px 24px -18px var(--n-sombra-balda);
  overflow: hidden;
  ```
- Tira de libros: alineada abajo, `gap: 2px`, primer libro a 24 px del borde izquierdo.

### Tabla de la balda (`.suelo`)
- `height: 10px; margin: 0 -6px; border-radius: 1px; background: var(--n-alu); position: relative; z-index: 1;`
- `box-shadow: 0 16px 20px -10px rgba(0,0,0,.6), inset 0 1px 0 var(--n-alu-brillo);`
- El margen negativo hace que la tabla vuele 3 px por fuera de los perfiles laterales.

### Piezas decorativas actuales
| Pieza | Qué hacer |
|---|---|
| `.suelo` | Reutilizar como tabla de aluminio (arriba). |
| `.mueble::before`, `.mueble::after` | Reutilizar como perfiles laterales de 3 px. |
| `.techo` | Ocultar (`display: none`). La sombra superior ya la da el `inset` del interior. |
| `.pared.izq`, `.pared.der` | Ocultar. No hay laterales por balda; los perfiles son del mueble. |
| `.luz`, `.halo` | Ocultar. No hay luz puntual; la luz es el velo de las lamas. |

Si alguna de estas piezas hace hoy algo más que decorar (por ejemplo, recortar el scroll), dímelo en vez de ocultarla.

### Libros
- No se rediseñan. Solo cambia la sombra: `box-shadow: 6px 2px 10px -3px rgba(0,0,0,.5), 1px 0 0 rgba(0,0,0,.15);`
- Cinta marcapáginas: `background: var(--n-cinta)`.

### Etiquetas Dymo (se mantienen)
Estilo común, igual en claro y oscuro:
```css
background: linear-gradient(180deg, #3d3d40 0%, #17171a 20%, #09090a 58%, #26262a 100%);
color: #f6f6f3;
font-family: 'Courier New', Courier, monospace;
font-weight: 700;
text-shadow: 0 1px 0 rgba(0,0,0,.9), 0 -1px 0 rgba(255,255,255,.3);
box-shadow: inset 0 1px 0 rgba(255,255,255,.28), 0 2px 5px rgba(0,0,0,.45);
border-radius: 1px;
```
- Placa del género: `font-size: 13px; letter-spacing: .22em; line-height: 1.1; padding: 5px 12px;` Centrada en horizontal y montada sobre la tabla (el centro de la placa coincide con la tabla). Zona táctil de 44 px de alto aunque la placa mida unos 24 px.
- Pestaña de separador: texto en vertical, `font-size: 9.5px; letter-spacing: .08em; line-height: 1; padding: 5px 3px;` Arriba del todo de la balda (a 8 px del techo del interior), abierta hacia la izquierda desde su línea. No puede tapar títulos.
- Línea del separador: `width: 1.5px; background: var(--n-separador); margin: 0 2px;` de la pestaña hasta la tabla.

### Cabecera
- `padding: 24px 12px 0 24px` más la zona segura superior.
- «Mi biblioteca»: 9.5 px, peso 600, `letter-spacing: .28em`, mayúsculas, `var(--n-texto-2)`.
- «Anaquel»: Manrope 32 px, peso 500, `letter-spacing: -.03em`, `line-height: 1.05`, `var(--n-texto)`.
- Botones de mueble y ajustes: 44 × 44 px, icono de 22 px, trazo de 1.25 px, `var(--n-texto)`.
- «18 LIBROS»: 9.5 px, peso 600, `letter-spacing: .24em`, `var(--n-texto-2)`.

### Filtros
- Sin fondo ni píldora. Fila con `margin: 10px 24px 0`, repartida con `justify-content: space-between`, y filete inferior `box-shadow: inset 0 -1px 0 var(--n-filete)`.
- Cada filtro: `min-height: 48px; padding-bottom: 6px;` nombre y número en línea con `gap: 6px`.
- Nombre: 13 px, `letter-spacing: .01em`. Inactivo: peso 500, `var(--n-texto-2)`. Activo: peso 600, `var(--n-texto)`.
- Número: 11 px, peso 500, `var(--n-texto-2)`.
- Activo: subrayado `box-shadow: inset 0 -1.5px 0 var(--n-texto)`.

### Aviso («Toca un libro…»)
- Píldora centrada, 16 px por encima de la barra inferior.
- `padding: 8px 16px; border-radius: 999px; background: var(--n-aviso); color: var(--n-texto); font-size: 12px; font-weight: 500;`
- `box-shadow: inset 0 0 0 1px var(--n-filete), 0 10px 24px -14px rgba(0,0,0,.5);`

### Barra inferior
- `background: var(--n-barra); box-shadow: inset 0 1px 0 var(--n-filete);` más la zona segura inferior.
- Cuatro columnas iguales, `min-height: 64px`, icono de 22 px con trazo de 1.25 px, `gap: 6px`.
- Texto: 10.5 px, `letter-spacing: .04em`. Inactivo: peso 500, `var(--n-texto-2)`. Activo: peso 600, `var(--n-texto)`. Sin punto ni barra de acento.

## 3. Comprobación

1. Abre la app con `data-estilo="nordico"` a 390 px, en claro y en oscuro, y compárala con las dos capturas y con `nordico-lamas.html`.
2. Desliza una balda: las lamas no se mueven, los libros sí. No aparece scroll horizontal de página.
3. Con 10 o más libros en una balda, el último se corta contra el perfil derecho, sin taparlo.
4. Las pestañas de separador no pisan ningún título, tampoco junto a un lomo de 164 px.
5. Los demás muebles se ven igual que antes.
6. Dime qué has comprobado y qué no, y cualquier selector que no hayas encontrado.

Al terminar, documenta el cambio en `CLAUDE.md` y `README.md`.
