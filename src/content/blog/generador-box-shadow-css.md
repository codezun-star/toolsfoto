---
titulo: "Cómo crear sombras CSS con box-shadow (guía práctica)"
descripcion: "Las sombras dan profundidad a tus interfaces. Te explico cómo funciona box-shadow, sus parámetros y cómo conseguir sombras suaves y realistas con un generador visual."
categoria: "tutoriales"
fecha: "2026-06-10"
keywords:
  - "generador box-shadow CSS"
  - "crear sombras CSS"
  - "box-shadow ejemplos"
  - "sombra suave CSS"
  - "box shadow online"
autor: "Equipo ToolsFoto"
publicado: true
---

Las sombras son uno de los recursos más usados en diseño de interfaces: separan tarjetas del fondo, dan sensación de profundidad y guían la atención. En CSS se crean con la propiedad `box-shadow`.

El [Generador de box-shadow CSS](/sombra-css) te deja diseñarlas con sliders y copiar el código al instante.

## Anatomía de box-shadow

La sintaxis básica es:

```css
box-shadow: offsetX offsetY blur spread color;
```

- **offsetX:** desplazamiento horizontal de la sombra.
- **offsetY:** desplazamiento vertical (positivo = hacia abajo).
- **blur:** desenfoque. Cuanto mayor, más difusa la sombra.
- **spread:** expansión. Agranda o encoge la sombra.
- **color:** color de la sombra, normalmente con transparencia (rgba).

También existe la palabra clave `inset`, que dibuja la sombra hacia dentro del elemento.

## El secreto de una sombra realista

Las sombras duras y oscuras delatan un diseño poco cuidado. Para conseguir una sombra natural:

- Desplazamiento vertical pequeño (4–10px).
- Desenfoque alto (20–40px).
- Expansión ligeramente negativa.
- Opacidad baja (10–25%).

Esto imita cómo cae la luz natural sobre un objeto ligeramente elevado.

```css
box-shadow: 0 8px 24px -4px rgba(17, 17, 16, 0.2);
```

## Sombras interiores (inset)

La sombra `inset` es perfecta para campos de formulario, botones presionados o efectos de relieve hundido:

```css
box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.15);
```

## Cómo usar el generador

1. Abre [Generador de box-shadow CSS](/sombra-css).
2. Ajusta desplazamiento, desenfoque, expansión, color y opacidad con los sliders.
3. Observa la vista previa en tiempo real.
4. Copia el código y pégalo en tu CSS.

Funciona en cualquier proyecto: HTML puro, React, Vue o clases arbitrarias de Tailwind.

## Herramientas relacionadas

- [Generador de gradientes CSS](/gradiente-css).
- [Convertir colores](/convertir-color) entre formatos.
- [Verificador de contraste](/contraste-color) para la accesibilidad.

Todo ocurre en tu navegador, sin enviar nada a un servidor.
