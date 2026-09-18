---
titulo: "Cómo quitar el fondo blanco de una imagen y dejarlo transparente"
descripcion: "Los fondos blancos lisos no necesitan IA: se recortan por color en segundos. Qué hacen la tolerancia y el suavizado, y por qué el resultado debe ser PNG."
categoria: "tutoriales"
fecha: "2026-08-06"
keywords:
  - "quitar fondo blanco imagen"
  - "fondo transparente png"
  - "hacer fondo transparente online"
  - "quitar fondo blanco logo"
  - "imagen con fondo transparente gratis"
autor: "Equipo ToolsFoto"
publicado: true
---

Un logo descargado en JPG, una firma escaneada o una foto de producto tomada sobre cartulina tienen algo en común: llegan con un rectángulo blanco pegado que se nota en cuanto los colocas sobre un fondo de color. La solución no siempre pasa por la inteligencia artificial. Cuando el fondo es de un color liso, hay un método más rápido y más preciso.

La herramienta [Quitar fondo blanco](/quitar-fondo-blanco) borra los píxeles que se parecen al color que le indiques y te devuelve un PNG con transparencia real, sin descargar ningún modelo y sin subir el archivo a ningún servidor.

## Recorte por color o recorte con IA: cuál te conviene

Son dos herramientas distintas para dos problemas distintos.

| | Recorte por color | Recorte con IA |
|---|---|---|
| **Cómo decide** | Compara cada píxel con un color | Identifica al sujeto de la imagen |
| **Fondo ideal** | Liso y uniforme | Cualquiera, incluso complejo |
| **Velocidad** | Instantáneo | Unos segundos |
| **Descarga previa** | Ninguna | Modelo de unos 50 MB |
| **Control del resultado** | Total (tolerancia y bordes) | Automático |

Si fotografiaste el producto sobre una caja de luz, escaneaste un documento o descargaste un logo con fondo plano, el recorte por color gana: es inmediato y el borde queda limpio. Si el fondo es un paisaje, una habitación o cualquier escena con texturas, necesitas el enfoque de [eliminar fondo con IA](/eliminar-fondo), que separa por forma y no por color.

## Los dos ajustes que lo deciden todo

### Tolerancia

Define cuánto puede alejarse un píxel del color elegido para que se considere fondo. Con el 0 % solo desaparece el color exacto; al subirla también caen los blancos rotos, las sombras suaves y el ruido de compresión del JPG.

- **Fotos de producto sobre fondo blanco de estudio:** 10–15 %.
- **Escaneos de papel:** 20–30 %. El papel nunca es blanco puro, siempre tiene un tinte gris o amarillento.
- **Logos e imágenes vectoriales exportadas:** 5 % basta, el fondo suele ser blanco exacto.

Si empiezas a ver agujeros en zonas claras del sujeto, has pasado el punto óptimo. Baja la tolerancia hasta que el sujeto vuelva a estar completo.

### Suavizado de bordes

Añade una franja de transparencia progresiva justo después del umbral de tolerancia. Sin él, el borde queda cortado a cuchillo y se nota el montaje; con él, la transición es gradual y el recorte se integra con el nuevo fondo.

Un punto de partida que funciona en la mayoría de casos: **12 % de tolerancia y 8 % de suavizado**.

## Por qué el resultado tiene que ser PNG

El formato JPG no tiene canal alfa: no puede almacenar información de transparencia. Si guardas un recorte como JPG, el hueco se rellena de blanco y habrás deshecho todo el trabajo.

El PNG guarda 8 bits de transparencia por píxel, que es justo lo que necesita un borde suavizado. Si el archivo te pesa demasiado, conviértelo después a WebP con [Imagen a WebP](/imagen-a-webp): mantiene la transparencia y suele reducir el peso a la mitad.

## Cuando el sujeto contiene el color del fondo

Este es el límite del método. Una camisa blanca sobre fondo blanco, un vaso transparente o un objeto con reflejos muy claros pierden partes porque, para el algoritmo, esos píxeles son indistinguibles del fondo.

Tienes dos salidas:

1. **Bajar la tolerancia** hasta proteger el sujeto y asumir que quedará un halo fino de fondo alrededor.
2. **Cambiar de método** y usar el recorte con IA, que no mira el color sino la forma.

Por eso, si controlas la toma de la foto, conviene fotografiar sobre un fondo que **contraste** con el objeto: un producto blanco sobre fondo verde o azul se recorta perfecto por color. Es exactamente el mismo principio que el croma del cine, y la herramienta admite cualquier color, no solo el blanco.

## No solo blanco

El selector de color acepta cualquier tono. Los casos habituales más allá del blanco:

- **Verde croma** en fotos de estudio.
- **Negro** en capturas de pantalla de aplicaciones en modo oscuro.
- **Un color plano concreto** en ilustraciones y diseños exportados.

Elige el color exacto con el selector personalizado y ajusta la tolerancia igual que harías con el blanco.

## Todo ocurre en tu navegador

El recorte se hace con la Canvas API leyendo los píxeles en memoria, dentro de tu propio equipo. Ningún archivo se sube a un servidor, no hay cola de procesamiento ni almacenamiento temporal. Puedes recortar catálogos enteros de fotos de producto sin que ninguna imagen salga de tu dispositivo.
