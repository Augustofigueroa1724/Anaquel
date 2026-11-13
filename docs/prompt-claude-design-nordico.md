# Prompt para Claude Design: mueble nórdico de Anaquel

Pegar en Claude Design junto con `nordico-actual-claro.png` y `nordico-actual-oscuro.png` (en `docs/mocks/`).

---

Diseña una alternativa «nórdica» para la estantería de Anaquel, una app móvil (iPhone y Android, 390 px de ancho) para catalogar los libros de casa. Te adjunto cómo está ahora. No me convence: parece un mueble genérico. Quiero algo que se reconozca al instante como diseño escandinavo contemporáneo, cálido y con carácter, de revista de interiorismo (piensa en String, Muuto, HAY, Montana o una librería de roble en un piso de Copenhague), sin caer en lo frío ni en lo de catálogo barato.

## Qué es la pantalla
- Cabecera: «Mi biblioteca», el nombre «Anaquel», el número de libros, un botón para cambiar de mueble y la rueda de ajustes.
- Debajo, un control segmentado de filtros: Todos, Leyendo, Pendientes, Leídos, con su número.
- El mueble: una balda por género (Novela, Clásicos, Poesía…). Cada balda es un carrusel horizontal de lomos que se desliza con el dedo, y lleva una etiqueta con el nombre del género y el número de libros, que al tocarla filtra.
- Lomos: libros de 26 a 35 px de ancho y 124 a 164 px de alto, de colores de tela variados, con el título en vertical. Hay tres ediciones de lomo (clásica con bandas doradas, moderna con sello circular, condensada con franja). No hace falta rediseñar los lomos.
- Separadores: entre los libros de un mismo autor sale una pestaña con su apellido en vertical, o con una letra para los autores sueltos. Nace del hueco entre dos libros, se abre hacia la izquierda, queda arriba del todo de la balda y no puede tapar los títulos.
- Barra de pestañas abajo: Anaquel, Lo quiero, Añadir, Amigos.

## Lo que me gusta y se queda
- Las etiquetas tipo Dymo: cinta negra brillante y recta con letras blancas en relieve, en letra de máquina de escribir (tipo Courier). En la placa del género y en las pestañas de los separadores.
- Pared de listones verticales de madera con juntas suaves, o una alternativa igual de cálida.

## Lo que quiero que mejores
- El mueble entero: estructura, proporciones, material, cómo se apoyan las baldas, luz y sombra. Que tenga presencia.
- La relación entre pared, mueble y libros: ahora todo es del mismo tono y se empasta.
- Cabecera, filtros y barra inferior en el mismo lenguaje.
- Modo claro y modo oscuro, los dos cuidados.

## Restricciones técnicas (es CSS sobre HTML, no imágenes)
- Todo se tiene que poder hacer con CSS: degradados, sombras, bordes y SVG pequeños en línea. Sin fotos ni texturas en bitmap.
- Ninguna línea de scroll horizontal en la página (solo dentro de cada balda); márgenes laterales de al menos 16 px; zona segura arriba y abajo.
- Campos de texto de 16 px como mínimo y objetivos táctiles de 44 px.
- Fuentes disponibles: Manrope, Oswald, IBM Plex Mono, Bodoni Moda, más Courier New del sistema. Si propones otra, dime cuál y por qué.
- Evitar: verde como acento, fondos crema o marfil cálidos, terracota.
- Altura de cada balda: unos 236 px (por los lomos altos y las pestañas encima).

## Qué te pido
1. Dos o tres propuestas visuales de la pantalla completa, en claro y en oscuro, para elegir.
2. Cuando elija una, un prompt para Claude Code (el que programa la app) con todo lo necesario para implementarla, sin ambigüedades:
   - Paleta en tokens CSS con valores exactos, para claro y para oscuro.
   - Por pieza (pared, mueble, balda, tabla de la balda, montantes o laterales, placa del género, pestañas de separador, cabecera, filtros, barra inferior): forma, medidas en px, colores, degradados, sombras, radios y tipografía.
   - Qué hacer con las piezas decorativas que existen hoy en cada balda (`.techo`, `.pared.izq`, `.pared.der`, `.suelo`, `.luz`, `.halo`) y con los pseudoelementos del mueble (`.mueble::before`, `.mueble::after`): reutilizarlas, ocultarlas o cambiarlas.
   - Todo bajo el selector `:root[data-estilo="nordico"]`, que es como la app activa este mueble, con el modo oscuro en `@media (prefers-color-scheme: dark)` y en `[data-theme="dark"]`.
   - Las capturas o el HTML de la propuesta elegida, para comparar el resultado.
