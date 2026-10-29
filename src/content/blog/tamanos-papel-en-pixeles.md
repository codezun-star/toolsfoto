---
titulo: "Tamaños de papel en píxeles: A4, A3, carta y fotos a 72, 96, 150 y 300 ppp"
descripcion: "Tabla de equivalencias de los tamaños de papel más usados (A4, A3, A5, carta, oficio, 10 × 15) en píxeles según la resolución, y cómo calcular cualquier medida."
categoria: "tips"
fecha: "2026-10-29"
herramientas: ["cambiar-dpi", "redimensionar", "jpg-a-pdf", "cambiar-tamano-pdf"]
keywords:
  - "A4 en píxeles"
  - "tamaño A4 300 dpi"
  - "medidas papel en píxeles"
  - "tamaño carta en píxeles"
  - "A3 en píxeles"
  - "10x15 en píxeles"
  - "convertir milímetros a píxeles"
  - "resolución para imprimir"
autor: "Equipo ToolsFoto"
publicado: true
---

Cuando diseñas algo para imprimir —un cartel, un folleto, una invitación o un documento escaneado— necesitas saber cuántos píxeles debe tener la imagen para que salga nítida en el papel. La respuesta depende de la resolución de impresión, que se mide en ppp (puntos o píxeles por pulgada, *dpi* en inglés).

## La tabla de equivalencias

| Tamaño | Medidas | 72 ppp | 96 ppp | 150 ppp | 300 ppp |
|---|---|---|---|---|---|
| A3 | 297 × 420 mm | 842 × 1191 | 1123 × 1587 | 1754 × 2480 | 3508 × 4961 |
| A4 | 210 × 297 mm | 595 × 842 | 794 × 1123 | 1240 × 1754 | 2480 × 3508 |
| A5 | 148 × 210 mm | 420 × 595 | 559 × 794 | 874 × 1240 | 1748 × 2480 |
| A6 | 105 × 148 mm | 298 × 420 | 397 × 559 | 620 × 874 | 1240 × 1748 |
| Carta (Letter) | 216 × 279 mm (8,5 × 11 in) | 612 × 792 | 816 × 1056 | 1275 × 1650 | 2550 × 3300 |
| Legal (EE. UU.) | 216 × 356 mm (8,5 × 14 in) | 612 × 1008 | 816 × 1344 | 1275 × 2100 | 2550 × 4200 |
| Oficio (México y otros) | 216 × 340 mm | 612 × 964 | 816 × 1285 | 1276 × 2008 | 2551 × 4016 |
| Foto 10 × 15 | 102 × 152 mm (4 × 6 in) | 288 × 432 | 384 × 576 | 600 × 900 | 1200 × 1800 |
| Foto 13 × 18 | 127 × 178 mm (5 × 7 in) | 360 × 504 | 480 × 672 | 750 × 1050 | 1500 × 2100 |
| Tarjeta de visita | 85 × 55 mm | 241 × 156 | 321 × 208 | 502 × 325 | 1004 × 650 |

Las medidas están en vertical (ancho × alto); para la orientación horizontal, intercambia los valores.

## ¿Qué resolución necesito?

- **300 ppp:** impresión de calidad — fotografías, folletos, revistas, tarjetas de visita, cualquier cosa que se mire de cerca. Es el estándar de las imprentas.
- **150 ppp:** impresión doméstica aceptable, carteles que se miran a un metro, documentos de oficina.
- **96 ppp:** la referencia de las pantallas de Windows y de la web («CSS píxel»). Un A4 a 96 ppp (794 × 1123) es el tamaño con que los navegadores maquetan un A4 al imprimir.
- **72 ppp:** la unidad de los PDF (1 punto = 1/72 de pulgada). Por eso un A4 en un PDF mide 595 × 842 puntos.

Para lonas y carteles grandes que se ven a varios metros bastan 72-100 ppp: nadie se acerca lo suficiente para ver los píxeles.

## Cómo calcular cualquier medida

La fórmula para pasar de milímetros a píxeles es:

**píxeles = milímetros ÷ 25,4 × ppp**

Por ejemplo, una invitación de 120 mm a 300 ppp necesita 120 ÷ 25,4 × 300 ≈ 1417 píxeles. Y al revés, para saber a qué tamaño puedes imprimir una foto de 4000 píxeles a 300 ppp: 4000 ÷ 300 × 25,4 ≈ 339 mm.

## Errores frecuentes

- **Cambiar los ppp no añade detalle.** Si una imagen tiene 800 píxeles de ancho, marcarla como 300 ppp no la hace apta para un A4: solo cambia el tamaño al que se imprime (68 mm). Para cambiar la etiqueta de resolución sin tocar los píxeles usa [Cambiar DPI](/cambiar-dpi); para ganar píxeles de verdad, [Mejorar calidad de imagen](/mejorar-calidad-imagen) con IA.
- **Ampliar sin más pixela.** Estirar una imagen pequeña con un editor la deja borrosa. Si no tienes un original mayor, la IA da resultados mucho mejores que un ampliado normal.
- **Olvidar el sangrado.** Las imprentas suelen pedir 3 mm de sangrado por cada lado: un A4 con sangrado mide 216 × 303 mm (2551 × 3579 px a 300 ppp).

Para ajustar los píxeles de una imagen a una medida concreta usa [Redimensionar imagen](/redimensionar); para meter imágenes en un PDF de tamaño A4 o carta, [JPG a PDF](/jpg-a-pdf) o [Cambiar tamaño de PDF](/cambiar-tamano-pdf).
